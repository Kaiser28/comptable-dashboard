'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { supabaseClient } from "@/lib/supabase";
import type { Client } from "@/types/database";

const TOTAL_STEPS = 9;

type FormStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type AssocieFormData = {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  adresse: string;
  email: string;
  telephone: string;
  profession: string;
  numero_cni: string;
  situation_matrimoniale: string;
  president: boolean;
  directeur_general: boolean;
  pourcentage_capital: number;
  nombre_actions: number;
  type_apport: string;
  montant_apport: number;
};

type PieceJointeForm = {
  id: string;
  nom_fichier: string;
  type_fichier: string;
  taille: number;
  file: File;
};

type FormState = {
  denomination: string;
  forme_juridique: string;
  duree_societe: number | "";
  date_cloture: string;
  objet_social: string;
  associes: AssocieFormData[];
  president_id: string;
  directeur_general_id: string | null;
  president_est_dg: boolean;
  capital_social: number | "";
  nombre_actions_total: number;
  montant_libere: number;
  valeur_nominale: number;
  type_siege: "domicile_associe" | "local" | "domiciliation";
  associe_siege_id: string | null;
  utiliser_adresse_associe: boolean;
  adresse_siege: {
    ligne1: string;
    ligne2: string;
    code_postal: string;
    ville: string;
    pays: string;
    nom_societe_domiciliataire: string;
    statut_local: "" | "proprietaire" | "locataire";
  };
  date_debut_activite: string;
  code_ape: string;
  activite_reglementee: boolean;
  activite_reglementee_details: string;
  expert_comptable_choisi: boolean;
  expert_comptable_nom: string;
  expert_comptable_email: string;
  banque_depot_capital: string;
  compte_pro_ouvert: boolean;
  pieces_jointes: PieceJointeForm[];
};

const FORME_JURIDIQUE_OPTIONS = ["SAS", "SASU", "SARL", "EURL", "SA", "SCI"] as const;
const CLOTURE_OPTIONS = ["31 Décembre", "30 Juin", "31 Mars", "30 Septembre"] as const;
const CIVILITE_OPTIONS = ["M.", "Mme", "Autre"] as const;
const TYPE_APPORT = "Numéraire";
const SIEGE_OPTIONS: Array<{ value: FormState["type_siege"]; label: string }> = [
  { value: "domicile_associe", label: "Au domicile d'un associé" },
  { value: "local", label: "Dans un local / bureau" },
  { value: "domiciliation", label: "Domiciliation commerciale" },
];

const INITIAL_FORM_STATE: FormState = {
  denomination: "",
  forme_juridique: "",
  duree_societe: "",
  date_cloture: "",
  objet_social: "",
  associes: [],
  president_id: "",
  directeur_general_id: null,
  president_est_dg: true,
  capital_social: "",
  nombre_actions_total: 0,
  montant_libere: 0,
  valeur_nominale: 1,
  type_siege: "domicile_associe",
  associe_siege_id: null,
  utiliser_adresse_associe: true,
  adresse_siege: {
    ligne1: "",
    ligne2: "",
    code_postal: "",
    ville: "",
    pays: "France",
    nom_societe_domiciliataire: "",
    statut_local: "",
  },
  date_debut_activite: "",
  code_ape: "",
  activite_reglementee: false,
  activite_reglementee_details: "",
  expert_comptable_choisi: false,
  expert_comptable_nom: "",
  expert_comptable_email: "",
  banque_depot_capital: "",
  compte_pro_ouvert: false,
  pieces_jointes: [],
};

type ClientState = {
  data: Client | null;
  isLoading: boolean;
  error: string | null;
};

function createEmptyAssocie(): AssocieFormData {
  return {
    id: crypto.randomUUID(),
    civilite: "M.",
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    nationalite: "Française",
    adresse: "",
    email: "",
    telephone: "",
    profession: "",
    numero_cni: "",
    situation_matrimoniale: "",
    president: false,
    directeur_general: false,
    pourcentage_capital: 0,
    nombre_actions: 0,
    type_apport: TYPE_APPORT,
    montant_apport: 0,
  };
}

function calculateDirigeants(
  associes: AssocieFormData[],
  state: FormState,
  overrides: Partial<Pick<FormState, "president_id" | "directeur_general_id" | "president_est_dg" | "forme_juridique">> = {}
): Pick<FormState, "president_id" | "directeur_general_id" | "president_est_dg"> {
  if (associes.length === 0) {
    return { president_id: "", directeur_general_id: null, president_est_dg: true };
  }

  const forme = (overrides.forme_juridique ?? state.forme_juridique) ?? "";
  const isSasu = forme.toUpperCase() === "SASU";

  let presidentId = overrides.president_id ?? state.president_id;
  let presidentEstDG = overrides.president_est_dg ?? state.president_est_dg;
  let directeurGeneralId = overrides.directeur_general_id ?? state.directeur_general_id;

  const explicitPresident = associes.find((associe) => associe.president);
  if (!presidentId && explicitPresident) {
    presidentId = explicitPresident.id;
  }

  if (!associes.some((associe) => associe.id === presidentId)) {
    presidentId = associes[0]?.id ?? "";
  }

  if (isSasu || associes.length <= 1) {
    presidentEstDG = true;
  }

  if (presidentEstDG) {
    directeurGeneralId = presidentId || null;
  } else if (directeurGeneralId && !associes.some((associe) => associe.id === directeurGeneralId)) {
    directeurGeneralId = associes.find((associe) => associe.id !== presidentId)?.id ?? null;
  }

  return {
    president_id: presidentId,
    directeur_general_id: directeurGeneralId,
    president_est_dg: presidentEstDG,
  };
}

function applyDirigeantRoles(
  associes: AssocieFormData[],
  dirigeants: Pick<FormState, "president_id" | "directeur_general_id" | "president_est_dg">
): AssocieFormData[] {
  return associes.map((associe) => ({
    ...associe,
    president: associe.id === dirigeants.president_id,
    directeur_general: dirigeants.president_est_dg
      ? associe.id === dirigeants.president_id
      : associe.id === dirigeants.directeur_general_id,
  }));
}

function findAssocieById(associes: AssocieFormData[], id: string | null): AssocieFormData | undefined {
  if (!id) {
    return undefined;
  }
  return associes.find((associe) => associe.id === id);
}

