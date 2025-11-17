'use client';

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabaseClient } from "@/lib/supabase";
import { nombreEnLettres } from "@/lib/utils/nombreEnLettres";
import type { Client, Associe } from "@/types/database";
import { toast } from "sonner";

type ActeCessionFormData = {
  date_acte: string;
  statut: 'brouillon' | 'validé' | 'signé';
  cedant_id: string;
  cessionnaire_civilite: 'M.' | 'Mme';
  cessionnaire_nom: string;
  cessionnaire_prenom: string;
  cessionnaire_adresse: string;
  cessionnaire_nationalite: string;
  nombre_actions: number | '';
  prix_unitaire: number | '';
  prix_total: number | '';
  date_agrement: string;
  modalites_paiement: string;
};

const initialFormState: ActeCessionFormData = {
  date_acte: new Date().toISOString().split('T')[0],
  statut: 'brouillon',
  cedant_id: '',
  cessionnaire_civilite: 'M.',
  cessionnaire_nom: '',
  cessionnaire_prenom: '',
  cessionnaire_adresse: '',
  cessionnaire_nationalite: 'Française',
  nombre_actions: '',
  prix_unitaire: '',
  prix_total: '',
  date_agrement: '',
  modalites_paiement: '',
};

type ActeAugmentationCapitalFormData = {
  date_acte: string;
  statut: 'brouillon' | 'validé' | 'signé';
  ancien_capital: number | '';
  montant_augmentation: number | '';
  nouveau_capital: number | '';
  modalite: 'numeraire' | 'nature' | 'reserves' | '';
  description_apport: string;
  nombre_nouvelles_actions: number | '';
  quorum: number | '';
  votes_pour: number | '';
  votes_contre: number | '';
  // Apports en nature
  apport_nature?: boolean;
  apport_nature_description?: string;
  apport_nature_montant_total?: number;
  apport_nature_pourcentage_capital?: number;
  commissaire_obligatoire?: boolean;
  commissaire_nom?: string;
  bien_superieur_30k?: boolean;
};

type NouvelAssocie = {
  nom: string;
  prenom: string;
  adresse: string;
  apport: number | '';
  nombre_actions: number | '';
};

type ActeAGOrdinaireFormData = {
  date_acte: string;
  statut: 'brouillon' | 'validé' | 'signé';
  date_ag: string;
  heure_ag: string;
  lieu_ag: string;
  exercice_clos: string;
  resultat_exercice: number | '';
  affectation_resultat: 'report_nouveau' | 'reserves' | 'dividendes' | 'mixte' | '';
  montant_dividendes: number | '';
  montant_reserves: number | '';
  montant_report: number | '';
  quitus_president: boolean;
  votes_pour_comptes: number | '';
  votes_contre_comptes: number | '';
  votes_abstention_comptes: number | '';
};

const initialAGOrdinaireFormState: ActeAGOrdinaireFormData = {
  date_acte: new Date().toISOString().split('T')[0],
  statut: 'brouillon',
  date_ag: new Date().toISOString().split('T')[0],
  heure_ag: '14:00',
  lieu_ag: '',
  exercice_clos: '',
  resultat_exercice: '',
  affectation_resultat: '',
  montant_dividendes: '',
  montant_reserves: '',
  montant_report: '',
  quitus_president: true,
  votes_pour_comptes: '',
  votes_contre_comptes: 0,
  votes_abstention_comptes: 0,
};

type FormErrors = Partial<Record<keyof (ActeCessionFormData & ActeAugmentationCapitalFormData & ActeAGOrdinaireFormData), string>> & { global?: string };

const initialAugmentationFormState: ActeAugmentationCapitalFormData = {
  date_acte: new Date().toISOString().split('T')[0],
  statut: 'brouillon',
  ancien_capital: '',
  montant_augmentation: '',
  nouveau_capital: '',
  modalite: '',
  description_apport: '',
  nombre_nouvelles_actions: '',
  quorum: '',
  votes_pour: '',
  votes_contre: '',
  // Apports en nature
  apport_nature: false,
  apport_nature_description: '',
  apport_nature_montant_total: 0,
  apport_nature_pourcentage_capital: 0,
  commissaire_obligatoire: false,
  commissaire_nom: '',
  bien_superieur_30k: false,
};

