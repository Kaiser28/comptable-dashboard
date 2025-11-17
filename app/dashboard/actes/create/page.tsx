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

type ActeReductionCapitalFormData = {
  date_acte: string;
  statut: 'brouillon' | 'validé' | 'signé';
  ancien_capital: number | '';
  nombre_actions: number | '';
  valeur_nominale_actuelle: number | '';
  modalite_reduction: 'rachat_annulation' | 'reduction_valeur_nominale' | 'coup_accordeon' | '';
  montant_reduction: number | '';
  nouveau_capital_apres_reduction: number | '';
  // Modalité rachat_annulation
  nombre_actions_rachetees: number | '';
  prix_rachat_par_action: number | '';
  // Modalité reduction_valeur_nominale
  ancienne_valeur_nominale: number | '';
  nouvelle_valeur_nominale: number | '';
  // Modalité coup_accordeon
  coup_accordeon_augmentation_montant: number | '';
  coup_accordeon_nouveau_capital_final: number | '';
  // Commun
  motif_reduction: string;
  reduction_motivee_pertes: boolean;
  quorum: number | '';
  votes_pour: number | '';
  votes_contre: number | '';
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

const initialReductionCapitalFormState: ActeReductionCapitalFormData = {
  date_acte: new Date().toISOString().split('T')[0],
  statut: 'brouillon',
  ancien_capital: '',
  nombre_actions: '',
  valeur_nominale_actuelle: '',
  modalite_reduction: '',
  montant_reduction: '',
  nouveau_capital_apres_reduction: '',
  nombre_actions_rachetees: '',
  prix_rachat_par_action: '',
  ancienne_valeur_nominale: '',
  nouvelle_valeur_nominale: '',
  coup_accordeon_augmentation_montant: '',
  coup_accordeon_nouveau_capital_final: '',
  motif_reduction: '',
  reduction_motivee_pertes: false,
  quorum: '',
  votes_pour: '',
  votes_contre: '',
};

type FormErrors = Partial<Record<keyof (ActeCessionFormData & ActeAugmentationCapitalFormData & ActeAGOrdinaireFormData & ActeReductionCapitalFormData), string>> & { global?: string };

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
  const [acteType, setActeType] = useState<'cession_actions' | 'augmentation_capital' | 'ag_ordinaire' | 'reduction_capital'>('cession_actions');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [associes, setAssocies] = useState<Associe[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingAssocies, setIsLoadingAssocies] = useState(false);
  const [formData, setFormData] = useState<ActeCessionFormData>(initialFormState);
  const [augmentationFormData, setAugmentationFormData] = useState<ActeAugmentationCapitalFormData>(initialAugmentationFormState);
  const [agOrdinaireFormData, setAGOrdinaireFormData] = useState<ActeAGOrdinaireFormData>(initialAGOrdinaireFormState);
  const [reductionCapitalFormData, setReductionCapitalFormData] = useState<ActeReductionCapitalFormData>(initialReductionCapitalFormState);
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
    if (selectedClient && acteType === 'reduction_capital') {
      setReductionCapitalFormData((prev) => ({
        ...prev,
        ancien_capital: selectedClient.capital_social || 0,
        nombre_actions: selectedClient.nb_actions || '',
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

  // Calcul automatique du nouveau capital après réduction
  useEffect(() => {
    if (reductionCapitalFormData.ancien_capital && reductionCapitalFormData.montant_reduction) {
      const nouveau = Number(reductionCapitalFormData.ancien_capital) - Number(reductionCapitalFormData.montant_reduction);
      setReductionCapitalFormData((prev) => ({
        ...prev,
        nouveau_capital_apres_reduction: nouveau >= 1 ? nouveau : '',
      }));
    } else {
      setReductionCapitalFormData((prev) => ({
        ...prev,
        nouveau_capital_apres_reduction: '',
      }));
    }
  }, [reductionCapitalFormData.ancien_capital, reductionCapitalFormData.montant_reduction]);

  // Calcul automatique montant réduction (rachat_annulation)
  useEffect(() => {
    if (reductionCapitalFormData.modalite_reduction === 'rachat_annulation' && 
        reductionCapitalFormData.nombre_actions_rachetees && 
        reductionCapitalFormData.prix_rachat_par_action) {
      const montant = Number(reductionCapitalFormData.nombre_actions_rachetees) * Number(reductionCapitalFormData.prix_rachat_par_action);
      setReductionCapitalFormData((prev) => ({
        ...prev,
        montant_reduction: montant,
      }));
    } else if (reductionCapitalFormData.modalite_reduction === 'rachat_annulation') {
      setReductionCapitalFormData((prev) => ({
        ...prev,
        montant_reduction: '',
      }));
    }
  }, [reductionCapitalFormData.modalite_reduction, reductionCapitalFormData.nombre_actions_rachetees, reductionCapitalFormData.prix_rachat_par_action]);

  // Calcul automatique montant réduction (reduction_valeur_nominale)
  useEffect(() => {
    if (reductionCapitalFormData.modalite_reduction === 'reduction_valeur_nominale' && 
        selectedClient && 
        reductionCapitalFormData.ancienne_valeur_nominale && 
        reductionCapitalFormData.nouvelle_valeur_nominale) {
      const nbActions = selectedClient.nb_actions || 0;
      const ancienne = Number(reductionCapitalFormData.ancienne_valeur_nominale);
      const nouvelle = Number(reductionCapitalFormData.nouvelle_valeur_nominale);
      const montant = nbActions * (ancienne - nouvelle);
      setReductionCapitalFormData((prev) => ({
        ...prev,
        montant_reduction: montant > 0 ? montant : '',
      }));
    } else if (reductionCapitalFormData.modalite_reduction === 'reduction_valeur_nominale') {
      // Ne pas réinitialiser si on est dans cette modalité mais que les champs ne sont pas remplis
    }
  }, [reductionCapitalFormData.modalite_reduction, reductionCapitalFormData.ancienne_valeur_nominale, reductionCapitalFormData.nouvelle_valeur_nominale, selectedClient]);

  // Calcul automatique capital final (coup_accordeon)
  useEffect(() => {
    if (reductionCapitalFormData.modalite_reduction === 'coup_accordeon' && 
        reductionCapitalFormData.nouveau_capital_apres_reduction && 
        reductionCapitalFormData.coup_accordeon_augmentation_montant) {
      const capitalFinal = Number(reductionCapitalFormData.nouveau_capital_apres_reduction) + Number(reductionCapitalFormData.coup_accordeon_augmentation_montant);
      setReductionCapitalFormData((prev) => ({
        ...prev,
        coup_accordeon_nouveau_capital_final: capitalFinal,
      }));
    } else if (reductionCapitalFormData.modalite_reduction === 'coup_accordeon') {
      setReductionCapitalFormData((prev) => ({
        ...prev,
        coup_accordeon_nouveau_capital_final: '',
      }));
    }
  }, [reductionCapitalFormData.modalite_reduction, reductionCapitalFormData.nouveau_capital_apres_reduction, reductionCapitalFormData.coup_accordeon_augmentation_montant]);

  // Calcul automatique de la valeur nominale actuelle
  useEffect(() => {
    if (reductionCapitalFormData.ancien_capital && reductionCapitalFormData.nombre_actions && 
        Number(reductionCapitalFormData.nombre_actions) > 0) {
      const valeurNominale = Number(reductionCapitalFormData.ancien_capital) / Number(reductionCapitalFormData.nombre_actions);
      setReductionCapitalFormData((prev) => ({
        ...prev,
        valeur_nominale_actuelle: valeurNominale,
      }));
    } else {
      setReductionCapitalFormData((prev) => ({
        ...prev,
        valeur_nominale_actuelle: '',
      }));
    }
  }, [reductionCapitalFormData.ancien_capital, reductionCapitalFormData.nombre_actions]);

  // Pré-remplir automatiquement ancienne_valeur_nominale avec la valeur nominale calculée
  useEffect(() => {
    if (reductionCapitalFormData.modalite_reduction === 'reduction_valeur_nominale' && 
        reductionCapitalFormData.valeur_nominale_actuelle !== undefined && 
        reductionCapitalFormData.valeur_nominale_actuelle !== '' &&
        Number(reductionCapitalFormData.valeur_nominale_actuelle) > 0 &&
        (reductionCapitalFormData.ancienne_valeur_nominale === undefined || 
         reductionCapitalFormData.ancienne_valeur_nominale === '' ||
         reductionCapitalFormData.ancienne_valeur_nominale === null)) {
      setReductionCapitalFormData((prev) => ({
        ...prev,
        ancienne_valeur_nominale: Number(prev.valeur_nominale_actuelle),
      }));
    }
  }, [reductionCapitalFormData.modalite_reduction, reductionCapitalFormData.valeur_nominale_actuelle]);

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

  const handleReductionCapitalChange = <Field extends keyof ActeReductionCapitalFormData>(
    field: Field,
    value: ActeReductionCapitalFormData[Field]
  ) => {
    setReductionCapitalFormData((previous) => ({
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
    } else if (acteType === 'reduction_capital') {
      // Validation pour réduction de capital
      // Champs obligatoires de base
      if (!reductionCapitalFormData.date_acte) {
        newErrors.date_acte = "La date de l'acte est requise";
      }

      if (!reductionCapitalFormData.ancien_capital || Number(reductionCapitalFormData.ancien_capital) < 1) {
        newErrors.ancien_capital = "Le capital social actuel est requis et doit être supérieur à 0";
      }

      if (!reductionCapitalFormData.nombre_actions || Number(reductionCapitalFormData.nombre_actions) < 1) {
        newErrors.nombre_actions = "Le nombre d'actions existantes est requis et doit être supérieur à 0";
      }

      if (!reductionCapitalFormData.montant_reduction || Number(reductionCapitalFormData.montant_reduction) < 0.01) {
        newErrors.montant_reduction = "Le montant de la réduction est requis et doit être supérieur à 0";
      }

      // RÈGLE 1 : Montant réduction ≤ Capital actuel
      if (reductionCapitalFormData.montant_reduction && reductionCapitalFormData.ancien_capital && 
          Number(reductionCapitalFormData.montant_reduction) > Number(reductionCapitalFormData.ancien_capital)) {
        newErrors.montant_reduction = "RÈGLE 1 : Le montant de réduction ne peut pas dépasser le capital actuel";
      }

      // RÈGLE 2 : Capital final ≥ 1€
      if (reductionCapitalFormData.nouveau_capital_apres_reduction !== undefined && 
          Number(reductionCapitalFormData.nouveau_capital_apres_reduction) < 1) {
        newErrors.nouveau_capital_apres_reduction = "RÈGLE 2 : Le capital ne peut pas descendre en dessous de 1€ (minimum légal SAS)";
      }

      if (!reductionCapitalFormData.modalite_reduction) {
        newErrors.modalite_reduction = "La modalité de réduction est requise";
      }

      // Validations spécifiques : RACHAT ET ANNULATION
      if (reductionCapitalFormData.modalite_reduction === 'rachat_annulation') {
        if (!reductionCapitalFormData.nombre_actions_rachetees || Number(reductionCapitalFormData.nombre_actions_rachetees) < 1) {
          newErrors.nombre_actions_rachetees = "Le nombre d'actions rachetées est requis et doit être supérieur à 0";
        }
        if (!reductionCapitalFormData.prix_rachat_par_action || Number(reductionCapitalFormData.prix_rachat_par_action) < 0.01) {
          newErrors.prix_rachat_par_action = "Le prix de rachat par action est requis et doit être supérieur à 0";
        }

        // RÈGLE 3 : Cohérence montant rachat
        if (reductionCapitalFormData.nombre_actions_rachetees && reductionCapitalFormData.prix_rachat_par_action) {
          const montantCalcule = Number(reductionCapitalFormData.nombre_actions_rachetees) * Number(reductionCapitalFormData.prix_rachat_par_action);
          if (Math.abs(montantCalcule - (Number(reductionCapitalFormData.montant_reduction) || 0)) > 0.01) {
            newErrors.montant_reduction = `RÈGLE 3 : Incohérence montant - ${reductionCapitalFormData.nombre_actions_rachetees} × ${Number(reductionCapitalFormData.prix_rachat_par_action).toFixed(2)}€ = ${montantCalcule.toFixed(2)}€ (≠ ${Number(reductionCapitalFormData.montant_reduction).toFixed(2)}€)`;
          }
        }

        // RÈGLE 4 : Nb actions rachetées ≤ Nb actions existantes
        if (reductionCapitalFormData.nombre_actions_rachetees && reductionCapitalFormData.nombre_actions && 
            Number(reductionCapitalFormData.nombre_actions_rachetees) > Number(reductionCapitalFormData.nombre_actions)) {
          newErrors.nombre_actions_rachetees = `RÈGLE 4 : Impossible de racheter ${reductionCapitalFormData.nombre_actions_rachetees} actions (seulement ${reductionCapitalFormData.nombre_actions} existantes)`;
        }

        // RÈGLE 5 : Au moins 1 action restante
        if (reductionCapitalFormData.nombre_actions && reductionCapitalFormData.nombre_actions_rachetees &&
            (Number(reductionCapitalFormData.nombre_actions) - Number(reductionCapitalFormData.nombre_actions_rachetees)) < 1) {
          newErrors.nombre_actions_rachetees = "RÈGLE 5 : Il doit rester au moins 1 action après le rachat";
        }
      }

      // Validations spécifiques : RÉDUCTION VALEUR NOMINALE
      if (reductionCapitalFormData.modalite_reduction === 'reduction_valeur_nominale') {
        if (reductionCapitalFormData.ancienne_valeur_nominale === undefined || reductionCapitalFormData.ancienne_valeur_nominale === null || reductionCapitalFormData.ancienne_valeur_nominale === '') {
          newErrors.ancienne_valeur_nominale = "L'ancienne valeur nominale est requise";
        } else if (Number(reductionCapitalFormData.ancienne_valeur_nominale) <= 0) {
          newErrors.ancienne_valeur_nominale = "L'ancienne valeur nominale doit être supérieure à 0";
        }
        if (reductionCapitalFormData.nouvelle_valeur_nominale === undefined || reductionCapitalFormData.nouvelle_valeur_nominale === null || reductionCapitalFormData.nouvelle_valeur_nominale === '') {
          newErrors.nouvelle_valeur_nominale = "La nouvelle valeur nominale est requise";
        } else if (Number(reductionCapitalFormData.nouvelle_valeur_nominale) <= 0) {
          newErrors.nouvelle_valeur_nominale = "La nouvelle valeur nominale doit être supérieure à 0";
        }

        // RÈGLE 6 : Nouvelle < Ancienne
        if (reductionCapitalFormData.nouvelle_valeur_nominale && reductionCapitalFormData.ancienne_valeur_nominale && 
            Number(reductionCapitalFormData.nouvelle_valeur_nominale) >= Number(reductionCapitalFormData.ancienne_valeur_nominale)) {
          newErrors.nouvelle_valeur_nominale = "RÈGLE 6 : La nouvelle valeur nominale doit être inférieure à l'ancienne";
        }

        // RÈGLE 7 : Cohérence montant
        if (reductionCapitalFormData.ancienne_valeur_nominale && reductionCapitalFormData.nouvelle_valeur_nominale && reductionCapitalFormData.nombre_actions) {
          const montantCalcule = (Number(reductionCapitalFormData.ancienne_valeur_nominale) - Number(reductionCapitalFormData.nouvelle_valeur_nominale)) * Number(reductionCapitalFormData.nombre_actions);
          if (Math.abs(montantCalcule - (Number(reductionCapitalFormData.montant_reduction) || 0)) > 0.01) {
            newErrors.montant_reduction = `RÈGLE 7 : Incohérence montant - (${Number(reductionCapitalFormData.ancienne_valeur_nominale).toFixed(2)}€ - ${Number(reductionCapitalFormData.nouvelle_valeur_nominale).toFixed(2)}€) × ${reductionCapitalFormData.nombre_actions} = ${montantCalcule.toFixed(2)}€ (≠ ${Number(reductionCapitalFormData.montant_reduction).toFixed(2)}€)`;
          }
        }
      }

      // Validations spécifiques : COUP D'ACCORDÉON
      if (reductionCapitalFormData.modalite_reduction === 'coup_accordeon') {
        if (!reductionCapitalFormData.coup_accordeon_augmentation_montant || 
            Number(reductionCapitalFormData.coup_accordeon_augmentation_montant) < 0.01) {
          newErrors.coup_accordeon_augmentation_montant = "Le montant d'augmentation après coup d'accordéon est requis et doit être supérieur à 0";
        }
      }

      // RÈGLE 8 : Majorité 2/3 des votes
      if (reductionCapitalFormData.votes_pour !== undefined && reductionCapitalFormData.votes_contre !== undefined &&
          (Number(reductionCapitalFormData.votes_pour) + Number(reductionCapitalFormData.votes_contre)) > 0) {
        const majorite = Number(reductionCapitalFormData.votes_pour) / (Number(reductionCapitalFormData.votes_pour) + Number(reductionCapitalFormData.votes_contre));
        if (majorite < 0.6667) {
          newErrors.votes_pour = `RÈGLE 8 : Majorité des 2/3 non atteinte (${(majorite * 100).toFixed(2)}% < 66.67%)`;
        }
      }

      // Champs obligatoires finaux
      if (!reductionCapitalFormData.motif_reduction || reductionCapitalFormData.motif_reduction.trim() === '') {
        newErrors.motif_reduction = "Le motif de la réduction est requis";
      }

      if (!reductionCapitalFormData.quorum || Number(reductionCapitalFormData.quorum) < 50 || Number(reductionCapitalFormData.quorum) > 100) {
        newErrors.quorum = "Le quorum est requis et doit être entre 50% et 100%";
      }

      if (reductionCapitalFormData.votes_pour === '' || Number(reductionCapitalFormData.votes_pour) < 0) {
        newErrors.votes_pour = "Le nombre de votes POUR est requis";
      }

      if (reductionCapitalFormData.votes_contre === '' || Number(reductionCapitalFormData.votes_contre) < 0) {
        newErrors.votes_contre = "Le nombre de votes CONTRE est requis";
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
      } else if (acteType === 'reduction_capital') {
        // Récupérer le capital du client sélectionné
        const clientCapital = selectedClient?.capital_social || 0;
        const clientNbActions = selectedClient?.nb_actions || 0;
        const montantReduction = reductionCapitalFormData.montant_reduction ? Number(reductionCapitalFormData.montant_reduction) : 0;
        const nouveauCapital = clientCapital - montantReduction;

        // Préparer les données pour la réduction de capital
        acteData = {
          client_id: selectedClientId,
          cabinet_id: cabinetIdData,
          type: 'reduction_capital',
          date_acte: reductionCapitalFormData.date_acte,
          statut: reductionCapitalFormData.statut,
          // COLONNES CRITIQUES : Utiliser les valeurs du client directement
          ancien_capital: clientCapital,
          montant_reduction: montantReduction,
          nouveau_capital_apres_reduction: nouveauCapital,
          nombre_actions: clientNbActions, // Nombre d'actions existantes du client
          modalite_reduction: reductionCapitalFormData.modalite_reduction || null,
          motif_reduction: reductionCapitalFormData.motif_reduction ? reductionCapitalFormData.motif_reduction.trim() : null,
          reduction_motivee_pertes: reductionCapitalFormData.reduction_motivee_pertes || false,
          quorum: reductionCapitalFormData.quorum ? Number(reductionCapitalFormData.quorum) : null,
          votes_pour: reductionCapitalFormData.votes_pour ? Number(reductionCapitalFormData.votes_pour) : null,
          votes_contre: reductionCapitalFormData.votes_contre ? Number(reductionCapitalFormData.votes_contre) : null,
        };

        // Gérer les cas spéciaux par modalité
        if (reductionCapitalFormData.modalite_reduction === 'rachat_annulation') {
          acteData.nombre_actions_rachetees = reductionCapitalFormData.nombre_actions_rachetees ? Number(reductionCapitalFormData.nombre_actions_rachetees) : null;
          acteData.prix_rachat_par_action = reductionCapitalFormData.prix_rachat_par_action ? Number(reductionCapitalFormData.prix_rachat_par_action) : null;
        }

        if (reductionCapitalFormData.modalite_reduction === 'reduction_valeur_nominale') {
          acteData.ancienne_valeur_nominale = reductionCapitalFormData.ancienne_valeur_nominale ? Number(reductionCapitalFormData.ancienne_valeur_nominale) : null;
          acteData.nouvelle_valeur_nominale = reductionCapitalFormData.nouvelle_valeur_nominale ? Number(reductionCapitalFormData.nouvelle_valeur_nominale) : null;
        }

        if (reductionCapitalFormData.modalite_reduction === 'coup_accordeon') {
          acteData.coup_accordeon_augmentation_montant = reductionCapitalFormData.coup_accordeon_augmentation_montant ? Number(reductionCapitalFormData.coup_accordeon_augmentation_montant) : null;
          acteData.coup_accordeon_nouveau_capital_final = reductionCapitalFormData.coup_accordeon_nouveau_capital_final ? Number(reductionCapitalFormData.coup_accordeon_nouveau_capital_final) : null;
        }

        // Log de vérification avant insertion
        console.log('💾 CRÉATION ACTE RÉDUCTION:', {
          ancien_capital: acteData.ancien_capital,
          montant_reduction: acteData.montant_reduction,
          nouveau_capital: acteData.nouveau_capital_apres_reduction,
          modalite: acteData.modalite_reduction,
          nombre_actions: acteData.nombre_actions
        });
      }

      const { error: insertError } = await supabaseClient
        .from("actes_juridiques")
        .insert(acteData);

      if (insertError) {
        throw insertError;
      }

      // Succès - redirection
      const acteTypeLabel = acteType === 'cession_actions' ? 'de cession' 
        : acteType === 'augmentation_capital' ? "d'augmentation de capital" 
        : acteType === 'reduction_capital' ? "de réduction de capital"
        : "d'AG Ordinaire";
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
            <RadioGroup value={acteType} onValueChange={(value) => setActeType(value as 'cession_actions' | 'augmentation_capital' | 'ag_ordinaire' | 'reduction_capital')} className="space-y-3">
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
                <RadioGroupItem value="reduction_capital" id="type-reduction" />
                <Label htmlFor="type-reduction" className="cursor-pointer flex items-center gap-2">
                  <span>Réduction de capital</span>
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

        {/* FORMULAIRE RÉDUCTION DE CAPITAL (affiché si client sélectionné et type = reduction_capital) */}
        {selectedClientId && acteType === 'reduction_capital' && (
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
                    <Label htmlFor="red_date_acte">
                      Date de l'acte <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="red_date_acte"
                      type="date"
                      value={reductionCapitalFormData.date_acte}
                      onChange={(e) => handleReductionCapitalChange("date_acte", e.target.value)}
                      required
                    />
                    {formErrors.date_acte && (
                      <p className="text-sm text-red-500">{formErrors.date_acte}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="red_statut">
                      Statut <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={reductionCapitalFormData.statut}
                      onValueChange={(value) =>
                        handleReductionCapitalChange("statut", value as 'brouillon' | 'validé' | 'signé')
                      }
                    >
                      <SelectTrigger id="red_statut">
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
                  Montants avant et après réduction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="red_ancien_capital">
                      Capital social actuel (€) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="red_ancien_capital"
                      type="number"
                      min="1"
                      step="0.01"
                      value={reductionCapitalFormData.ancien_capital}
                      onChange={(e) =>
                        handleReductionCapitalChange("ancien_capital", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.ancien_capital && (
                      <p className="text-sm text-red-500">{formErrors.ancien_capital}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Capital actuel selon nos données</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="red_nombre_actions">
                      Nombre d'actions existantes <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="red_nombre_actions"
                      type="number"
                      min="1"
                      value={reductionCapitalFormData.nombre_actions}
                      onChange={(e) =>
                        handleReductionCapitalChange("nombre_actions", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="1000"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Nombre total d'actions avant réduction</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="red_montant_reduction">
                      Montant de la réduction (€) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="red_montant_reduction"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={reductionCapitalFormData.montant_reduction}
                      onChange={(e) =>
                        handleReductionCapitalChange("montant_reduction", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                      readOnly={reductionCapitalFormData.modalite_reduction === 'rachat_annulation' || reductionCapitalFormData.modalite_reduction === 'reduction_valeur_nominale'}
                      className={reductionCapitalFormData.modalite_reduction === 'rachat_annulation' || reductionCapitalFormData.modalite_reduction === 'reduction_valeur_nominale' ? 'bg-muted' : ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Montant en euros à réduire</p>
                    {formErrors.montant_reduction && (
                      <p className="text-sm text-red-500">{formErrors.montant_reduction}</p>
                    )}
                    
                    {/* RÈGLE 1 : Montant ≤ Capital */}
                    {reductionCapitalFormData.montant_reduction && reductionCapitalFormData.ancien_capital && 
                     Number(reductionCapitalFormData.montant_reduction) > Number(reductionCapitalFormData.ancien_capital) && (
                      <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
                        <p className="text-red-700 text-sm font-medium">
                          ❌ RÈGLE 1 VIOLÉE : Le montant de réduction ({Number(reductionCapitalFormData.montant_reduction).toFixed(2)}€) dépasse le capital actuel ({Number(reductionCapitalFormData.ancien_capital).toFixed(2)}€)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="red_nouveau_capital">
                      Nouveau capital social (€)
                    </Label>
                    <Input
                      id="red_nouveau_capital"
                      type="number"
                      value={reductionCapitalFormData.nouveau_capital_apres_reduction}
                      readOnly
                      className="bg-muted"
                    />
                    
                    {/* RÈGLE 2 : Capital final ≥ 1€ */}
                    {reductionCapitalFormData.nouveau_capital_apres_reduction !== undefined && Number(reductionCapitalFormData.nouveau_capital_apres_reduction) < 1 && (
                      <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
                        <p className="text-red-700 text-sm font-medium">
                          ❌ RÈGLE 2 VIOLÉE : Le capital ne peut pas être inférieur à 1€ (minimum légal SAS)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Valeur nominale calculée automatiquement */}
                {reductionCapitalFormData.nombre_actions && reductionCapitalFormData.ancien_capital && Number(reductionCapitalFormData.nombre_actions) > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Valeur nominale actuelle par action :</span>
                      <span className="text-lg font-bold text-blue-900">
                        {Number(reductionCapitalFormData.valeur_nominale_actuelle).toFixed(2)} €
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Calculé automatiquement : {Number(reductionCapitalFormData.ancien_capital).toFixed(2)}€ ÷ {reductionCapitalFormData.nombre_actions} actions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Modalité de réduction */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Modalité de réduction</CardTitle>
                <CardDescription>
                  Choisissez le type de réduction de capital
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Modalité <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={reductionCapitalFormData.modalite_reduction}
                    onValueChange={(value) =>
                      handleReductionCapitalChange("modalite_reduction", value as 'rachat_annulation' | 'reduction_valeur_nominale' | 'coup_accordeon')
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-blue-200 bg-blue-50">
                      <RadioGroupItem value="rachat_annulation" id="modalite-rachat" />
                      <Label htmlFor="modalite-rachat" className="cursor-pointer">
                        <span className="font-medium text-blue-900">Rachat et annulation d'actions</span>
                        <span className="text-sm text-blue-700 ml-2 block">- La société rachète des actions puis les annule</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-green-200 bg-green-50">
                      <RadioGroupItem value="reduction_valeur_nominale" id="modalite-valeur" />
                      <Label htmlFor="modalite-valeur" className="cursor-pointer">
                        <span className="font-medium text-green-900">Réduction de la valeur nominale</span>
                        <span className="text-sm text-green-700 ml-2 block">- Diminution de la valeur nominale des actions</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-orange-200 bg-orange-50">
                      <RadioGroupItem value="coup_accordeon" id="modalite-accordeon" />
                      <Label htmlFor="modalite-accordeon" className="cursor-pointer">
                        <span className="font-medium text-orange-900">Coup d'accordéon</span>
                        <span className="text-sm text-orange-700 ml-2 block">- Réduction à 1€ puis augmentation immédiate</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {formErrors.modalite_reduction && (
                    <p className="text-sm text-red-500">{formErrors.modalite_reduction}</p>
                  )}
                </div>

                {/* Modalité rachat_annulation */}
                {reductionCapitalFormData.modalite_reduction === 'rachat_annulation' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900">Détails du rachat et annulation</h4>
                    {reductionCapitalFormData.valeur_nominale_actuelle && (
                      <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                        💡 Suggestion : Valeur nominale actuelle = {Number(reductionCapitalFormData.valeur_nominale_actuelle).toFixed(2)} € par action
                      </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombre_actions_rachetees">
                          Nombre d'actions rachetées <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nombre_actions_rachetees"
                          type="number"
                          min="1"
                          value={reductionCapitalFormData.nombre_actions_rachetees}
                          onChange={(e) =>
                            handleReductionCapitalChange("nombre_actions_rachetees", e.target.value === '' ? '' : Number(e.target.value))
                          }
                          required
                        />
                        {formErrors.nombre_actions_rachetees && (
                          <p className="text-sm text-red-500">{formErrors.nombre_actions_rachetees}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prix_rachat_par_action">
                          Prix de rachat par action (€) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="prix_rachat_par_action"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={reductionCapitalFormData.prix_rachat_par_action}
                          onChange={(e) =>
                            handleReductionCapitalChange("prix_rachat_par_action", e.target.value === '' ? '' : Number(e.target.value))
                          }
                          required
                        />
                        {formErrors.prix_rachat_par_action && (
                          <p className="text-sm text-red-500">{formErrors.prix_rachat_par_action}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Validations rachat et annulation */}
                    {reductionCapitalFormData.nombre_actions_rachetees && reductionCapitalFormData.prix_rachat_par_action && (
                      <>
                        {/* Calcul automatique */}
                        <div className="bg-blue-100 border border-blue-300 rounded p-2 mt-3">
                          <p className="text-sm text-blue-900">
                            <strong>Calcul automatique :</strong><br/>
                            {reductionCapitalFormData.nombre_actions_rachetees} actions × {Number(reductionCapitalFormData.prix_rachat_par_action).toFixed(2)}€ = {(Number(reductionCapitalFormData.nombre_actions_rachetees) * Number(reductionCapitalFormData.prix_rachat_par_action)).toFixed(2)}€
                          </p>
                        </div>
                        
                        {/* RÈGLE 3 : Cohérence montant rachat */}
                        {Math.abs((Number(reductionCapitalFormData.nombre_actions_rachetees) * Number(reductionCapitalFormData.prix_rachat_par_action)) - (Number(reductionCapitalFormData.montant_reduction) || 0)) > 0.01 && (
                          <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
                            <p className="text-red-700 text-sm font-medium">
                              ❌ RÈGLE 3 VIOLÉE : Le montant calculé ({(Number(reductionCapitalFormData.nombre_actions_rachetees) * Number(reductionCapitalFormData.prix_rachat_par_action)).toFixed(2)}€) 
                              ne correspond pas au montant de réduction saisi ({Number(reductionCapitalFormData.montant_reduction).toFixed(2)}€)
                            </p>
                          </div>
                        )}
                        
                        {/* RÈGLE 4 : Nb actions rachetées ≤ Nb actions existantes */}
                        {Number(reductionCapitalFormData.nombre_actions_rachetees) > (Number(reductionCapitalFormData.nombre_actions) || 0) && (
                          <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
                            <p className="text-red-700 text-sm font-medium">
                              ❌ RÈGLE 4 VIOLÉE : Impossible de racheter {reductionCapitalFormData.nombre_actions_rachetees} actions (seulement {reductionCapitalFormData.nombre_actions} existantes)
                            </p>
                          </div>
                        )}
                        
                        {/* RÈGLE 5 : Au moins 1 action restante */}
                        {reductionCapitalFormData.nombre_actions && reductionCapitalFormData.nombre_actions_rachetees && 
                         (Number(reductionCapitalFormData.nombre_actions) - Number(reductionCapitalFormData.nombre_actions_rachetees)) < 1 && (
                          <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
                            <p className="text-red-700 text-sm font-medium">
                              ❌ RÈGLE 5 VIOLÉE : Il doit rester au moins 1 action après le rachat 
                              ({reductionCapitalFormData.nombre_actions} - {reductionCapitalFormData.nombre_actions_rachetees} = {Number(reductionCapitalFormData.nombre_actions) - Number(reductionCapitalFormData.nombre_actions_rachetees)})
                            </p>
                          </div>
                        )}
                        
                        {/* RÈGLE 12 : Prix rachat élevé (avertissement) */}
                        {reductionCapitalFormData.valeur_nominale_actuelle && 
                         Number(reductionCapitalFormData.prix_rachat_par_action) > Number(reductionCapitalFormData.valeur_nominale_actuelle) * 3 && (
                          <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                            <p className="text-yellow-700 text-sm">
                              ⚠️ RÈGLE 12 : Prix de rachat élevé ({Number(reductionCapitalFormData.prix_rachat_par_action).toFixed(2)}€) par rapport à la valeur nominale 
                              ({Number(reductionCapitalFormData.valeur_nominale_actuelle).toFixed(2)}€). Assurez-vous que ce prix est justifié.
                            </p>
                          </div>
                        )}
                        
                        {/* RÈGLE 13 : Prix rachat faible (avertissement) */}
                        {reductionCapitalFormData.valeur_nominale_actuelle && 
                         Number(reductionCapitalFormData.prix_rachat_par_action) < Number(reductionCapitalFormData.valeur_nominale_actuelle) * 0.5 && (
                          <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                            <p className="text-yellow-700 text-sm">
                              ⚠️ RÈGLE 13 : Prix de rachat faible ({Number(reductionCapitalFormData.prix_rachat_par_action).toFixed(2)}€) par rapport à la valeur nominale 
                              ({Number(reductionCapitalFormData.valeur_nominale_actuelle).toFixed(2)}€). Cela pourrait léser les associés sortants.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Modalité reduction_valeur_nominale */}
                {reductionCapitalFormData.modalite_reduction === 'reduction_valeur_nominale' && (
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900">Réduction de la valeur nominale</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ancienne_valeur_nominale">
                          Ancienne valeur nominale (€) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="ancienne_valeur_nominale"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={reductionCapitalFormData.ancienne_valeur_nominale !== undefined && reductionCapitalFormData.ancienne_valeur_nominale !== '' 
                            ? reductionCapitalFormData.ancienne_valeur_nominale 
                            : (reductionCapitalFormData.valeur_nominale_actuelle !== undefined && reductionCapitalFormData.valeur_nominale_actuelle !== '' 
                              ? reductionCapitalFormData.valeur_nominale_actuelle 
                              : '')}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            handleReductionCapitalChange("ancienne_valeur_nominale", val);
                          }}
                          onFocus={(e) => {
                            // Auto-remplir si vide
                            if ((reductionCapitalFormData.ancienne_valeur_nominale === undefined || reductionCapitalFormData.ancienne_valeur_nominale === '') && 
                                reductionCapitalFormData.valeur_nominale_actuelle !== undefined && 
                                reductionCapitalFormData.valeur_nominale_actuelle !== '') {
                              handleReductionCapitalChange("ancienne_valeur_nominale", Number(reductionCapitalFormData.valeur_nominale_actuelle));
                            }
                          }}
                          placeholder={reductionCapitalFormData.valeur_nominale_actuelle ? Number(reductionCapitalFormData.valeur_nominale_actuelle).toFixed(2) : "10"}
                          required
                        />
                        {formErrors.ancienne_valeur_nominale && (
                          <p className="text-sm text-red-500">{formErrors.ancienne_valeur_nominale}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Valeur actuelle calculée : {reductionCapitalFormData.valeur_nominale_actuelle ? Number(reductionCapitalFormData.valeur_nominale_actuelle).toFixed(2) : '?'} €
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nouvelle_valeur_nominale">
                          Nouvelle valeur nominale (€) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nouvelle_valeur_nominale"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={reductionCapitalFormData.nouvelle_valeur_nominale}
                          onChange={(e) =>
                            handleReductionCapitalChange("nouvelle_valeur_nominale", e.target.value === '' ? '' : Number(e.target.value))
                          }
                          required
                        />
                        {formErrors.nouvelle_valeur_nominale && (
                          <p className="text-sm text-red-500">{formErrors.nouvelle_valeur_nominale}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Validations réduction valeur nominale */}
                    {reductionCapitalFormData.ancienne_valeur_nominale && reductionCapitalFormData.nouvelle_valeur_nominale && reductionCapitalFormData.nombre_actions && (
                      <>
                        {/* Calcul automatique */}
                        <div className="bg-green-100 border border-green-300 rounded p-2 mt-3">
                          <p className="text-sm text-green-900">
                            <strong>Calcul automatique :</strong><br/>
                            ({Number(reductionCapitalFormData.ancienne_valeur_nominale).toFixed(2)}€ - {Number(reductionCapitalFormData.nouvelle_valeur_nominale).toFixed(2)}€) × {reductionCapitalFormData.nombre_actions} actions = {((Number(reductionCapitalFormData.ancienne_valeur_nominale) - Number(reductionCapitalFormData.nouvelle_valeur_nominale)) * Number(reductionCapitalFormData.nombre_actions)).toFixed(2)}€
                          </p>
                        </div>
                        
                        {/* RÈGLE 6 : Nouvelle < Ancienne */}
                        {Number(reductionCapitalFormData.nouvelle_valeur_nominale) >= Number(reductionCapitalFormData.ancienne_valeur_nominale) && (
                          <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
                            <p className="text-red-700 text-sm font-medium">
                              ❌ RÈGLE 6 VIOLÉE : La nouvelle valeur nominale ({Number(reductionCapitalFormData.nouvelle_valeur_nominale).toFixed(2)}€) doit être INFÉRIEURE à l'ancienne ({Number(reductionCapitalFormData.ancienne_valeur_nominale).toFixed(2)}€)
                            </p>
                          </div>
                        )}
                        
                        {/* RÈGLE 7 : Cohérence montant */}
                        {Math.abs(((Number(reductionCapitalFormData.ancienne_valeur_nominale) - Number(reductionCapitalFormData.nouvelle_valeur_nominale)) * Number(reductionCapitalFormData.nombre_actions)) - (Number(reductionCapitalFormData.montant_reduction) || 0)) > 0.01 && (
                          <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
                            <p className="text-red-700 text-sm font-medium">
                              ❌ RÈGLE 7 VIOLÉE : Le montant calculé ({((Number(reductionCapitalFormData.ancienne_valeur_nominale) - Number(reductionCapitalFormData.nouvelle_valeur_nominale)) * Number(reductionCapitalFormData.nombre_actions)).toFixed(2)}€) 
                              ne correspond pas au montant de réduction saisi ({Number(reductionCapitalFormData.montant_reduction).toFixed(2)}€)
                            </p>
                          </div>
                        )}
                        
                        {/* RÈGLE 11 : Valeur nominale < 1€ (avertissement) */}
                        {Number(reductionCapitalFormData.nouvelle_valeur_nominale) < 1 && (
                          <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                            <p className="text-yellow-700 text-sm">
                              ⚠️ RÈGLE 11 : Valeur nominale finale très faible ({Number(reductionCapitalFormData.nouvelle_valeur_nominale).toFixed(2)}€). 
                              Bien que légal, c'est inhabituel. Vérifiez la pertinence.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Modalité coup_accordeon */}
                {reductionCapitalFormData.modalite_reduction === 'coup_accordeon' && (
                  <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900">Coup d'accordéon</h4>
                    <div className="bg-orange-100 border border-orange-300 rounded p-3 mb-3">
                      <p className="text-sm text-orange-900 font-medium">⚠️ RÉSERVÉ AUX CAS GRAVES</p>
                      <p className="text-xs text-orange-800 mt-1">
                        Le coup d'accordéon est utilisé quand la société a des <strong>pertes importantes</strong> 
                        (capitaux propres inférieurs à 50% du capital social). Il permet de repartir sur des bases saines 
                        en annulant les pertes et en recapitalisant.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="red_montant_reduction_accordeon">
                        Montant de la réduction (€) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="red_montant_reduction_accordeon"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={reductionCapitalFormData.montant_reduction}
                        onChange={(e) =>
                          handleReductionCapitalChange("montant_reduction", e.target.value === '' ? '' : Number(e.target.value))
                        }
                        required
                      />
                      {formErrors.montant_reduction && (
                        <p className="text-sm text-red-500">{formErrors.montant_reduction}</p>
                      )}
                      {reductionCapitalFormData.nouveau_capital_apres_reduction && (
                        <p className="text-sm text-muted-foreground">
                          Capital après réduction : {formatMontant(Number(reductionCapitalFormData.nouveau_capital_apres_reduction))}€
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coup_accordeon_augmentation_montant">
                        Montant de l'augmentation après réduction (€) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="coup_accordeon_augmentation_montant"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={reductionCapitalFormData.coup_accordeon_augmentation_montant}
                        onChange={(e) =>
                          handleReductionCapitalChange("coup_accordeon_augmentation_montant", e.target.value === '' ? '' : Number(e.target.value))
                        }
                        required
                      />
                      {formErrors.coup_accordeon_augmentation_montant && (
                        <p className="text-sm text-red-500">{formErrors.coup_accordeon_augmentation_montant}</p>
                      )}
                    </div>
                    {reductionCapitalFormData.coup_accordeon_nouveau_capital_final && (
                      <div className="p-3 bg-orange-100 rounded">
                        <p className="text-sm font-medium text-orange-900">
                          💰 Capital final après coup d'accordéon : {formatMontant(Number(reductionCapitalFormData.coup_accordeon_nouveau_capital_final))}€
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Motif de réduction */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Motif de réduction</CardTitle>
                <CardDescription>
                  Raison juridique de la réduction de capital
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="motif_reduction">
                    Motif <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="motif_reduction"
                    value={reductionCapitalFormData.motif_reduction}
                    onChange={(e) => handleReductionCapitalChange("motif_reduction", e.target.value)}
                    placeholder="Ex: Réduction pour compenser des pertes / Remboursement aux associés..."
                    required
                    rows={4}
                  />
                  {formErrors.motif_reduction && (
                    <p className="text-sm text-red-500">{formErrors.motif_reduction}</p>
                  )}
                </div>

                {/* RÈGLE 9 : Réduction motivée par pertes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="reduction_motivee_pertes"
                      checked={reductionCapitalFormData.reduction_motivee_pertes || false}
                      onChange={(e) => handleReductionCapitalChange("reduction_motivee_pertes", e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <label htmlFor="reduction_motivee_pertes" className="font-medium text-yellow-900 cursor-pointer">
                        Cette réduction est motivée par des pertes
                      </label>
                      <p className="text-xs text-yellow-700 mt-1">
                        {reductionCapitalFormData.reduction_motivee_pertes ? (
                          "✅ Dispense du droit d'opposition des créanciers (article L. 225-205)"
                        ) : (
                          "⚠️ Les créanciers pourront faire opposition pendant 20 jours après publication au BODACC"
                        )}
                      </p>
                    </div>
                  </div>
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
                    <Label htmlFor="red_quorum">
                      Quorum (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="red_quorum"
                      type="number"
                      min="50"
                      max="100"
                      value={reductionCapitalFormData.quorum}
                      onChange={(e) =>
                        handleReductionCapitalChange("quorum", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.quorum && (
                      <p className="text-sm text-red-500">{formErrors.quorum}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Pourcentage du capital présent ou représenté</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="red_votes_pour">
                      Votes POUR <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="red_votes_pour"
                      type="number"
                      min="0"
                      value={reductionCapitalFormData.votes_pour}
                      onChange={(e) =>
                        handleReductionCapitalChange("votes_pour", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.votes_pour && (
                      <p className="text-sm text-red-500">{formErrors.votes_pour}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="red_votes_contre">
                      Votes CONTRE <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="red_votes_contre"
                      type="number"
                      min="0"
                      value={reductionCapitalFormData.votes_contre}
                      onChange={(e) =>
                        handleReductionCapitalChange("votes_contre", e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required
                    />
                    {formErrors.votes_contre && (
                      <p className="text-sm text-red-500">{formErrors.votes_contre}</p>
                    )}
                  </div>
                </div>

                {/* RÈGLE 8 : Majorité 2/3 requise */}
                {reductionCapitalFormData.votes_pour !== undefined && reductionCapitalFormData.votes_contre !== undefined && 
                 (Number(reductionCapitalFormData.votes_pour) + Number(reductionCapitalFormData.votes_contre)) > 0 && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                      <p className="text-sm text-blue-900">
                        <strong>Majorité actuelle :</strong> {((Number(reductionCapitalFormData.votes_pour) / (Number(reductionCapitalFormData.votes_pour) + Number(reductionCapitalFormData.votes_contre))) * 100).toFixed(2)}%
                      </p>
                      <p className="text-xs text-blue-700 mt-1">Minimum requis : 66.67% (2/3 des votes)</p>
                    </div>
                    
                    {(Number(reductionCapitalFormData.votes_pour) / (Number(reductionCapitalFormData.votes_pour) + Number(reductionCapitalFormData.votes_contre))) < 0.6667 && (
                      <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
                        <p className="text-red-700 text-sm font-medium">
                          ❌ RÈGLE 8 VIOLÉE : La majorité des 2/3 n&apos;est pas atteinte 
                          ({((Number(reductionCapitalFormData.votes_pour) / (Number(reductionCapitalFormData.votes_pour) + Number(reductionCapitalFormData.votes_contre))) * 100).toFixed(2)}% &lt; 66.67%)
                        </p>
                      </div>
                    )}
                  </>
                )}
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