function buildAdresseFromAssocie(
  associe: AssocieFormData,
  current: FormState["adresse_siege"]
): FormState["adresse_siege"] {
  return {
    ligne1: associe.adresse || "",
    ligne2: "",
    code_postal: current.code_postal,
    ville: current.ville,
    pays: current.pays || "France",
    nom_societe_domiciliataire: current.nom_societe_domiciliataire,
    statut_local: current.statut_local,
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} Ko`;
  }
  return `${bytes} octets`;
}

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"];

function hasAllowedExtension(fileName: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false;
}

export default function PublicFormPage() {
  const params = useParams<{ token: string }>();
  const [clientState, setClientState] = useState<ClientState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [associesError, setAssociesError] = useState<string | null>(null);
  const [dirigeantsError, setDirigeantsError] = useState<string | null>(null);
  const [capitalError, setCapitalError] = useState<string | null>(null);
  const [siegeError, setSiegeError] = useState<string | null>(null);
  const [pieceUploadError, setPieceUploadError] = useState<string | null>(null);
  const [isAssocieFormOpen, setIsAssocieFormOpen] = useState(false);
  const [editingAssocieIndex, setEditingAssocieIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [associeForm, setAssocieForm] = useState<AssocieFormData>(createEmptyAssocie());
  const [associeFormErrors, setAssocieFormErrors] = useState<
    Partial<Record<keyof AssocieFormData, string>>
  >({});

  const documentsDemandes = useMemo(() => {
    const docs: Array<{
      key: string;
      title: string;
      description: string;
    }> = [];

    formData.associes.forEach((associe) => {
      docs.push({
        key: `piece-identite-${associe.id}`,
        title: `Pièce d'identité • ${associe.prenom} ${associe.nom}`,
        description: "Carte d'identité ou passeport (recto-verso) pour cet associé.",
      });
    });

    if (formData.type_siege === "domicile_associe") {
      docs.push({
        key: "justificatif-domicile",
        title: "Justificatif de domicile (< 3 mois)",
        description: "Facture d'électricité, quittance de loyer ou autre justificatif récent.",
      });
      docs.push({
        key: "attestation-hebergement",
        title: "Attestation d'hébergement signée",
        description: "Lettre de l'associé hébergeant la société, signée et datée.",
      });
    }

    if (formData.type_siege === "local" && formData.adresse_siege.statut_local === "locataire") {
      docs.push({
        key: "bail-commercial",
        title: "Bail commercial",
        description: "Copie du bail signé pour le local utilisé par la société.",
      });
      docs.push({
        key: "quittance-loyer",
        title: "Dernière quittance de loyer",
        description: "Quittance de loyer récente correspondant au local.",
      });
    }

    if (formData.type_siege === "domiciliation") {
      docs.push({
        key: "contrat-domiciliation",
        title: "Contrat de domiciliation",
        description: "Contrat signé avec la société de domiciliation commerciale.",
      });
    }

    if (formData.activite_reglementee) {
      docs.push({
        key: "justificatifs-activite",
        title: "Diplômes et autorisations professionnelles",
        description: "Justifiez de votre aptitude à exercer une activité réglementée.",
      });
    }

    if (docs.length === 0) {
      docs.push({
        key: "documents-divers",
        title: "Documents complémentaires",
        description: "Téléversez tout document utile à la constitution du dossier.",
      });
    }

    return docs;
  }, [
    formData.activite_reglementee,
    formData.adresse_siege.statut_local,
    formData.associes,
    formData.type_siege,
  ]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    []
  );

  const handlePiecesSelected = (
    docKey: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setPieceUploadError(null);

    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }

    const acceptedPieces: PieceJointeForm[] = [];
    let encounteredError: string | null = null;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        encounteredError = `Le fichier ${file.name} dépasse la taille maximale de 10 Mo.`;
        return;
      }

      if (
        !ALLOWED_FILE_TYPES.includes(file.type) &&
        !hasAllowedExtension(file.name)
      ) {
        encounteredError = `Le format du fichier ${file.name} n'est pas accepté (PDF, JPG, PNG).`;
        return;
      }

      acceptedPieces.push({
        id: crypto.randomUUID(),
        nom_fichier: file.name,
        type_fichier: docKey,
        taille: file.size,
        file,
      });
    });

    event.target.value = "";

    if (encounteredError) {
      setPieceUploadError(encounteredError);
    }

    if (acceptedPieces.length > 0) {
      setFormData((previous) => ({
        ...previous,
        pieces_jointes: [...previous.pieces_jointes, ...acceptedPieces],
      }));
    }
  };

  const handleRemovePiece = (pieceId: string) => {
    setPieceUploadError(null);
    setFormData((previous) => ({
      ...previous,
      pieces_jointes: previous.pieces_jointes.filter((piece) => piece.id !== pieceId),
    }));
  };

  useEffect(() => {
    let isMounted = true;
    const token = params?.token;

    if (!token || typeof token !== "string") {
      setClientState({
        data: null,
        isLoading: false,
        error: "Lien invalide ou expiré.",
      });
      return;
    }

    const fetchClient = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("clients")
          .select("*")
          .eq("formulaire_token", token)
          .single();

        if (error || !data) {
          throw error;
        }

        if (isMounted) {
          setClientState({ data, isLoading: false, error: null });
          setFormData((previous) => ({
            ...previous,
            forme_juridique: data.forme_juridique ?? "",
          }));
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token", error);
        if (isMounted) {
          setClientState({
            data: null,
            isLoading: false,
            error: "Lien invalide ou expiré.",
          });
        }
      }
    };

    void fetchClient();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const progressValue = useMemo(() => (currentStep / TOTAL_STEPS) * 100, [currentStep]);

  const capital = Number(formData.capital_social || 0);
  const totalPourcentage = useMemo(
    () => formData.associes.reduce((sum, associe) => sum + associe.pourcentage_capital, 0),
    [formData.associes]
  );
  const isRepartitionValide = Math.abs(totalPourcentage - 100) < 0.001;

  useEffect(() => {
    setFormData((previous) => ({
      ...previous,
      nombre_actions_total: capital,
      valeur_nominale: capital > 0 ? 1 : 0,
      montant_libere: capital * 0.5,
      associes: previous.associes.map((associe) => {
        const montant = (capital * associe.pourcentage_capital) / 100;
        return {
          ...associe,
          nombre_actions: Math.round(montant),
          montant_apport: Number(montant.toFixed(2)),
          type_apport: TYPE_APPORT,
        };
      }),
    }));
  }, [capital, formData.associes.length]);

  useEffect(() => {
    setCapitalError(null);
    setAssociesError(null);
  }, [formData.capital_social, totalPourcentage]);

  useEffect(() => {
    setFormData((previous) => {
      if (previous.type_siege !== "domicile_associe") {
        if (previous.associe_siege_id !== null || previous.utiliser_adresse_associe) {
          return {
            ...previous,
            associe_siege_id: null,
            utiliser_adresse_associe: false,
          };
        }
        return previous;
      }

      if (previous.associes.length === 0) {
        if (previous.associe_siege_id !== null) {
          return {
            ...previous,
            associe_siege_id: null,
          };
        }
        return previous;
      }

      const selectedAssocie =
        findAssocieById(previous.associes, previous.associe_siege_id) ?? previous.associes[0];

      let updated: FormState | null = null;

      if (previous.associe_siege_id !== selectedAssocie.id) {
        updated = {
          ...previous,
          associe_siege_id: selectedAssocie.id,
        };
      }

      if (previous.utiliser_adresse_associe) {
        const newAdresse = buildAdresseFromAssocie(selectedAssocie, previous.adresse_siege);
        const adresseChanged =
          newAdresse.ligne1 !== previous.adresse_siege.ligne1 ||
          newAdresse.ligne2 !== previous.adresse_siege.ligne2 ||
          newAdresse.code_postal !== previous.adresse_siege.code_postal ||
          newAdresse.ville !== previous.adresse_siege.ville ||
          newAdresse.pays !== previous.adresse_siege.pays ||
          newAdresse.nom_societe_domiciliataire !== previous.adresse_siege.nom_societe_domiciliataire ||
          newAdresse.statut_local !== previous.adresse_siege.statut_local;

        if (adresseChanged) {
          updated = {
            ...(updated ?? previous),
            adresse_siege: newAdresse,
          };
        }
      }

      return updated ?? previous;
    });
  }, [formData.type_siege, formData.associes, formData.utiliser_adresse_associe]);

  const validateStep = (step: FormStep): boolean => {
    if (step === 1) {
      const errors: Partial<Record<keyof FormState, string>> = {};

      if (!formData.forme_juridique) {
        errors.forme_juridique = "Sélectionnez une forme juridique.";
      }

      if (formData.duree_societe === "" || Number(formData.duree_societe) <= 0) {
        errors.duree_societe = "La durée doit être un nombre positif.";
      } else if (Number(formData.duree_societe) > 99) {
        errors.duree_societe = "La durée ne peut pas dépasser 99 ans.";
      }

      if (!formData.date_cloture) {
        errors.date_cloture = "Sélectionnez une date de clôture.";
      }

      if (!formData.objet_social.trim()) {
        errors.objet_social = "Décrivez l'objet social de l'entreprise.";
      }

      setFormErrors(errors);
      setAssociesError(null);
      setDirigeantsError(null);
      setCapitalError(null);
      setSiegeError(null);
      return Object.keys(errors).length === 0;
    }

    if (step === 2) {
      setFormErrors({});
      setAssociesError(null);
      setDirigeantsError(null);
      setCapitalError(null);
      setSiegeError(null);

      if (formData.associes.length === 0) {
        setAssociesError("Ajoutez au moins un associé pour continuer.");
        return false;
      }

      if (formData.forme_juridique?.toUpperCase() === "SASU") {
        if (formData.associes.length !== 1) {
          setAssociesError("Une SASU ne peut comporter qu'un seul associé.");
          return false;
        }

        if (!formData.associes.some((associe) => associe.id === formData.president_id)) {
          setAssociesError("L'associé unique doit être désigné président.");
          return false;
        }
      }

      return true;
    }

    if (step === 3) {
      setFormErrors({});
      setAssociesError(null);
      setCapitalError(null);
      setSiegeError(null);

      if (!formData.president_id) {
        setDirigeantsError("Sélectionnez le président de la société.");
        return false;
      }

      if (formData.president_est_dg) {
        setDirigeantsError(null);
        return true;
      }

      if (!formData.directeur_general_id) {
        setDirigeantsError("Choisissez un directeur général différent du président.");
        return false;
      }

      if (formData.directeur_general_id === formData.president_id) {
        setDirigeantsError("Le directeur général doit être différent du président.");
        return false;
      }

      setDirigeantsError(null);
      return true;
    }

    if (step === 4) {
      setFormErrors({});
      setCapitalError(null);
      setSiegeError(null);

      if (capital <= 0 || Number.isNaN(capital)) {
        setCapitalError("Veuillez saisir un capital social d'au moins 1 €.");
        return false;
      }

      if (!isRepartitionValide) {
        setCapitalError("La répartition doit faire 100 % au total.");
        return false;
      }

      return true;
    }

    if (step === 5) {
      setFormErrors({});
      setCapitalError(null);
      setAssociesError(null);
      setDirigeantsError(null);
      setSiegeError(null);

      if (!formData.date_debut_activite) {
        setSiegeError("Indiquez la date de début d'activité prévue.");
        return false;
      }

      if (formData.activite_reglementee && !formData.activite_reglementee_details.trim()) {
        setSiegeError("Précisez les informations relatives à l'activité réglementée.");
        return false;
      }

      return true;
    }

    if (step === 6) {
      setFormErrors({});
      setCapitalError(null);
      setAssociesError(null);
      setDirigeantsError(null);
      setSiegeError(null);

      if (formData.type_siege === "domicile_associe" && formData.associes.length === 0) {
        setSiegeError("Ajoutez un associé avant de choisir le siège au domicile.");
        return false;
      }

      if (formData.type_siege === "domiciliation" && !formData.adresse_siege.nom_societe_domiciliataire.trim()) {
        setSiegeError("Renseignez le nom de la société de domiciliation.");
        return false;
      }

      if (formData.type_siege === "local" && !formData.adresse_siege.statut_local) {
        setSiegeError("Précisez si vous êtes propriétaire ou locataire du local.");
        return false;
      }

      const { ligne1, code_postal, ville } = formData.adresse_siege;
      if (!ligne1.trim()) {
        setSiegeError("Renseignez l'adresse du siège social.");
        return false;
      }

      if (!/^\d{5}$/.test(code_postal.trim())) {
        setSiegeError("Le code postal doit comporter 5 chiffres.");
        return false;
      }

      if (!ville.trim()) {
        setSiegeError("Renseignez la ville du siège social.");
        return false;
      }

      return true;
    }

    if (step === 7) {
      setFormErrors({});
      setCapitalError(null);
      setAssociesError(null);
      setDirigeantsError(null);
      setSiegeError(null);
      setPieceUploadError(null);

      if (formData.expert_comptable_choisi) {
        if (!formData.expert_comptable_nom.trim()) {
          setSiegeError("Indiquez le nom de votre cabinet d'expertise comptable.");
          return false;
        }

        if (!formData.expert_comptable_email.trim()) {
          setSiegeError("Renseignez l'email de contact de votre expert-comptable.");
          return false;
        }
      }

      return true;
    }

    if (step === 8) {
      setPieceUploadError(null);
      return true;
    }

    if (step === 9) {
      setSubmitError(null);
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((previous) => (previous < TOTAL_STEPS ? ((previous + 1) as FormStep) : previous));
  };

  const handlePrevious = () => {
    setCurrentStep((previous) => (previous > 1 ? ((previous - 1) as FormStep) : previous));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || showThankYou) {
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    if (!clientState.data) {
      setSubmitError("Impossible d'identifier votre dossier. Merci de recharger la page.");
      return;
    }

    const clientId = clientState.data.id;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      console.log("=== VÉRIFICATION FORM DATA ===");
      console.log("formData complet:", formData);
      console.log("formData.denomination:", formData.denomination);
      console.log("==============================");

      const capitalValue =
        formData.capital_social === "" ? null : Number(formData.capital_social);
      const valeurNominaleCalculee =
        capitalValue !== null && formData.nombre_actions_total > 0
          ? capitalValue / formData.nombre_actions_total
          : null;

      const clientData = {
        nom_entreprise: client.nom_entreprise,
        forme_juridique: formData.forme_juridique || null,
        duree_societe:
          formData.duree_societe === "" ? null : Number.parseInt(String(formData.duree_societe), 10),
        date_cloture: formData.date_cloture || null,
        objet_social: formData.objet_social || null,
        capital_social: capitalValue,
        nb_actions: formData.nombre_actions_total,
        valeur_nominale: formData.valeur_nominale || valeurNominaleCalculee,
        montant_libere: formData.montant_libere,
        date_debut_activite: formData.date_debut_activite || null,
        code_ape: formData.code_ape || null,
        activite_reglementee: formData.activite_reglementee,
        activite_reglementee_details: formData.activite_reglementee
          ? formData.activite_reglementee_details || null
          : null,
        type_siege: formData.type_siege,
        adresse_siege: {
          adresse: formData.adresse_siege.ligne1,
          complement: formData.adresse_siege.ligne2 || null,
          ville: formData.adresse_siege.ville,
          code_postal: formData.adresse_siege.code_postal,
          pays: formData.adresse_siege.pays,
        },
        expert_comptable_nom: formData.expert_comptable_choisi
          ? formData.expert_comptable_nom || null
          : null,
        expert_comptable_email: formData.expert_comptable_choisi
          ? formData.expert_comptable_email || null
          : null,
        banque_depot_capital: formData.banque_depot_capital || null,
        compte_pro_ouvert: formData.compte_pro_ouvert ?? false,
      };

      const associesPayload = formData.associes.map((associe) => ({
        client_id: clientId,
        civilite: associe.civilite,
        nom: associe.nom,
        prenom: associe.prenom,
        date_naissance: associe.date_naissance || null,
        lieu_naissance: associe.lieu_naissance || null,
        nationalite: associe.nationalite || null,
        adresse: associe.adresse,
        email: associe.email || null,
        telephone: associe.telephone || null,
        profession: associe.profession || null,
        numero_cni: associe.numero_cni || null,
        situation_matrimoniale: associe.situation_matrimoniale || null,
        nombre_actions: associe.nombre_actions,
        montant_apport: associe.montant_apport,
        type_apport: associe.type_apport,
        president: associe.president,
        directeur_general: associe.directeur_general,
        pourcentage_capital: associe.pourcentage_capital,
      }));

      console.log("=== SOUMISSION FORMULAIRE ===");
      console.log("Client ID:", clientId);
      console.log("Données client:", clientData);
      console.log("Associés:", associesPayload);

      const { data: result, error: submitError } = await supabaseClient.rpc("submit_client_form", {
        p_client_id: clientId,
        p_client_data: clientData,
        p_associes: associesPayload,
      });

      if (submitError) {
        console.error("=== ERREUR SOUMISSION ===");
        console.error("Message:", submitError.message);
        console.error("Details:", submitError.details);
        console.error("Full:", JSON.stringify(submitError, null, 2));
        setSubmitError(`Erreur: ${submitError.message}`);
        return;
      }

      console.log("✅ Formulaire soumis avec succès:", result);
      alert("✅ Votre dossier a été envoyé avec succès !");
    } catch (error) {
      console.error("Erreur fatale:", error);
      setSubmitError("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!submissionSuccess) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowThankYou(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [submissionSuccess]);

  if (clientState.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Vérification de votre lien formulaire…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (clientState.error || !clientState.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Lien invalide ou expiré</CardTitle>
            <CardDescription>
              Le lien que vous avez utilisé n'est plus valide. Merci de contacter votre expert-comptable
              pour obtenir un nouveau lien d'accès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Erreur 404</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = clientState.data;
  const piecesJointesCount = formData.pieces_jointes.length;
  const expertEmail =
    formData.expert_comptable_choisi && formData.expert_comptable_email
      ? formData.expert_comptable_email
      : client.email;

  if (showThankYou) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-xl text-center">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl font-semibold">Merci !</CardTitle>
            <CardDescription>
              Vos informations ont été transmises avec succès à votre expert-comptable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Nous revenons vers vous sous 48&nbsp;heures pour finaliser votre dossier et générer vos statuts.</p>
            {expertEmail ? (
              <Badge className="w-full justify-center bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-200">
                Contact : {expertEmail}
              </Badge>
            ) : (
              <Badge className="w-full justify-center" variant="secondary">
                L'équipe du cabinet vous écrira très rapidement.
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSasu = formData.forme_juridique?.toUpperCase() === "SASU";
  const presidentAssocie = formData.associes.find((associe) => associe.id === formData.president_id);
  const directeurGeneralAssocie = formData.president_est_dg
    ? presidentAssocie
    : formData.associes.find((associe) => associe.id === formData.directeur_general_id);
  const associeSiege = findAssocieById(formData.associes, formData.associe_siege_id);
  const siegeTypeLabel: Record<FormState["type_siege"], string> = {
    domicile_associe: "Domicile d'un associé",
    local: "Dans un local / bureau",
    domiciliation: "Domiciliation commerciale",
  };
  const adresseSiegeLines = [
    formData.adresse_siege.ligne1,
    formData.adresse_siege.ligne2,
    `${formData.adresse_siege.code_postal} ${formData.adresse_siege.ville}`.trim(),
    formData.adresse_siege.pays,
  ].filter((segment) => segment && segment.trim().length > 0);
  const adresseSiegeComplete = adresseSiegeLines.join("\n");
  const capitalRecapValue = formData.capital_social === "" ? null : Number(formData.capital_social);
  const montantLibereRecapValue =
    typeof formData.montant_libere === "number" ? formData.montant_libere : null;

  const closeAssocieForm = () => {
    setIsAssocieFormOpen(false);
    setAssocieForm(createEmptyAssocie());
    setAssocieFormErrors({});
    setEditingAssocieIndex(null);
  };

  const handleAssocieSubmit = () => {
    const errors: Partial<Record<keyof AssocieFormData, string>> = {};

    if (!associeForm.nom.trim()) {
      errors.nom = "Le nom est requis.";
    }

    if (!associeForm.prenom.trim()) {
      errors.prenom = "Le prénom est requis.";
    }

    if (!associeForm.nationalite.trim() || associeForm.nationalite.trim().length < 2) {
      errors.nationalite = "La nationalité est requise (minimum 2 caractères).";
    }

    const previousPourcentage =
      editingAssocieIndex !== null ? formData.associes[editingAssocieIndex].pourcentage_capital : 0;
    const remainingPourcentage = Math.max(0, 100 - (totalPourcentage - previousPourcentage));

    const associeToSave: AssocieFormData = {
      ...associeForm,
      pourcentage_capital:
        editingAssocieIndex === null && associeForm.pourcentage_capital === 0 && formData.associes.length === 0
          ? 100
          : editingAssocieIndex === null && associeForm.pourcentage_capital === 0
          ? Math.min(remainingPourcentage, 100)
          : associeForm.pourcentage_capital,
      type_apport: TYPE_APPORT,
    };

    if (isSasu) {
      associeToSave.president = true;
      associeToSave.directeur_general = true;
    }

    if (isSasu && !associeToSave.president) {
      errors.president = "L'associé unique doit être président.";
    }

    setAssocieFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setFormData((previous) => {
      const associes = [...previous.associes];
      const montant = (capital * associeToSave.pourcentage_capital) / 100;
      const associeFinal: AssocieFormData = {
        ...associeToSave,
        nombre_actions: Math.round(montant),
        montant_apport: Number(montant.toFixed(2)),
      };

      if (editingAssocieIndex !== null) {
        associes[editingAssocieIndex] = associeFinal;
      } else {
        associes.push(associeFinal);
      }

      const dirigeants = calculateDirigeants(associes, previous);
      const associesWithRoles = applyDirigeantRoles(associes, dirigeants);

      return {
        ...previous,
        associes: associesWithRoles,
        ...dirigeants,
      };
    });

    closeAssocieForm();
  };

  const handleAssocieRemoval = (index: number) => {
    if (editingAssocieIndex === index) {
      closeAssocieForm();
    }

    setFormData((previous) => {
      const associes = previous.associes.filter((_, i) => i !== index);
      const dirigeants = calculateDirigeants(associes, previous);
      const associesWithRoles = applyDirigeantRoles(associes, dirigeants);

      return {
        ...previous,
        associes: associesWithRoles,
        ...dirigeants,
      };
    });
  };

  const updateAssociePourcentage = (index: number, value: number) => {
    setFormData((previous) => {
      const associes = [...previous.associes];
      const montant = (capital * value) / 100;
      associes[index] = {
        ...associes[index],
        pourcentage_capital: value,
        nombre_actions: Math.round(montant),
        montant_apport: Number(montant.toFixed(2)),
        type_apport: TYPE_APPORT,
      };
      const dirigeants = calculateDirigeants(associes, previous);
      const associesWithRoles = applyDirigeantRoles(associes, dirigeants);
      return { ...previous, associes: associesWithRoles, ...dirigeants };
    });
  };

  const handleSiegeTypeChange = (value: FormState["type_siege"]) => {
    setSiegeError(null);
    setFormData((previous) => {
      if (previous.type_siege === value) {
        return previous;
      }

      if (value === "domicile_associe") {
        return {
          ...previous,
          type_siege: value,
          utiliser_adresse_associe: true,
        };
      }

      return {
        ...previous,
        type_siege: value,
        associe_siege_id: null,
        utiliser_adresse_associe: false,
      };
    });
  };

  const handleAssocieSiegeChange = (value: string) => {
    setSiegeError(null);
    setFormData((previous) => {
      const associe = findAssocieById(previous.associes, value);
      if (!associe) {
        return previous;
      }

      const update: Partial<FormState> = { associe_siege_id: associe.id };

      if (previous.utiliser_adresse_associe) {
        update.adresse_siege = buildAdresseFromAssocie(associe, previous.adresse_siege);
      }

      return {
        ...previous,
        ...update,
      };
    });
  };

  const handleUtiliserAdresseAssocieChange = (checked: boolean) => {
    setSiegeError(null);
    setFormData((previous) => {
      if (previous.type_siege !== "domicile_associe") {
        return previous;
      }

      const associe = findAssocieById(previous.associes, previous.associe_siege_id);
      return {
        ...previous,
        utiliser_adresse_associe: checked,
        adresse_siege:
          checked && associe
            ? buildAdresseFromAssocie(associe, previous.adresse_siege)
            : previous.adresse_siege,
      };
    });
  };

  const handleAdresseSiegeChange = <Field extends keyof FormState["adresse_siege"]>(
    field: Field,
    value: FormState["adresse_siege"][Field]
  ) => {
    setSiegeError(null);
    setFormData((previous) => ({
      ...previous,
      adresse_siege: {
        ...previous.adresse_siege,
        [field]: value,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-muted px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Création de votre société</CardTitle>
            <CardDescription>
              Complétez les informations requises pour finaliser les statuts de {client.nom_entreprise}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Étape {currentStep}/{TOTAL_STEPS} : {STEP_TITLES[currentStep]}
                  </span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} />
              </div>

              {currentStep === 1 ? (
                <div className="space-y-5">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations générales</CardTitle>
                      <CardDescription>Ces éléments serviront à la rédaction de vos statuts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nom_entreprise">Nom de l'entreprise</Label>
                        <Input id="nom_entreprise" value={client.nom_entreprise} disabled />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="forme_juridique">Forme juridique</Label>
                          <Select
                            value={formData.forme_juridique || undefined}
                            onValueChange={(value) =>
                              setFormData((previous) => ({
                                ...previous,
                                forme_juridique: value,
                              }))
                            }
                          >
                            <SelectTrigger id="forme_juridique">
                              <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                              {FORME_JURIDIQUE_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.forme_juridique ? (
                            <p className="text-xs text-destructive">{formErrors.forme_juridique}</p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duree_societe">Durée de la société (années)</Label>
                          <Input
                            id="duree_societe"
                            type="number"
                            min={1}
                            max={99}
                            value={formData.duree_societe}
                            onChange={(event) =>
                              setFormData((previous) => ({
                                ...previous,
                                duree_societe: Number(event.target.value),
                              }))
                            }
                            placeholder="Ex : 99"
                          />
                          {formErrors.duree_societe ? (
                            <p className="text-xs text-destructive">{formErrors.duree_societe}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="date_cloture">Date de clôture de l'exercice</Label>
                          <Select
                            value={formData.date_cloture || undefined}
                            onValueChange={(value) =>
                              setFormData((previous) => ({
                                ...previous,
                                date_cloture: value,
                              }))
                            }
                          >
                            <SelectTrigger id="date_cloture">
                              <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                              {CLOTURE_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.date_cloture ? (
                            <p className="text-xs text-destructive">{formErrors.date_cloture}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="objet_social">Objet social</Label>
                        <Textarea
                          id="objet_social"
                          rows={4}
                          value={formData.objet_social}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              objet_social: event.target.value,
                            }))
                          }
                          placeholder="Décrivez l'activité principale de la société"
                        />
                        {formErrors.objet_social ? (
                          <p className="text-xs text-destructive">{formErrors.objet_social}</p>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vos associés</CardTitle>
                      <CardDescription>Renseignez les informations de chaque associé.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.associes.length === 0 ? (
                        <Card className="border-dashed">
                          <CardContent className="py-6 text-center text-sm text-muted-foreground">
                            Aucun associé ajouté pour le moment.
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {formData.associes.map((associe, index) => (
                            <Card key={associe.id} className="border">
                              <CardContent className="flex items-center justify-between gap-4 py-4">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {associe.civilite} {associe.prenom} {associe.nom}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {associe.profession || "Profession non précisée"} • CNI : {associe.numero_cni || "—"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {associe.email || "Email non renseigné"}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingAssocieIndex(index);
                                      setAssocieForm({ ...associe });
                                      setAssocieFormErrors({});
                                      setIsAssocieFormOpen(true);
                                    }}
                                  >
                                    Modifier
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleAssocieRemoval(index)}
                                  >
                                    Supprimer
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {associesError ? (
                        <Alert variant="destructive">
                          <AlertDescription>{associesError}</AlertDescription>
                        </Alert>
                      ) : null}

                      <Button
                        type="button"
                        onClick={() => {
                          if (isSasu && formData.associes.length >= 1) {
                            setAssociesError(
                              "Une SASU ne peut comporter qu'un seul associé. Modifiez l'associé existant."
                            );
                            return;
                          }

                          const remaining = Math.max(0, 100 - totalPourcentage);
                          const empty = {
                            ...createEmptyAssocie(),
                            pourcentage_capital: remaining > 0 ? remaining : 0,
                            president: formData.associes.length === 0,
                            directeur_general: false,
                          };

                          setAssocieForm(empty);
                          setAssocieFormErrors({});
                          setEditingAssocieIndex(null);
                          setIsAssocieFormOpen(true);
                        }}
                      >
                        + Ajouter un associé
                      </Button>
                    </CardContent>
                  </Card>

                  {isAssocieFormOpen ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingAssocieIndex !== null ? "Modifier l'associé" : "Nouvel associé"}
                        </CardTitle>
                        <CardDescription>Complétez les informations de l'associé.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="associe_civilite">Civilité</Label>
                            <Select
                              value={associeForm.civilite}
                              onValueChange={(value) =>
                                setAssocieForm((previous) => ({ ...previous, civilite: value }))
                              }
                            >
                              <SelectTrigger id="associe_civilite">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CIVILITE_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="associe_nom">Nom</Label>
                            <Input
                              id="associe_nom"
                              value={associeForm.nom}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  nom: event.target.value,
                                }))
                              }
                            />
                            {associeFormErrors.nom ? (
                              <p className="text-xs text-destructive">{associeFormErrors.nom}</p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="associe_prenom">Prénom</Label>
                            <Input
                              id="associe_prenom"
                              value={associeForm.prenom}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  prenom: event.target.value,
                                }))
                              }
                            />
                            {associeFormErrors.prenom ? (
                              <p className="text-xs text-destructive">{associeFormErrors.prenom}</p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="associe_date_naissance">Date de naissance</Label>
                            <Input
                              id="associe_date_naissance"
                              type="date"
                              value={associeForm.date_naissance}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  date_naissance: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="associe_lieu_naissance">Lieu de naissance</Label>
                            <Input
                              id="associe_lieu_naissance"
                              value={associeForm.lieu_naissance}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  lieu_naissance: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="associe_nationalite">Nationalité</Label>
                            <Input
                              id="associe_nationalite"
                              type="text"
                              value={associeForm.nationalite}
                              placeholder="Française"
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  nationalite: event.target.value,
                                }))
                              }
                            />
                            {associeFormErrors.nationalite ? (
                              <p className="text-xs text-destructive">{associeFormErrors.nationalite}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="associe_adresse">Adresse complète</Label>
                          <Textarea
                            id="associe_adresse"
                            rows={3}
                            value={associeForm.adresse}
                            onChange={(event) =>
                              setAssocieForm((previous) => ({
                                ...previous,
                                adresse: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="associe_email">Email</Label>
                            <Input
                              id="associe_email"
                              type="email"
                              value={associeForm.email}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  email: event.target.value,
                                }))
                              }
                              placeholder="contact@associe.fr"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="associe_telephone">Téléphone</Label>
                            <Input
                              id="associe_telephone"
                              type="tel"
                              value={associeForm.telephone}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  telephone: event.target.value,
                                }))
                              }
                              placeholder="Ex : 06 12 34 56 78"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="associe_profession">Profession</Label>
                            <Input
                              id="associe_profession"
                              value={associeForm.profession}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  profession: event.target.value,
                                }))
                              }
                              placeholder="Ex : Développeur web"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="associe_cni">Numéro CNI ou Passeport</Label>
                            <Input
                              id="associe_cni"
                              value={associeForm.numero_cni}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  numero_cni: event.target.value,
                                }))
                              }
                              placeholder="123456789"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="associe_situation">Situation matrimoniale</Label>
                            <Select
                              value={associeForm.situation_matrimoniale || undefined}
                              onValueChange={(value) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  situation_matrimoniale: value,
                                }))
                              }
                            >
                              <SelectTrigger id="associe_situation">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Célibataire">Célibataire</SelectItem>
                                <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                                <SelectItem value="Pacsé(e)">Pacsé(e)</SelectItem>
                                <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                                <SelectItem value="Veuf(ve)">Veuf(ve)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Checkbox
                              checked={associeForm.president}
                              onCheckedChange={(checked) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  president: Boolean(checked),
                                }))
                              }
                              disabled={isSasu}
                            />
                            Président
                          </label>
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Checkbox
                              checked={associeForm.directeur_general}
                              onCheckedChange={(checked) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  directeur_general: Boolean(checked),
                                }))
                              }
                              disabled={isSasu}
                            />
                            Directeur général
                          </label>
                        </div>

                        {associeFormErrors.nom || associeFormErrors.prenom || associeFormErrors.nationalite || associeFormErrors.president ? (
                          <Alert variant="destructive">
                            <AlertDescription>
                              {[associeFormErrors.nom, associeFormErrors.prenom, associeFormErrors.nationalite, associeFormErrors.president]
                                .filter(Boolean)
                                .join(" • ")}
                            </AlertDescription>
                          </Alert>
                        ) : null}

                        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                          <Button type="button" variant="outline" onClick={closeAssocieForm}>
                            Annuler
                          </Button>
                          <Button type="button" onClick={handleAssocieSubmit}>
                            Valider
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Qui dirigera la société ?</CardTitle>
                      <CardDescription>
                        Pour les SASU, l'associé unique dirige automatiquement. Pour les SAS, vous pouvez nommer un directeur général distinct.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.associes.length === 0 ? (
                        <Alert variant="destructive">
                          <AlertDescription>
                            Ajoutez au moins un associé à l'étape précédente avant de définir les dirigeants.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="president_select">Président</Label>
                            <Select
                              value={formData.president_id || undefined}
                              onValueChange={(value) => {
                                setFormData((previous) => {
                                  const dirigeants = calculateDirigeants(previous.associes, previous, {
                                    president_id: value,
                                  });
                                  const associes = applyDirigeantRoles(previous.associes, dirigeants);
                                  return { ...previous, associes, ...dirigeants };
                                });
                                setDirigeantsError(null);
                              }}
                            >
                              <SelectTrigger id="president_select">
                                <SelectValue placeholder="Sélectionnez un président" />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.associes.map((associe) => (
                                  <SelectItem key={associe.id} value={associe.id}>
                                    {associe.civilite} {associe.prenom} {associe.nom}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Checkbox
                                checked={formData.president_est_dg}
                                onCheckedChange={(checked) => {
                                  setFormData((previous) => {
                                    const dirigeants = calculateDirigeants(previous.associes, previous, {
                                      president_est_dg: Boolean(checked) || isSasu || previous.associes.length <= 1,
                                      directeur_general_id: Boolean(checked)
                                        ? previous.president_id || null
                                        : previous.directeur_general_id,
                                    });
                                    const associes = applyDirigeantRoles(previous.associes, dirigeants);
                                    return { ...previous, associes, ...dirigeants };
                                  });
                                  setDirigeantsError(null);
                                }}
                                disabled={isSasu || formData.associes.length <= 1}
                              />
                              Le président est aussi directeur général
                            </label>
                          </div>

                          {!formData.president_est_dg && formData.associes.length > 1 ? (
                            <div className="space-y-2">
                              <Label htmlFor="dg_select">Directeur général</Label>
                              <Select
                                value={formData.directeur_general_id ?? undefined}
                                onValueChange={(value) => {
                                  setFormData((previous) => {
                                    const dirigeants = calculateDirigeants(previous.associes, previous, {
                                      directeur_general_id: value,
                                      president_est_dg: false,
                                    });
                                    const associes = applyDirigeantRoles(previous.associes, dirigeants);
                                    return { ...previous, associes, ...dirigeants };
                                  });
                                  setDirigeantsError(null);
                                }}
                              >
                                <SelectTrigger id="dg_select">
                                  <SelectValue placeholder="Sélectionnez un directeur général" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formData.associes
                                    .filter((associe) => associe.id !== formData.president_id)
                                    .map((associe) => (
                                      <SelectItem key={associe.id} value={associe.id}>
                                        {associe.civilite} {associe.prenom} {associe.nom}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : null}

                          {dirigeantsError ? (
                            <Alert variant="destructive">
                              <AlertDescription>{dirigeantsError}</AlertDescription>
                            </Alert>
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quel est le capital social de votre société ?</CardTitle>
                      <CardDescription>
                        Le capital représente l'argent que vous investissez. Minimum conseillé : 1000 €.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="capital_social">Capital social (€)</Label>
                        <Input
                          id="capital_social"
                          type="number"
                          min={1}
                          value={formData.capital_social}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              capital_social: Number(event.target.value),
                            }))
                          }
                          placeholder="Ex : 1000"
                        />
                      </div>

                      <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-lg">ⓘ</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Ces informations permettront à votre expert-comptable de rédiger vos statuts.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        Le capital sera réparti automatiquement en actions à 1 € pièce.
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Comment répartir le capital entre les associés ?</CardTitle>
                      <CardDescription>
                        Ajustez simplement le pourcentage pour chaque associé. Le montant se calcule automatiquement.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {formData.associes.map((associe, index) => {
                        const montant = (capital * associe.pourcentage_capital) / 100;
                        return (
                          <div key={associe.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">
                                {associe.civilite} {associe.prenom} {associe.nom}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {associe.pourcentage_capital.toFixed(0)} % = {montant.toFixed(2)} €
                              </p>
                            </div>
                            <Slider
                              value={[associe.pourcentage_capital]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={(value) => updateAssociePourcentage(index, value[0] ?? 0)}
                            />
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="text-sm font-medium text-foreground">Répartition totale</span>
                        <Badge variant={isRepartitionValide ? "secondary" : "destructive"}>
                          {totalPourcentage.toFixed(0)} %
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Les montants sont calculés à titre indicatif et pourront être ajustés par votre expert-comptable.
                      </div>
                    </CardContent>
                  </Card>

                  {capitalError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{capitalError}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              ) : null}

              {currentStep === 5 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Détails de votre activité</CardTitle>
                      <CardDescription>
                        Quelques précisions pour aider votre expert-comptable à préparer vos démarches.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_debut_activite">Date de début d'activité prévue</Label>
                        <Input
                          id="date_debut_activite"
                          type="date"
                          value={formData.date_debut_activite}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              date_debut_activite: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="code_ape">Code APE / NAF</Label>
                        <Input
                          id="code_ape"
                          value={formData.code_ape}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              code_ape: event.target.value,
                            }))
                          }
                          placeholder="Si vous le connaissez. Sinon votre expert-comptable le trouvera."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Checkbox
                            checked={formData.activite_reglementee}
                            onCheckedChange={(checked) =>
                              setFormData((previous) => ({
                                ...previous,
                                activite_reglementee: Boolean(checked),
                                activite_reglementee_details: Boolean(checked)
                                  ? previous.activite_reglementee_details
                                  : "",
                              }))
                            }
                          />
                          Votre activité est-elle réglementée ?
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Exemples : santé, coiffure, bâtiment, sécurité, finance...
                        </p>
                      </div>

                      {formData.activite_reglementee ? (
                        <div className="space-y-2">
                          <Label htmlFor="activite_reglementee_details">Précisions</Label>
                          <Textarea
                            id="activite_reglementee_details"
                            rows={4}
                            value={formData.activite_reglementee_details}
                            onChange={(event) =>
                              setFormData((previous) => ({
                                ...previous,
                                activite_reglementee_details: event.target.value,
                              }))
                            }
                            placeholder="Décrivez votre activité et les diplômes/autorisations que vous possédez"
                          />
                        </div>
                      ) : null}

                      <p className="text-xs text-muted-foreground">
                        Votre expert-comptable vérifiera si des autorisations ou justificatifs supplémentaires sont nécessaires.
                      </p>
                    </CardContent>
                  </Card>

                  {siegeError ? null : null}
                </div>
              ) : null}

              {currentStep === 6 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Où sera situé le siège social de votre société ?</CardTitle>
                      <CardDescription>
                        Choisissez l'option qui correspond le mieux à votre situation actuelle.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {SIEGE_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                          >
                            <input
                              type="radio"
                              name="type_siege"
                              value={option.value}
                              checked={formData.type_siege === option.value}
                              onChange={() => handleSiegeTypeChange(option.value)}
                              className="h-4 w-4 border border-input"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {formData.type_siege === "domicile_associe" ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Choix de l'associé hébergeant la société</CardTitle>
                        <CardDescription>Cette option est souvent la plus simple pour démarrer.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {formData.associes.length === 0 ? (
                          <Alert variant="destructive">
                            <AlertDescription>
                              Ajoutez au moins un associé avant de choisir le siège social au domicile.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="associe_siege">Chez quel associé ?</Label>
                              <Select
                                value={formData.associe_siege_id ?? undefined}
                                onValueChange={handleAssocieSiegeChange}
                              >
                                <SelectTrigger id="associe_siege">
                                  <SelectValue placeholder="Sélectionnez un associé" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formData.associes.map((associe) => (
                                    <SelectItem key={associe.id} value={associe.id}>
                                      {associe.civilite} {associe.prenom} {associe.nom}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Checkbox
                                checked={formData.utiliser_adresse_associe}
                                onCheckedChange={(checked) =>
                                  handleUtiliserAdresseAssocieChange(Boolean(checked))
                                }
                              />
                              Utiliser l'adresse de cet associé
                            </label>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}

                  {formData.type_siege === "domiciliation" ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Informations sur votre domiciliation</CardTitle>
                        <CardDescription>Indiquez le nom de l'entreprise qui vous domicilie.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Label htmlFor="nom_societe_domiciliataire">Nom de la société domiciliataire</Label>
                        <Input
                          id="nom_societe_domiciliataire"
                          value={formData.adresse_siege.nom_societe_domiciliataire}
                          onChange={(event) =>
                            handleAdresseSiegeChange("nom_societe_domiciliataire", event.target.value)
                          }
                          placeholder="Ex : Regus, Domiphone, etc."
                        />
                      </CardContent>
                    </Card>
                  ) : null}

                  {formData.type_siege === "local" ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Statut du local commercial</CardTitle>
                        <CardDescription>Indiquez si vous êtes propriétaire ou locataire du local.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                          <input
                            type="radio"
                            name="statut_local"
                            value="proprietaire"
                            checked={formData.adresse_siege.statut_local === "proprietaire"}
                            onChange={() => handleAdresseSiegeChange("statut_local", "proprietaire")}
                            className="h-4 w-4 border border-input"
                          />
                          Propriétaire
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                          <input
                            type="radio"
                            name="statut_local"
                            value="locataire"
                            checked={formData.adresse_siege.statut_local === "locataire"}
                            onChange={() => handleAdresseSiegeChange("statut_local", "locataire")}
                            className="h-4 w-4 border border-input"
                          />
                          Locataire
                        </label>
                      </CardContent>
                    </Card>
                  ) : null}

                  <Card>
                    <CardHeader>
                      <CardTitle>Adresse complète du siège</CardTitle>
                      <CardDescription>Indiquez l'adresse officielle où seront domiciliés vos statuts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="siege_ligne1">Adresse (ligne 1)</Label>
                        <Input
                          id="siege_ligne1"
                          value={formData.adresse_siege.ligne1}
                          onChange={(event) => handleAdresseSiegeChange("ligne1", event.target.value)}
                          placeholder="Numéro et rue"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="siege_ligne2">Adresse (ligne 2)</Label>
                        <Input
                          id="siege_ligne2"
                          value={formData.adresse_siege.ligne2}
                          onChange={(event) => handleAdresseSiegeChange("ligne2", event.target.value)}
                          placeholder="Appartement, étage... (optionnel)"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="siege_code_postal">Code postal</Label>
                          <Input
                            id="siege_code_postal"
                            value={formData.adresse_siege.code_postal}
                            onChange={(event) => handleAdresseSiegeChange("code_postal", event.target.value)}
                            placeholder="Ex : 75008"
                            inputMode="numeric"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="siege_ville">Ville</Label>
                          <Input
                            id="siege_ville"
                            value={formData.adresse_siege.ville}
                            onChange={(event) => handleAdresseSiegeChange("ville", event.target.value)}
                            placeholder="Paris"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="siege_pays">Pays</Label>
                        <Input
                          id="siege_pays"
                          value={formData.adresse_siege.pays}
                          onChange={(event) => handleAdresseSiegeChange("pays", event.target.value)}
                          placeholder="France"
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Votre expert-comptable vous demandera les justificatifs nécessaires plus tard.
                      </p>
                    </CardContent>
                  </Card>

                  {siegeError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{siegeError}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              ) : null}

              {currentStep === 7 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations complémentaires</CardTitle>
                      <CardDescription>Ces informations aideront à finaliser votre dossier.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">
                          <Checkbox
                            checked={formData.expert_comptable_choisi}
                            onCheckedChange={(checked) =>
                              setFormData((previous) => ({
                                ...previous,
                                expert_comptable_choisi: Boolean(checked),
                                expert_comptable_nom: Boolean(checked) ? previous.expert_comptable_nom : "",
                                expert_comptable_email: Boolean(checked) ? previous.expert_comptable_email : "",
                              }))
                            }
                          />
                          <span className="ml-2">Avez-vous déjà un expert-comptable ?</span>
                        </Label>

                        {formData.expert_comptable_choisi ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="expert_comptable_nom">Nom du cabinet</Label>
                              <Input
                                id="expert_comptable_nom"
                                value={formData.expert_comptable_nom}
                                onChange={(event) =>
                                  setFormData((previous) => ({
                                    ...previous,
                                    expert_comptable_nom: event.target.value,
                                  }))
                                }
                                placeholder="Ex : Cabinet Dupont & Associés"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="expert_comptable_email">Email de contact</Label>
                              <Input
                                id="expert_comptable_email"
                                type="email"
                                value={formData.expert_comptable_email}
                                onChange={(event) =>
                                  setFormData((previous) => ({
                                    ...previous,
                                    expert_comptable_email: event.target.value,
                                  }))
                                }
                                placeholder="contact@cabinet.fr"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="banque_depot_capital">Banque pour le dépôt de capital</Label>
                        <Input
                          id="banque_depot_capital"
                          value={formData.banque_depot_capital}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              banque_depot_capital: event.target.value,
                            }))
                          }
                          placeholder="Ex : Crédit Agricole, BNP Paribas..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Où allez-vous déposer le capital social ?
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Checkbox
                            checked={formData.compte_pro_ouvert}
                            onCheckedChange={(checked) =>
                              setFormData((previous) => ({
                                ...previous,
                                compte_pro_ouvert: Boolean(checked),
                              }))
                            }
                          />
                          Compte professionnel déjà ouvert ?
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Si non, votre expert-comptable pourra vous conseiller.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {siegeError ? null : null}
                </div>
              ) : null}

              {currentStep === 8 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents à fournir</CardTitle>
                      <CardDescription>
                        Uploadez les documents suivants si vous les avez déjà. Tous les envois restent
                        facultatifs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {pieceUploadError ? (
                        <Alert variant="destructive">
                          <AlertDescription>{pieceUploadError}</AlertDescription>
                        </Alert>
                      ) : null}

                      <div className="space-y-6">
                        {documentsDemandes.map((document) => {
                          const fichiersAssocies = formData.pieces_jointes.filter(
                            (piece) => piece.type_fichier === document.key
                          );

                          return (
                            <div key={document.key} className="space-y-3">
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-foreground">
                                  {document.title}
                                </h3>
                                <p className="text-xs text-muted-foreground">{document.description}</p>
                              </div>
                              <Input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(event) => handlePiecesSelected(document.key, event)}
                              />
                              {fichiersAssocies.length > 0 ? (
                                <ul className="space-y-2">
                                  {fichiersAssocies.map((piece) => (
                                    <li
                                      key={piece.id}
                                      className="flex items-center justify-between rounded-md border border-muted px-3 py-2 text-sm"
                                    >
                                      <div>
                                        <span className="font-medium text-foreground">{piece.nom_fichier}</span>
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          ({formatFileSize(piece.taille)})
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemovePiece(piece.id)}
                                      >
                                        Supprimer
                                      </Button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs italic text-muted-foreground">
                                  Aucun fichier ajouté pour ce document.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Formats acceptés : PDF, JPG, PNG. Taille maximale : 10 Mo par fichier. Votre
                        expert-comptable vous contactera si des pièces manquent.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {currentStep === 9 ? (
                <div className="space-y-6">
                  {submitError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  ) : null}

                  {submissionSuccess ? (
                    <Alert className="border-green-500 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-950 dark:text-green-300">
                      <AlertDescription>
                        Vos informations ont bien été envoyées. Redirection vers la page de remerciement…
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <Card>
                    <CardHeader>
                      <CardTitle>Récapitulatif de vos informations</CardTitle>
                      <CardDescription>
                        Vérifiez chaque section avant d'envoyer le dossier à votre expert-comptable.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-sm">
                      <section className="space-y-1">
                        <h3 className="font-semibold text-foreground">Entreprise</h3>
                        <p>
                          <span className="text-muted-foreground">Nom : </span>
                          {client.nom_entreprise}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Forme juridique : </span>
                          {formData.forme_juridique || "Non renseignée"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Durée : </span>
                          {formData.duree_societe ? `${formData.duree_societe} ans` : "Non renseignée"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Objet social : </span>
                          {formData.objet_social || "Non renseigné"}
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h3 className="font-semibold text-foreground">Associés</h3>
                        {formData.associes.length > 0 ? (
                          <ul className="space-y-2">
                            {formData.associes.map((associe) => (
                              <li
                                key={associe.id}
                                className="rounded-md border border-muted bg-background/60 p-3"
                              >
                                <p className="font-medium text-foreground">
                                  {associe.prenom} {associe.nom}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {associe.profession || "Profession non précisée"} • {associe.pourcentage_capital} % du capital
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">Aucun associé renseigné.</p>
                        )}
                      </section>

                      <section className="space-y-1">
                        <h3 className="font-semibold text-foreground">Dirigeants</h3>
                        <p>
                          <span className="text-muted-foreground">Président : </span>
                          {presidentAssocie
                            ? `${presidentAssocie.prenom} ${presidentAssocie.nom}`
                            : "Non défini"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Directeur général : </span>
                          {formData.president_est_dg
                            ? "Identique au président"
                            : directeurGeneralAssocie
                            ? `${directeurGeneralAssocie.prenom} ${directeurGeneralAssocie.nom}`
                            : "Non défini"}
                        </p>
                      </section>

                      <section className="space-y-1">
                        <h3 className="font-semibold text-foreground">Capital</h3>
                        <p>
                          <span className="text-muted-foreground">Capital social : </span>
                          {capitalRecapValue !== null
                            ? currencyFormatter.format(capitalRecapValue)
                            : "Non renseigné"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Montant libéré (≈50 %) : </span>
                          {montantLibereRecapValue !== null
                            ? currencyFormatter.format(montantLibereRecapValue)
                            : "Non renseigné"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Répartition : </span>
                          {isRepartitionValide
                            ? `${totalPourcentage.toFixed(0)} % répartis entre ${formData.associes.length} associé(s)`
                            : "À vérifier"}
                        </p>
                      </section>

                      <section className="space-y-1">
                        <h3 className="font-semibold text-foreground">Siège social</h3>
                        <p>
                          <span className="text-muted-foreground">Type : </span>
                          {siegeTypeLabel[formData.type_siege]}
                        </p>
                        {associeSiege ? (
                          <p>
                            <span className="text-muted-foreground">Chez : </span>
                            {associeSiege.prenom} {associeSiege.nom}
                          </p>
                        ) : null}
                        <div>
                          <span className="text-muted-foreground">Adresse : </span>
                          <div className="whitespace-pre-line">
                            {adresseSiegeComplete || "Non renseignée"}
                          </div>
                        </div>
                      </section>

                      <section className="space-y-1">
                        <h3 className="font-semibold text-foreground">Activité</h3>
                        <p>
                          <span className="text-muted-foreground">Date de début : </span>
                          {formData.date_debut_activite || "Non renseignée"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Code APE / NAF : </span>
                          {formData.code_ape || "Non renseigné"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Activité réglementée : </span>
                          {formData.activite_reglementee ? "Oui" : "Non"}
                        </p>
                        {formData.activite_reglementee && formData.activite_reglementee_details ? (
                          <p className="text-xs text-muted-foreground">
                            {formData.activite_reglementee_details}
                          </p>
                        ) : null}
                      </section>

                      <section className="space-y-1">
                        <h3 className="font-semibold text-foreground">Documents</h3>
                        <p>
                          {piecesJointesCount > 0
                            ? `${piecesJointesCount} document(s) prêt(s) à être transmis.`
                            : "Aucun document téléversé pour le moment."}
                        </p>
                      </section>

                      <p className="text-xs text-muted-foreground">
                        Votre expert-comptable recevra ces informations et vous contactera pour finaliser votre dossier.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || isSubmitting || submissionSuccess}
                >
                  Précédent
                </Button>
                {currentStep < TOTAL_STEPS ? (
                  <Button type="button" onClick={handleNext} disabled={isSubmitting || submissionSuccess}>
                    Suivant
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting || submissionSuccess}>
                    {isSubmitting
                      ? "Envoi en cours..."
                      : submissionSuccess
                      ? "Informations envoyées"
                      : "Envoyer mes informations"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const STEP_TITLES: Record<FormStep, string> = {
  1: "Informations générales",
  2: "Les associés",
  3: "Nomination des dirigeants",
  4: "Capital et actions",
  5: "Détails de l'activité",
  6: "Siège social",
  7: "Informations complémentaires",
  8: "Pièces jointes",
  9: "Validation finale",
};