export default function CreateActePage() {
  const router = useRouter();
  const [acteType, setActeType] = useState<'cession_actions' | 'augmentation_capital' | 'ag_ordinaire'>('cession_actions');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [associes, setAssocies] = useState<Associe[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingAssocies, setIsLoadingAssocies] = useState(false);
  const [formData, setFormData] = useState<ActeCessionFormData>(initialFormState);
  const [augmentationFormData, setAugmentationFormData] = useState<ActeAugmentationCapitalFormData>(initialAugmentationFormState);
  const [agOrdinaireFormData, setAGOrdinaireFormData] = useState<ActeAGOrdinaireFormData>(initialAGOrdinaireFormState);
  const [nouveauxAssocies, setNouveauxAssocies] = useState<NouvelAssocie[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État pour la checkbox "commissaire désigné"
  const [commissaireDesigne, setCommissaireDesigne] = useState(false);

  // Fetch clients du cabinet
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data: cabinetIdData, error: cabinetIdError } = await supabaseClient.rpc(
          "get_user_cabinet_id"
        );

        if (cabinetIdError || !cabinetIdData) {
          throw new Error("Impossible de récupérer le cabinet.");
        }

        const { data: clientsData, error: clientsError } = await supabaseClient
          .from("clients")
          .select("*")
          .eq("cabinet_id", cabinetIdData)
          .order("nom_entreprise", { ascending: true });

        if (clientsError) {
          throw clientsError;
        }

        setClients(clientsData || []);
      } catch (err: any) {
        console.error("Erreur récupération clients:", err);
        setFormErrors({ global: err.message || "Erreur lors du chargement des clients." });
      } finally {
        setIsLoadingClients(false);
      }
    };

    void fetchClients();
  }, []);

  // Fetch associés quand client sélectionné
  useEffect(() => {
    if (!selectedClientId) {
      setAssocies([]);
      setSelectedClient(null);
      return;
    }

    const fetchClientAndAssocies = async () => {
      setIsLoadingAssocies(true);
      try {
        const [clientResult, associesResult] = await Promise.all([
          supabaseClient
            .from("clients")
            .select("*")
            .eq("id", selectedClientId)
            .single(),
          supabaseClient
            .from("associes")
            .select("*")
            .eq("client_id", selectedClientId),
        ]);

        if (clientResult.error) {
          throw clientResult.error;
        }

        if (associesResult.error) {
          throw associesResult.error;
        }

        setSelectedClient(clientResult.data);
        setAssocies(associesResult.data || []);
      } catch (err: any) {
        console.error("Erreur récupération données:", err);
        setFormErrors({ global: err.message || "Erreur lors du chargement des données." });
      } finally {
        setIsLoadingAssocies(false);
      }
    };

    void fetchClientAndAssocies();
  }, [selectedClientId]);

  // Pré-remplir ancien_capital avec le capital social du client
  useEffect(() => {
    if (selectedClient && acteType === 'augmentation_capital') {
      setAugmentationFormData((prev) => ({
        ...prev,
        ancien_capital: selectedClient.capital_social || 0,
      }));
    }
  }, [selectedClient, acteType]);

  // Calcul automatique du prix total (cession)
  useEffect(() => {
    if (formData.nombre_actions && formData.prix_unitaire) {
      const total = Number(formData.nombre_actions) * Number(formData.prix_unitaire);
      setFormData((prev) => ({
        ...prev,
        prix_total: total,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        prix_total: '',
      }));
    }
  }, [formData.nombre_actions, formData.prix_unitaire]);

  // Calcul automatique du nouveau capital (augmentation)
  useEffect(() => {
    if (augmentationFormData.ancien_capital && augmentationFormData.montant_augmentation) {
      const nouveau = Number(augmentationFormData.ancien_capital) + Number(augmentationFormData.montant_augmentation);
      setAugmentationFormData((prev) => ({
        ...prev,
        nouveau_capital: nouveau,
      }));
    } else {
      setAugmentationFormData((prev) => ({
        ...prev,
        nouveau_capital: '',
      }));
    }
  }, [augmentationFormData.ancien_capital, augmentationFormData.montant_augmentation]);

  const handleChange = <Field extends keyof ActeCessionFormData>(
    field: Field,
    value: ActeCessionFormData[Field]
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
    setFormErrors((previous) => ({
      ...previous,
      [field]: undefined,
      global: undefined,
    }));
  };

  const handleAugmentationChange = <Field extends keyof ActeAugmentationCapitalFormData>(
    field: Field,
    value: ActeAugmentationCapitalFormData[Field]
  ) => {
    setAugmentationFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
    setFormErrors((previous) => ({
      ...previous,
      [field]: undefined,
      global: undefined,
    }));
  };

  const handleAGOrdinaireChange = <Field extends keyof ActeAGOrdinaireFormData>(
    field: Field,
    value: ActeAGOrdinaireFormData[Field]
  ) => {
    setAGOrdinaireFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
    setFormErrors((previous) => ({
      ...previous,
      [field]: undefined,
      global: undefined,
    }));
  };

  const addNouvelAssocie = () => {
    setNouveauxAssocies((prev) => [
      ...prev,
      {
        nom: '',
        prenom: '',
        adresse: '',
        apport: '',
        nombre_actions: '',
      },
    ]);
  };

  const removeNouvelAssocie = (index: number) => {
    setNouveauxAssocies((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNouvelAssocie = (index: number, field: keyof NouvelAssocie, value: string | number) => {
    setNouveauxAssocies((prev) =>
      prev.map((associe, i) => (i === index ? { ...associe, [field]: value } : associe))
    );
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const newErrors: FormErrors = {};
    const errorMessages: string[] = [];

    if (!selectedClientId) {
      newErrors.global = "Veuillez sélectionner un client";
      errorMessages.push("Veuillez sélectionner un client");
      setFormErrors(newErrors);
      return { isValid: false, errors: errorMessages };
    }

    if (acteType === 'cession_actions') {
      // Validation pour cession d'actions
      if (!formData.date_acte) {
        newErrors.date_acte = "La date de l'acte est requise";
      }

      if (!formData.cedant_id) {
        newErrors.cedant_id = "Le cédant est requis";
      }

      if (!formData.cessionnaire_civilite) {
        newErrors.cessionnaire_civilite = "La civilité du cessionnaire est requise";
      }

      if (!formData.cessionnaire_nom.trim()) {
        newErrors.cessionnaire_nom = "Le nom du cessionnaire est requis";
      }

      if (!formData.cessionnaire_prenom.trim()) {
        newErrors.cessionnaire_prenom = "Le prénom du cessionnaire est requis";
      }

      if (!formData.cessionnaire_adresse.trim()) {
        newErrors.cessionnaire_adresse = "L'adresse du cessionnaire est requise";
      }

      if (!formData.cessionnaire_nationalite.trim()) {
        newErrors.cessionnaire_nationalite = "La nationalité du cessionnaire est requise";
      }

      if (!formData.nombre_actions || Number(formData.nombre_actions) < 1) {
        newErrors.nombre_actions = "Le nombre d'actions doit être supérieur à zéro";
      }

      // Vérifier que le nombre d'actions ne dépasse pas celui détenu par l'associé
      const cedantSelected = associes.find((a) => a.id === formData.cedant_id);
      if (cedantSelected && formData.nombre_actions) {
        const nombreActionsCedant = cedantSelected.nombre_actions || 0;
        if (Number(formData.nombre_actions) > nombreActionsCedant) {
          newErrors.nombre_actions = `L'associé détient seulement ${nombreActionsCedant} action${nombreActionsCedant > 1 ? 's' : ''}`;
        }
      }

      if (!formData.prix_unitaire || Number(formData.prix_unitaire) < 0.01) {
        newErrors.prix_unitaire = "Le prix unitaire doit être supérieur à 0,01€";
      }

      if (!formData.date_agrement) {
        newErrors.date_agrement = "La date d'agrément est requise";
      }

      if (!formData.modalites_paiement.trim()) {
        newErrors.modalites_paiement = "Les modalités de paiement sont requises";
      }
    } else if (acteType === 'augmentation_capital') {
      // Validation pour augmentation de capital
      if (!augmentationFormData.date_acte) {
        newErrors.date_acte = "La date de l'acte est requise";
      }

      if (!augmentationFormData.ancien_capital || Number(augmentationFormData.ancien_capital) < 1) {
        newErrors.ancien_capital = "Le capital social actuel est requis et doit être supérieur à 0";
      }

      if (!augmentationFormData.montant_augmentation || Number(augmentationFormData.montant_augmentation) < 1) {
        newErrors.montant_augmentation = "Le montant de l'augmentation est requis et doit être supérieur à 0";
      }

      if (!augmentationFormData.modalite) {
        newErrors.modalite = "La modalité d'augmentation est requise";
      }

      if (augmentationFormData.modalite === 'nature' && !augmentationFormData.description_apport.trim()) {
        newErrors.description_apport = "La description de l'apport en nature est requise";
      }

      if (!augmentationFormData.nombre_nouvelles_actions || Number(augmentationFormData.nombre_nouvelles_actions) < 1) {
        newErrors.nombre_nouvelles_actions = "Le nombre de nouvelles actions est requis et doit être supérieur à 0";
      }

      if (!augmentationFormData.quorum || Number(augmentationFormData.quorum) < 50 || Number(augmentationFormData.quorum) > 100) {
        newErrors.quorum = "Le quorum est requis et doit être entre 50% et 100%";
      }

      if (augmentationFormData.votes_pour === '' || Number(augmentationFormData.votes_pour) < 0) {
        newErrors.votes_pour = "Le nombre de votes POUR est requis";
      }

      if (augmentationFormData.votes_contre === '' || Number(augmentationFormData.votes_contre) < 0) {
        newErrors.votes_contre = "Le nombre de votes CONTRE est requis";
      }

      // Validation des apports en nature
      if (augmentationFormData.apport_nature) {
        if (!augmentationFormData.apport_nature_description || augmentationFormData.apport_nature_description.trim() === '') {
          const errorMsg = "Description des apports en nature requise";
          newErrors.apport_nature_description = errorMsg;
          errorMessages.push(errorMsg);
        }
        if (!augmentationFormData.apport_nature_montant_total || augmentationFormData.apport_nature_montant_total <= 0) {
          const errorMsg = "Montant total des apports en nature requis";
          newErrors.apport_nature_montant_total = errorMsg;
          errorMessages.push(errorMsg);
        }
        if (augmentationFormData.commissaire_obligatoire && !commissaireDesigne) {
          const errorMsg = "Nom du commissaire aux apports OBLIGATOIRE (bien > 30 000€ ou apports > 50% du capital)";
          newErrors.commissaire_nom = errorMsg;
          errorMessages.push(errorMsg);
        }
        if (commissaireDesigne && (!augmentationFormData.commissaire_nom || augmentationFormData.commissaire_nom.trim() === '')) {
          const errorMsg = "Nom du commissaire aux apports OBLIGATOIRE (bien > 30 000€ ou apports > 50% du capital)";
          newErrors.commissaire_nom = errorMsg;
          errorMessages.push(errorMsg);
        }
      }

      // Validation des nouveaux associés si présents
      nouveauxAssocies.forEach((associe, index) => {
        if (!associe.nom.trim()) {
          newErrors[`nouvel_associe_${index}_nom` as keyof FormErrors] = "Le nom est requis";
        }
        if (!associe.prenom.trim()) {
          newErrors[`nouvel_associe_${index}_prenom` as keyof FormErrors] = "Le prénom est requis";
        }
        if (!associe.adresse.trim()) {
          newErrors[`nouvel_associe_${index}_adresse` as keyof FormErrors] = "L'adresse est requise";
        }
        if (!associe.apport || Number(associe.apport) <= 0) {
          newErrors[`nouvel_associe_${index}_apport` as keyof FormErrors] = "L'apport est requis et doit être supérieur à 0";
        }
        if (!associe.nombre_actions || Number(associe.nombre_actions) < 1) {
          newErrors[`nouvel_associe_${index}_nombre_actions` as keyof FormErrors] = "Le nombre d'actions est requis et doit être supérieur à 0";
        }
      });
    } else if (acteType === 'ag_ordinaire') {
      // Validation pour AG Ordinaire
      if (!agOrdinaireFormData.date_ag) {
        newErrors.date_ag = "La date de l'assemblée générale est requise";
      }

      if (!agOrdinaireFormData.heure_ag) {
        newErrors.heure_ag = "L'heure de l'assemblée générale est requise";
      }

      if (!agOrdinaireFormData.exercice_clos.trim()) {
        newErrors.exercice_clos = "L'exercice clos est requis";
      }

      if (agOrdinaireFormData.resultat_exercice === '' || agOrdinaireFormData.resultat_exercice === null) {
        newErrors.resultat_exercice = "Le résultat de l'exercice est requis";
      }

      if (!agOrdinaireFormData.affectation_resultat) {
        newErrors.affectation_resultat = "L'affectation du résultat est requise";
      }

      // Validation conditionnelle selon l'affectation
      if (agOrdinaireFormData.affectation_resultat === 'dividendes') {
        if (agOrdinaireFormData.montant_dividendes === '' || Number(agOrdinaireFormData.montant_dividendes) <= 0) {
          newErrors.montant_dividendes = "Le montant des dividendes est requis";
        }
        const resultat = Number(agOrdinaireFormData.resultat_exercice);
        const dividendes = Number(agOrdinaireFormData.montant_dividendes);
        if (resultat > 0 && dividendes !== resultat) {
          newErrors.montant_dividendes = "Le montant des dividendes doit égaler le résultat de l'exercice";
        }
      }

      if (agOrdinaireFormData.affectation_resultat === 'mixte') {
        const resultat = Number(agOrdinaireFormData.resultat_exercice);
        const dividendes = Number(agOrdinaireFormData.montant_dividendes || 0);
        const reserves = Number(agOrdinaireFormData.montant_reserves || 0);
        const report = Number(agOrdinaireFormData.montant_report || 0);
        const somme = dividendes + reserves + report;
        if (Math.abs(somme - resultat) > 0.01) {
          newErrors.montant_dividendes = "La somme des montants doit égaler le résultat de l'exercice";
        }
      }

      if (agOrdinaireFormData.votes_pour_comptes === '' || Number(agOrdinaireFormData.votes_pour_comptes) < 0) {
        newErrors.votes_pour_comptes = "Le nombre de votes POUR est requis";
      }

      if (agOrdinaireFormData.votes_contre_comptes === '' || Number(agOrdinaireFormData.votes_contre_comptes) < 0) {
        newErrors.votes_contre_comptes = "Le nombre de votes CONTRE est requis";
      }

      if (agOrdinaireFormData.votes_abstention_comptes === '' || Number(agOrdinaireFormData.votes_abstention_comptes) < 0) {
        newErrors.votes_abstention_comptes = "Le nombre de votes ABSTENTION est requis";
      }

      // Validation du total des votes = nombre d'actions
      if (selectedClient && associes.length > 0) {
        const nbActionsTotal = associes.reduce((sum, a) => sum + (a.nombre_actions || 0), 0);
        const totalVotes = (Number(agOrdinaireFormData.votes_pour_comptes) || 0) + 
                          (Number(agOrdinaireFormData.votes_contre_comptes) || 0) + 
                          (Number(agOrdinaireFormData.votes_abstention_comptes) || 0);
        
        if (totalVotes !== nbActionsTotal) {
          newErrors.votes_pour_comptes = `Le total des votes (${totalVotes}) doit égaler le nombre d'actions (${nbActionsTotal})`;
        }
      }
    }

    // Collecter toutes les erreurs pour le toast
    Object.values(newErrors).forEach((error) => {
      if (error && typeof error === 'string' && !errorMessages.includes(error)) {
        errorMessages.push(error);
      }
    });

    setFormErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: errorMessages };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});

    const validationResult = validateForm();
    if (!validationResult.isValid) {
      // Afficher les erreurs avec toast
      if (validationResult.errors.length > 0) {
        toast.error("❌ Erreurs de validation", {
          description: validationResult.errors.join(' • '),
          duration: 5000,
        });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Récupérer le cabinet_id via RPC
      const { data: cabinetIdData, error: cabinetIdError } = await supabaseClient.rpc(
        "get_user_cabinet_id"
      );

      if (cabinetIdError || !cabinetIdData) {
        throw new Error("Impossible de récupérer le cabinet. Veuillez vous reconnecter.");
      }

      let acteData: any;

      if (acteType === 'cession_actions') {
        // Préparer les données pour la cession d'actions
        acteData = {
          client_id: selectedClientId,
          cabinet_id: cabinetIdData,
          type: 'cession_actions',
          date_acte: formData.date_acte,
          statut: formData.statut,
          cedant_id: formData.cedant_id,
          cessionnaire_civilite: formData.cessionnaire_civilite,
          cessionnaire_nom: formData.cessionnaire_nom.trim(),
          cessionnaire_prenom: formData.cessionnaire_prenom.trim(),
          cessionnaire_adresse: formData.cessionnaire_adresse.trim(),
          cessionnaire_nationalite: formData.cessionnaire_nationalite.trim(),
          nombre_actions: Number(formData.nombre_actions),
          prix_unitaire: Number(formData.prix_unitaire),
          prix_total: Number(formData.prix_total),
          date_agrement: formData.date_agrement,
          modalites_paiement: formData.modalites_paiement.trim(),
        };
      } else if (acteType === 'augmentation_capital') {
        // Préparer les données pour l'augmentation de capital
        const nouveauCapital = augmentationFormData.nouveau_capital || 
          (Number(augmentationFormData.ancien_capital) + Number(augmentationFormData.montant_augmentation));

        acteData = {
          client_id: selectedClientId,
          cabinet_id: cabinetIdData,
          type: 'augmentation_capital',
          date_acte: augmentationFormData.date_acte,
          statut: augmentationFormData.statut,
          ancien_capital: Number(augmentationFormData.ancien_capital),
          nouveau_capital: nouveauCapital,
          montant_augmentation: Number(augmentationFormData.montant_augmentation),
          modalite: augmentationFormData.modalite,
          description_apport: augmentationFormData.modalite === 'nature' 
            ? augmentationFormData.description_apport.trim() 
            : null,
          nombre_nouvelles_actions: Number(augmentationFormData.nombre_nouvelles_actions),
          quorum: Number(augmentationFormData.quorum),
          votes_pour: Number(augmentationFormData.votes_pour),
          votes_contre: Number(augmentationFormData.votes_contre),
          nouveaux_associes: nouveauxAssocies.length > 0 
            ? nouveauxAssocies.map(a => ({
                nom: a.nom.trim(),
                prenom: a.prenom.trim(),
                adresse: a.adresse.trim(),
                apport: Number(a.apport),
                nombre_actions: Number(a.nombre_actions),
              }))
            : null,
          // Apports en nature
          apport_nature: augmentationFormData.apport_nature || false,
          apport_nature_description: augmentationFormData.apport_nature ? (augmentationFormData.apport_nature_description || null) : null,
          apport_nature_montant_total: augmentationFormData.apport_nature ? (augmentationFormData.apport_nature_montant_total || null) : null,
          apport_nature_pourcentage_capital: augmentationFormData.apport_nature ? (augmentationFormData.apport_nature_pourcentage_capital || null) : null,
          commissaire_obligatoire: augmentationFormData.commissaire_obligatoire || false,
          commissaire_nom: commissaireDesigne ? (augmentationFormData.commissaire_nom ? augmentationFormData.commissaire_nom.trim() : null) : null,
          bien_superieur_30k: (augmentationFormData.apport_nature_montant_total || 0) > 30000,
        };
      } else if (acteType === 'ag_ordinaire') {
        // Préparer les données pour l'AG Ordinaire
        acteData = {
          client_id: selectedClientId,
          cabinet_id: cabinetIdData,
          type: 'ag_ordinaire',
          date_acte: agOrdinaireFormData.date_acte,
          statut: agOrdinaireFormData.statut,
          date_ag: agOrdinaireFormData.date_ag,
          heure_ag: agOrdinaireFormData.heure_ag,
          lieu_ag: agOrdinaireFormData.lieu_ag || null,
          exercice_clos: agOrdinaireFormData.exercice_clos.trim(),
          resultat_exercice: Number(agOrdinaireFormData.resultat_exercice),
          affectation_resultat: agOrdinaireFormData.affectation_resultat,
          montant_dividendes: agOrdinaireFormData.montant_dividendes !== '' ? Number(agOrdinaireFormData.montant_dividendes) : null,
          montant_reserves: agOrdinaireFormData.montant_reserves !== '' ? Number(agOrdinaireFormData.montant_reserves) : null,
          montant_report: agOrdinaireFormData.montant_report !== '' ? Number(agOrdinaireFormData.montant_report) : null,
          quitus_president: agOrdinaireFormData.quitus_president,
          votes_pour_comptes: Number(agOrdinaireFormData.votes_pour_comptes),
          votes_contre_comptes: Number(agOrdinaireFormData.votes_contre_comptes || 0),
          votes_abstention_comptes: Number(agOrdinaireFormData.votes_abstention_comptes || 0),
        };
      }

      const { error: insertError } = await supabaseClient
        .from("actes_juridiques")
        .insert(acteData);

      if (insertError) {
        throw insertError;
      }

      // Succès - redirection
      const acteTypeLabel = acteType === 'cession_actions' ? 'de cession' : acteType === 'augmentation_capital' ? "d'augmentation de capital" : "d'AG Ordinaire";
      alert(`✅ Acte ${acteTypeLabel} créé avec succès !`);
      router.push("/dashboard/actes");
    } catch (err: any) {
      console.error("Erreur création acte:", err);
      setFormErrors({
        global: err.message || "Erreur lors de la création de l'acte. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trouver le cédant sélectionné pour afficher le nombre d'actions
  const cedantSelected = associes.find((a) => a.id === formData.cedant_id);
  const nombreActionsCedant = cedantSelected?.nombre_actions || 0;
  const prixTotalLettres = formData.prix_total && formData.prix_total > 0
    ? nombreEnLettres(formData.prix_total)
    : '';

  // Fonction pour formater les montants
  const formatMontant = (montant: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(montant);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/dashboard/actes" className="hover:text-foreground">
          Actes juridiques
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Nouveau</span>
      </div>

      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nouvel acte juridique</h1>
        <p className="text-muted-foreground mt-2">
          Créez un nouvel acte juridique pour un de vos clients
        </p>
      </div>

      {formErrors.global && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{formErrors.global}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* ÉTAPE 1 - Sélection du client */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Étape 1 - Sélection du client</CardTitle>
            <CardDescription>
              Choisissez le client concerné par cet acte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">
                Client <span className="text-red-500">*</span>
              </Label>
              {isLoadingClients ? (
                <div className="text-sm text-muted-foreground">Chargement des clients...</div>
              ) : (
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id!}>
                        {client.nom_entreprise} - SIRET {client.siret || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {clients.length === 0 && !isLoadingClients && (
                <p className="text-sm text-muted-foreground">
                  Aucun client trouvé. Créez d'abord un client.
                </p>
              )}
            </div>

            {selectedClient && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{selectedClient.nom_entreprise}</h3>
                {selectedClient.siret && (
                  <p className="text-sm text-muted-foreground">SIRET : {selectedClient.siret}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ÉTAPE 2 - Type d'acte */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Étape 2 - Type d'acte</CardTitle>
            <CardDescription>
              Sélectionnez le type d'acte juridique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={acteType} onValueChange={(value) => setActeType(value as 'cession_actions' | 'augmentation_capital' | 'ag_ordinaire')} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cession_actions" id="type-cession" />
                <Label htmlFor="type-cession" className="cursor-pointer flex items-center gap-2">
                  <span>Cession d'actions</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="augmentation_capital" id="type-augmentation" />
                <Label htmlFor="type-augmentation" className="cursor-pointer flex items-center gap-2">
                  <span>Augmentation de capital</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ag_ordinaire" id="type-ag" />
                <Label htmlFor="type-ag" className="cursor-pointer flex items-center gap-2">
                  <span>Assemblée Générale Ordinaire (approbation comptes)</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* FORMULAIRE CESSION (affiché si client sélectionné et type = cession) */}
        {selectedClientId && acteType === 'cession_actions' && (
          <>
            {/* Section Informations générales */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Date et statut de l'acte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_acte">
                      Date de l'acte <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date_acte"
                      type="date"
                      value={formData.date_acte}
                      onChange={(e) => handleChange("date_acte", e.target.value)}
                      required
                    />
                    {formErrors.date_acte && (
                      <p className="text-sm text-red-500">{formErrors.date_acte}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="statut">
                      Statut <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.statut}
                      onValueChange={(value) =>
                        handleChange("statut", value as 'brouillon' | 'validé' | 'signé')
                      }
                    >
                      <SelectTrigger id="statut">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="validé">Validé</SelectItem>
                        <SelectItem value="signé">Signé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Le Cédant */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Le Cédant (qui vend)</CardTitle>
                <CardDescription>
                  Sélectionnez l'associé qui cède ses actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAssocies ? (
                  <div className="text-sm text-muted-foreground">Chargement des associés...</div>
                ) : associes.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Ce client n'a pas d'associés enregistrés. Veuillez d'abord ajouter des associés à ce client.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cedant_id">
                        Associé qui cède ses actions <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.cedant_id}
                        onValueChange={(value) => handleChange("cedant_id", value)}
                      >
                        <SelectTrigger id="cedant_id">
                          <SelectValue placeholder="Sélectionnez un associé" />
                        </SelectTrigger>
                        <SelectContent>
                          {associes.map((associe) => (
                            <SelectItem key={associe.id} value={associe.id!}>
                              {associe.civilite} {associe.prenom} {associe.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.cedant_id && (
                        <p className="text-sm text-red-500">{formErrors.cedant_id}</p>
                      )}
                      {cedantSelected && (
                        <p className="text-sm text-muted-foreground">
                          Détient {nombreActionsCedant} action{nombreActionsCedant > 1 ? 's' : ''} dans {selectedClient?.nom_entreprise}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Section Le Cessionnaire */}
            {associes.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Le Cessionnaire (qui achète)</CardTitle>
                  <CardDescription>
                    Informations sur l'acheteur des actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Civilité <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={formData.cessionnaire_civilite}
                      onValueChange={(value) => {
                        console.log("Civilité sélectionnée:", value);
                        handleChange("cessionnaire_civilite", value as 'M.' | 'Mme');
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="M." id="civilite-m" />
                        <Label htmlFor="civilite-m" className="cursor-pointer">
                          M.
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Mme" id="civilite-mme" />
                        <Label htmlFor="civilite-mme" className="cursor-pointer">
                          Mme
                        </Label>
                      </div>
                    </RadioGroup>
                    {formErrors.cessionnaire_civilite && (
                      <p className="text-sm text-red-500">{formErrors.cessionnaire_civilite}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cessionnaire_nom">
                        Nom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cessionnaire_nom"
                        value={formData.cessionnaire_nom}
                        onChange={(e) => handleChange("cessionnaire_nom", e.target.value)}
                        required
                      />
                      {formErrors.cessionnaire_nom && (
                        <p className="text-sm text-red-500">{formErrors.cessionnaire_nom}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cessionnaire_prenom">
                        Prénom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cessionnaire_prenom"
                        value={formData.cessionnaire_prenom}
                        onChange={(e) => handleChange("cessionnaire_prenom", e.target.value)}
                        required
                      />
                      {formErrors.cessionnaire_prenom && (
                        <p className="text-sm text-red-500">{formErrors.cessionnaire_prenom}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cessionnaire_adresse">
                      Adresse complète <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="cessionnaire_adresse"
                      value={formData.cessionnaire_adresse}
                      onChange={(e) => handleChange("cessionnaire_adresse", e.target.value)}
                      required
                      rows={3}
                    />
                    {formErrors.cessionnaire_adresse && (
                      <p className="text-sm text-red-500">{formErrors.cessionnaire_adresse}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cessionnaire_nationalite">
                      Nationalité <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cessionnaire_nationalite"
                      value={formData.cessionnaire_nationalite}
                      onChange={(e) => handleChange("cessionnaire_nationalite", e.target.value)}
                      required
                    />
                    {formErrors.cessionnaire_nationalite && (
                      <p className="text-sm text-red-500">{formErrors.cessionnaire_nationalite}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section Détails de la cession */}
            {associes.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Détails de la cession</CardTitle>
                  <CardDescription>
                    Informations sur la transaction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_actions">
                      Nombre d'actions cédées <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nombre_actions"
                      type="number"
                      min="1"
                      value={formData.nombre_actions}
                      onChange={(e) =>
                        handleChange("nombre_actions", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.nombre_actions && (
                      <p className="text-sm text-red-500">{formErrors.nombre_actions}</p>
                    )}
                    {cedantSelected && (
                      <p className="text-sm text-muted-foreground">
                        L'associé détient {nombreActionsCedant} action{nombreActionsCedant > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="prix_unitaire">
                        Prix unitaire par action (€) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="prix_unitaire"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.prix_unitaire}
                        onChange={(e) =>
                          handleChange("prix_unitaire", e.target.value === '' ? '' : Number(e.target.value))
                        }
                        required
                      />
                      {formErrors.prix_unitaire && (
                        <p className="text-sm text-red-500">{formErrors.prix_unitaire}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prix_total">
                        Prix total (€)
                      </Label>
                      <Input
                        id="prix_total"
                        type="number"
                        value={formData.prix_total}
                        readOnly
                        className="bg-muted"
                      />
                      {prixTotalLettres && (
                        <p className="text-sm text-muted-foreground italic">
                          {prixTotalLettres}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_agrement">
                      Date d'agrément par les associés <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date_agrement"
                      type="date"
                      value={formData.date_agrement}
                      onChange={(e) => handleChange("date_agrement", e.target.value)}
                      required
                    />
                    {formErrors.date_agrement && (
                      <p className="text-sm text-red-500">{formErrors.date_agrement}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Date de l'assemblée générale ayant approuvé la cession
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modalites_paiement">
                      Modalités de paiement <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="modalites_paiement"
                      value={formData.modalites_paiement}
                      onChange={(e) => handleChange("modalites_paiement", e.target.value)}
                      placeholder="Ex: Paiement comptant à la signature / Paiement échelonné en 3 fois..."
                      required
                      rows={3}
                    />
                    {formErrors.modalites_paiement && (
                      <p className="text-sm text-red-500">{formErrors.modalites_paiement}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* FORMULAIRE AUGMENTATION DE CAPITAL (affiché si client sélectionné et type = augmentation) */}
        {selectedClientId && acteType === 'augmentation_capital' && (
          <>
            {/* Section Informations générales */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Date et statut de l'acte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="aug_date_acte">
                      Date de l'acte <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="aug_date_acte"
                      type="date"
                      value={augmentationFormData.date_acte}
                      onChange={(e) => handleAugmentationChange("date_acte", e.target.value)}
                      required
                    />
                    {formErrors.date_acte && (
                      <p className="text-sm text-red-500">{formErrors.date_acte}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aug_statut">
                      Statut <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={augmentationFormData.statut}
                      onValueChange={(value) =>
                        handleAugmentationChange("statut", value as 'brouillon' | 'validé' | 'signé')
                      }
                    >
                      <SelectTrigger id="aug_statut">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="validé">Validé</SelectItem>
                        <SelectItem value="signé">Signé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Capital social */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Capital social</CardTitle>
                <CardDescription>
                  Montants avant et après augmentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="ancien_capital">
                      Capital social actuel (€) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ancien_capital"
                      type="number"
                      min="1"
                      step="0.01"
                      value={augmentationFormData.ancien_capital}
                      onChange={(e) =>
                        handleAugmentationChange("ancien_capital", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.ancien_capital && (
                      <p className="text-sm text-red-500">{formErrors.ancien_capital}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Capital actuel selon nos données</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="montant_augmentation">
                      Montant de l'augmentation (€) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="montant_augmentation"
                      type="number"
                      min="1"
                      step="0.01"
                      value={augmentationFormData.montant_augmentation}
                      onChange={(e) =>
                        handleAugmentationChange("montant_augmentation", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.montant_augmentation && (
                      <p className="text-sm text-red-500">{formErrors.montant_augmentation}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nouveau_capital">
                      Nouveau capital social (€)
                    </Label>
                    <Input
                      id="nouveau_capital"
                      type="number"
                      value={augmentationFormData.nouveau_capital}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Modalité d'augmentation */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Modalité d'augmentation</CardTitle>
                <CardDescription>
                  Choisissez le type d'apport
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Modalité <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={augmentationFormData.modalite}
                    onValueChange={(value) =>
                      handleAugmentationChange("modalite", value as 'numeraire' | 'nature' | 'reserves')
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="numeraire" id="modalite-numeraire" />
                      <Label htmlFor="modalite-numeraire" className="cursor-pointer">
                        <span className="font-medium">Apport en numéraire</span>
                        <span className="text-sm text-muted-foreground ml-2">- Apport d'argent frais</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nature" id="modalite-nature" />
                      <Label htmlFor="modalite-nature" className="cursor-pointer">
                        <span className="font-medium">Apport en nature</span>
                        <span className="text-sm text-muted-foreground ml-2">- Apport de biens, matériel</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reserves" id="modalite-reserves" />
                      <Label htmlFor="modalite-reserves" className="cursor-pointer">
                        <span className="font-medium">Incorporation de réserves</span>
                        <span className="text-sm text-muted-foreground ml-2">- Sans apport nouveau (comptable)</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {formErrors.modalite && (
                    <p className="text-sm text-red-500">{formErrors.modalite}</p>
                  )}
                </div>

                {augmentationFormData.modalite === 'nature' && (
                  <div className="space-y-2">
                    <Label htmlFor="description_apport">
                      Description détaillée de l'apport en nature <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description_apport"
                      value={augmentationFormData.description_apport}
                      onChange={(e) => handleAugmentationChange("description_apport", e.target.value)}
                      placeholder="Ex: Matériel informatique, véhicule, immeuble..."
                      required
                      rows={3}
                    />
                    {formErrors.description_apport && (
                      <p className="text-sm text-red-500">{formErrors.description_apport}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Apports en nature */}
            {acteType === 'augmentation_capital' && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Apports en nature</CardTitle>
                  <CardDescription>
                    Gestion des apports en nature et commissaire aux apports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* APPORTS EN NATURE - NOUVEAU BLOC */}
                  <div className="space-y-4">
                    {/* Checkbox activation */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="apport_nature"
                        checked={augmentationFormData.apport_nature || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleAugmentationChange("apport_nature", checked);
                          if (!checked) {
                            handleAugmentationChange("apport_nature_description", '');
                            handleAugmentationChange("apport_nature_montant_total", 0);
                            handleAugmentationChange("apport_nature_pourcentage_capital", 0);
                            handleAugmentationChange("commissaire_obligatoire", false);
                            handleAugmentationChange("commissaire_nom", '');
                            handleAugmentationChange("bien_superieur_30k", false);
                            setCommissaireDesigne(false);
                          }
                        }}
                      />
                      <label htmlFor="apport_nature" className="cursor-pointer">Cette augmentation inclut des apports en nature</label>
                    </div>

                    {augmentationFormData.apport_nature && (
                      <>
                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Description des biens apportés *
                          </label>
                          <textarea
                            className="w-full border rounded p-2"
                            placeholder="Ex: Immeuble 3 rue Jacques Duclos, valeur 100 000€"
                            rows={3}
                            value={augmentationFormData.apport_nature_description || ''}
                            onChange={(e) => handleAugmentationChange("apport_nature_description", e.target.value)}
                          />
                        </div>

                        {/* Montant */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Montant total des apports en nature (€) *
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded p-2"
                            value={augmentationFormData.apport_nature_montant_total || ''}
                            onChange={(e) => {
                              const montant = parseFloat(e.target.value) || 0;
                              const nouveauCap = Number(augmentationFormData.nouveau_capital) || 0;
                              const pourcentage = nouveauCap > 0 ? (montant / nouveauCap) * 100 : 0;

                              // Déterminer si commissaire obligatoire
                              const obligatoire = montant > 30000 || pourcentage > 50;

                              handleAugmentationChange("apport_nature_montant_total", montant);
                              handleAugmentationChange("apport_nature_pourcentage_capital", pourcentage);
                              handleAugmentationChange("commissaire_obligatoire", obligatoire);
                              handleAugmentationChange("bien_superieur_30k", montant > 30000);
                            }}
                          />
                          {augmentationFormData.apport_nature_montant_total && augmentationFormData.apport_nature_montant_total > 0 && augmentationFormData.nouveau_capital && Number(augmentationFormData.nouveau_capital) > 0 && (
                            <p className="text-sm text-blue-600 mt-1">
                              📊 {augmentationFormData.apport_nature_pourcentage_capital?.toFixed(2)}% du nouveau capital
                            </p>
                          )}
                        </div>

                        {/* Alerte commissaire obligatoire */}
                        {augmentationFormData.commissaire_obligatoire && (
                          <div className="bg-orange-100 border border-orange-300 rounded p-3">
                            <p className="font-bold text-orange-800">⚠️ COMMISSAIRE AUX APPORTS OBLIGATOIRE</p>
                            <p className="text-sm text-orange-700">
                              {augmentationFormData.bien_superieur_30k && augmentationFormData.apport_nature_pourcentage_capital && augmentationFormData.apport_nature_pourcentage_capital > 50
                                ? "Bien > 30 000€ ET apports > 50% du capital"
                                : augmentationFormData.bien_superieur_30k
                                  ? "Au moins un bien excède 30 000€"
                                  : "Les apports dépassent 50% du capital social"}
                            </p>
                            <p className="text-xs text-orange-600 mt-1">Article L227-1 Code de commerce</p>
                          </div>
                        )}

                        {/* Commissaire désigné */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="commissaire_designe"
                            checked={commissaireDesigne}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCommissaireDesigne(checked);
                              if (!checked) {
                                handleAugmentationChange("commissaire_nom", '');
                              }
                            }}
                          />
                          <label htmlFor="commissaire_designe" className="cursor-pointer">Un commissaire aux apports a été désigné</label>
                        </div>

                        {commissaireDesigne && (
                          <div>
                            <label className="block text-sm font-medium mb-1">Nom du commissaire *</label>
                            <input
                              type="text"
                              className="w-full border rounded p-2"
                              placeholder="Ex: Jean Martin, Expert-comptable"
                              value={augmentationFormData.commissaire_nom || ''}
                              onChange={(e) => handleAugmentationChange("commissaire_nom", e.target.value)}
                            />
                            {formErrors.commissaire_nom && (
                              <p className="text-sm text-red-500 mt-1">{formErrors.commissaire_nom}</p>
                            )}
                          </div>
                        )}

                        {/* Alerte responsabilité si pas de commissaire */}
                        {!commissaireDesigne && (
                          <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                            <p className="text-sm text-yellow-800">
                              ⚠️ Sans commissaire, les associés sont solidairement responsables pendant 5 ans de la valeur attribuée (L227-1)
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section Actions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Nombre de nouvelles actions créées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_nouvelles_actions">
                    Nombre de nouvelles actions créées <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre_nouvelles_actions"
                    type="number"
                    min="1"
                    value={augmentationFormData.nombre_nouvelles_actions}
                    onChange={(e) =>
                      handleAugmentationChange("nombre_nouvelles_actions", e.target.value === '' ? '' : Number(e.target.value))
                    }
                    required
                  />
                  {formErrors.nombre_nouvelles_actions && (
                    <p className="text-sm text-red-500">{formErrors.nombre_nouvelles_actions}</p>
                  )}
                  {selectedClient && augmentationFormData.nombre_nouvelles_actions && augmentationFormData.nouveau_capital && (
                    <p className="text-sm text-muted-foreground">
                      Valeur nominale = {formatMontant(Number(augmentationFormData.nouveau_capital) / ((selectedClient.nb_actions || 0) + Number(augmentationFormData.nombre_nouvelles_actions)))}€
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section Assemblée Générale */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Assemblée Générale</CardTitle>
                <CardDescription>
                  Quorum et résultats du vote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quorum">
                      Quorum (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quorum"
                      type="number"
                      min="50"
                      max="100"
                      value={augmentationFormData.quorum}
                      onChange={(e) =>
                        handleAugmentationChange("quorum", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.quorum && (
                      <p className="text-sm text-red-500">{formErrors.quorum}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Pourcentage du capital présent ou représenté</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="votes_pour">
                      Votes POUR <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="votes_pour"
                      type="number"
                      min="0"
                      value={augmentationFormData.votes_pour}
                      onChange={(e) =>
                        handleAugmentationChange("votes_pour", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.votes_pour && (
                      <p className="text-sm text-red-500">{formErrors.votes_pour}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="votes_contre">
                      Votes CONTRE <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="votes_contre"
                      type="number"
                      min="0"
                      value={augmentationFormData.votes_contre}
                      onChange={(e) =>
                        handleAugmentationChange("votes_contre", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.votes_contre && (
                      <p className="text-sm text-red-500">{formErrors.votes_contre}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Nouveaux associés */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Nouveaux associés</CardTitle>
                <CardDescription>
                  Ajoutez les nouveaux associés si l'augmentation en crée
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNouvelAssocie}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un nouvel associé
                </Button>

                {nouveauxAssocies.map((associe, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold">Associé {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNouvelAssocie(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`associe_${index}_nom`}>
                          Nom <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`associe_${index}_nom`}
                          value={associe.nom}
                          onChange={(e) => updateNouvelAssocie(index, 'nom', e.target.value)}
                          required
                        />
                        {formErrors[`nouvel_associe_${index}_nom` as keyof FormErrors] && (
                          <p className="text-sm text-red-500">{formErrors[`nouvel_associe_${index}_nom` as keyof FormErrors]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`associe_${index}_prenom`}>
                          Prénom <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`associe_${index}_prenom`}
                          value={associe.prenom}
                          onChange={(e) => updateNouvelAssocie(index, 'prenom', e.target.value)}
                          required
                        />
                        {formErrors[`nouvel_associe_${index}_prenom` as keyof FormErrors] && (
                          <p className="text-sm text-red-500">{formErrors[`nouvel_associe_${index}_prenom` as keyof FormErrors]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor={`associe_${index}_adresse`}>
                        Adresse <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id={`associe_${index}_adresse`}
                        value={associe.adresse}
                        onChange={(e) => updateNouvelAssocie(index, 'adresse', e.target.value)}
                        required
                        rows={2}
                      />
                      {formErrors[`nouvel_associe_${index}_adresse` as keyof FormErrors] && (
                        <p className="text-sm text-red-500">{formErrors[`nouvel_associe_${index}_adresse` as keyof FormErrors]}</p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor={`associe_${index}_apport`}>
                          Montant apporté (€) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`associe_${index}_apport`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={associe.apport}
                          onChange={(e) => updateNouvelAssocie(index, 'apport', e.target.value === '' ? '' : Number(e.target.value))}
                          required
                        />
                        {formErrors[`nouvel_associe_${index}_apport` as keyof FormErrors] && (
                          <p className="text-sm text-red-500">{formErrors[`nouvel_associe_${index}_apport` as keyof FormErrors]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`associe_${index}_nombre_actions`}>
                          Nombre d'actions attribuées <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`associe_${index}_nombre_actions`}
                          type="number"
                          min="1"
                          value={associe.nombre_actions}
                          onChange={(e) => updateNouvelAssocie(index, 'nombre_actions', e.target.value === '' ? '' : Number(e.target.value))}
                          required
                        />
                        {formErrors[`nouvel_associe_${index}_nombre_actions` as keyof FormErrors] && (
                          <p className="text-sm text-red-500">{formErrors[`nouvel_associe_${index}_nombre_actions` as keyof FormErrors]}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* FORMULAIRE AG ORDINAIRE (affiché si client sélectionné et type = ag_ordinaire) */}
        {selectedClientId && acteType === 'ag_ordinaire' && (
          <>
            {/* Section Informations générales */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Date et statut de l'acte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ag_date_acte">
                      Date de l'acte <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ag_date_acte"
                      type="date"
                      value={agOrdinaireFormData.date_acte}
                      onChange={(e) => handleAGOrdinaireChange("date_acte", e.target.value)}
                      required
                    />
                    {formErrors.date_acte && (
                      <p className="text-sm text-red-500">{formErrors.date_acte}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ag_statut">
                      Statut <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={agOrdinaireFormData.statut}
                      onValueChange={(value) =>
                        handleAGOrdinaireChange("statut", value as 'brouillon' | 'validé' | 'signé')
                      }
                    >
                      <SelectTrigger id="ag_statut">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="validé">Validé</SelectItem>
                        <SelectItem value="signé">Signé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Assemblée Générale */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Assemblée Générale</CardTitle>
                <CardDescription>
                  Informations sur l'assemblée générale ordinaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_ag">
                      Date de l'AG <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date_ag"
                      type="date"
                      value={agOrdinaireFormData.date_ag}
                      onChange={(e) => handleAGOrdinaireChange("date_ag", e.target.value)}
                      required
                    />
                    {formErrors.date_ag && (
                      <p className="text-sm text-red-500">{formErrors.date_ag}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heure_ag">
                      Heure de l'AG <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="heure_ag"
                      type="time"
                      value={agOrdinaireFormData.heure_ag}
                      onChange={(e) => handleAGOrdinaireChange("heure_ag", e.target.value)}
                      required
                    />
                    {formErrors.heure_ag && (
                      <p className="text-sm text-red-500">{formErrors.heure_ag}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lieu_ag">
                    Lieu de l'AG
                  </Label>
                  <Input
                    id="lieu_ag"
                    type="text"
                    value={agOrdinaireFormData.lieu_ag}
                    onChange={(e) => handleAGOrdinaireChange("lieu_ag", e.target.value)}
                    placeholder="Au siège social"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercice_clos">
                    Exercice clos <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="exercice_clos"
                    type="text"
                    value={agOrdinaireFormData.exercice_clos}
                    onChange={(e) => handleAGOrdinaireChange("exercice_clos", e.target.value)}
                    placeholder="2024"
                    required
                  />
                  {formErrors.exercice_clos && (
                    <p className="text-sm text-red-500">{formErrors.exercice_clos}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section Résultat et Affectation */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Résultat et Affectation</CardTitle>
                <CardDescription>
                  Résultat de l'exercice et son affectation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resultat_exercice">
                    Résultat de l'exercice (€) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="resultat_exercice"
                    type="number"
                    step="0.01"
                    value={agOrdinaireFormData.resultat_exercice}
                    onChange={(e) => handleAGOrdinaireChange("resultat_exercice", e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Indiquer montant négatif si perte
                  </p>
                  {formErrors.resultat_exercice && (
                    <p className="text-sm text-red-500">{formErrors.resultat_exercice}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affectation_resultat">
                    Affectation du résultat <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={agOrdinaireFormData.affectation_resultat}
                    onValueChange={(value) =>
                      handleAGOrdinaireChange("affectation_resultat", value as 'report_nouveau' | 'reserves' | 'dividendes' | 'mixte')
                    }
                  >
                    <SelectTrigger id="affectation_resultat">
                      <SelectValue placeholder="Sélectionnez une affectation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="report_nouveau">Report à nouveau</SelectItem>
                      <SelectItem value="reserves">Affectation aux réserves</SelectItem>
                      <SelectItem value="dividendes">Distribution de dividendes</SelectItem>
                      <SelectItem value="mixte">Affectation mixte</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.affectation_resultat && (
                    <p className="text-sm text-red-500">{formErrors.affectation_resultat}</p>
                  )}
                </div>

                {/* Champs conditionnels selon l'affectation */}
                {(agOrdinaireFormData.affectation_resultat === 'dividendes' || agOrdinaireFormData.affectation_resultat === 'mixte') && (
                  <div className="space-y-2">
                    <Label htmlFor="montant_dividendes">
                      Montant des dividendes (€) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="montant_dividendes"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={agOrdinaireFormData.montant_dividendes}
                      onChange={(e) => handleAGOrdinaireChange("montant_dividendes", e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                    {formErrors.montant_dividendes && (
                      <p className="text-sm text-red-500">{formErrors.montant_dividendes}</p>
                    )}
                  </div>
                )}

                {(agOrdinaireFormData.affectation_resultat === 'reserves' || agOrdinaireFormData.affectation_resultat === 'mixte') && (
                  <div className="space-y-2">
                    <Label htmlFor="montant_reserves">
                      Montant mis en réserves (€) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="montant_reserves"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={agOrdinaireFormData.montant_reserves}
                      onChange={(e) => handleAGOrdinaireChange("montant_reserves", e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                    {formErrors.montant_reserves && (
                      <p className="text-sm text-red-500">{formErrors.montant_reserves}</p>
                    )}
                  </div>
                )}

                {(agOrdinaireFormData.affectation_resultat === 'report_nouveau' || agOrdinaireFormData.affectation_resultat === 'mixte') && (
                  <div className="space-y-2">
                    <Label htmlFor="montant_report">
                      Montant reporté à nouveau (€) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="montant_report"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={agOrdinaireFormData.montant_report}
                      onChange={(e) => handleAGOrdinaireChange("montant_report", e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                    {formErrors.montant_report && (
                      <p className="text-sm text-red-500">{formErrors.montant_report}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Vote */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Vote</CardTitle>
                <CardDescription>
                  Décisions de l'assemblée générale
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="quitus_president"
                    checked={agOrdinaireFormData.quitus_president}
                    onCheckedChange={(checked) =>
                      handleAGOrdinaireChange("quitus_president", checked === true)
                    }
                  />
                  <Label htmlFor="quitus_president" className="cursor-pointer">
                    Accorder le quitus au Président
                  </Label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="votes_pour_comptes">
                      Votes POUR <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="votes_pour_comptes"
                      type="number"
                      min="0"
                      value={agOrdinaireFormData.votes_pour_comptes}
                      onChange={(e) => handleAGOrdinaireChange("votes_pour_comptes", e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Nombre de voix pour l'approbation des comptes
                    </p>
                    {formErrors.votes_pour_comptes && (
                      <p className="text-sm text-red-500">{formErrors.votes_pour_comptes}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="votes_contre_comptes">
                      Votes CONTRE
                    </Label>
                    <Input
                      id="votes_contre_comptes"
                      type="number"
                      min="0"
                      value={agOrdinaireFormData.votes_contre_comptes}
                      onChange={(e) => handleAGOrdinaireChange("votes_contre_comptes", e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    {formErrors.votes_contre_comptes && (
                      <p className="text-sm text-red-500">{formErrors.votes_contre_comptes}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="votes_abstention_comptes">
                      Votes ABSTENTION
                    </Label>
                    <Input
                      id="votes_abstention_comptes"
                      type="number"
                      min="0"
                      value={agOrdinaireFormData.votes_abstention_comptes}
                      onChange={(e) => handleAGOrdinaireChange("votes_abstention_comptes", e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    {formErrors.votes_abstention_comptes && (
                      <p className="text-sm text-red-500">{formErrors.votes_abstention_comptes}</p>
                    )}
                  </div>
                </div>

                {/* Helper text pour le total des votes */}
                {selectedClient && associes.length > 0 && (() => {
                  const nbActionsTotal = associes.reduce((sum, a) => sum + (a.nombre_actions || 0), 0);
                  const totalVotes = (Number(agOrdinaireFormData.votes_pour_comptes) || 0) + 
                                     (Number(agOrdinaireFormData.votes_contre_comptes) || 0) + 
                                     (Number(agOrdinaireFormData.votes_abstention_comptes) || 0);
                  const isValid = totalVotes === nbActionsTotal;
                  
                  return (
                    <div className="mt-2">
                      <p className={`text-sm ${isValid ? 'text-muted-foreground' : 'text-red-500 font-medium'}`}>
                        Total votes : {totalVotes} / {nbActionsTotal} actions
                        {!isValid && ' ⚠️ Le total ne correspond pas'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Le total des votes (pour + contre + abstention) doit égaler le nombre total d'actions de la société ({nbActionsTotal} actions)
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </>
        )}

        {/* Boutons sticky bottom */}
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-4 mt-8 flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/actes")}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={
              isSubmitting || 
              !selectedClientId || 
              (acteType === 'cession_actions' && associes.length === 0)
            }
          >
            {isSubmitting ? "Création..." : "Créer l'acte"}
          </Button>
        </div>
      </form>
    </div>
  );
}

