'use client';

import { useEffect, useMemo, useState, type FormEvent } from "react";
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

const TOTAL_STEPS = 6;

type FormStep = 1 | 2 | 3 | 4 | 5 | 6;

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
  president: boolean;
  directeur_general: boolean;
  pourcentage_capital: number;
  nombre_actions: number;
  type_apport: string;
  montant_apport: number;
};

type FormState = {
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
};

const FORME_JURIDIQUE_OPTIONS = ["SAS", "SASU", "SARL", "EURL", "SA", "SCI"] as const;
const CLOTURE_OPTIONS = ["31 Décembre", "30 Juin", "31 Mars", "30 Septembre"] as const;
const CIVILITE_OPTIONS = ["M.", "Mme", "Autre"] as const;
const TYPE_APPORT = "Numéraire";

const INITIAL_FORM_STATE: FormState = {
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
  const [isAssocieFormOpen, setIsAssocieFormOpen] = useState(false);
  const [editingAssocieIndex, setEditingAssocieIndex] = useState<number | null>(null);
  const [associeForm, setAssocieForm] = useState<AssocieFormData>(createEmptyAssocie());
  const [associeFormErrors, setAssocieFormErrors] = useState<
    Partial<Record<keyof AssocieFormData, string>>
  >({});

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
        errors.objet_social = "Décrivez l’objet social de l’entreprise.";
      }

      setFormErrors(errors);
      setAssociesError(null);
      setDirigeantsError(null);
      setCapitalError(null);
      return Object.keys(errors).length === 0;
    }

    if (step === 2) {
      setFormErrors({});
      setAssociesError(null);
      setDirigeantsError(null);
      setCapitalError(null);

      if (formData.associes.length === 0) {
        setAssociesError("Ajoutez au moins un associé pour continuer.");
        return false;
      }

      if (formData.forme_juridique?.toUpperCase() === "SASU") {
        if (formData.associes.length !== 1) {
          setAssociesError("Une SASU ne peut comporter qu’un seul associé.");
          return false;
        }

        if (!formData.associes.some((associe) => associe.id === formData.president_id)) {
          setAssociesError("L’associé unique doit être désigné président.");
          return false;
        }
      }

      return true;
    }

    if (step === 3) {
      setFormErrors({});
      setAssociesError(null);
      setCapitalError(null);

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

      if (capital <= 0 || Number.isNaN(capital)) {
        setCapitalError("Veuillez saisir un capital social d’au moins 1 €.");
        return false;
      }

      if (!isRepartitionValide) {
        setCapitalError("La répartition doit faire 100 % au total.");
        return false;
      }

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: soumettre le formulaire complet
  };

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
              Le lien que vous avez utilisé n’est plus valide. Merci de contacter votre expert-comptable
              pour obtenir un nouveau lien d’accès.
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
  const isSasu = formData.forme_juridique?.toUpperCase() === "SASU";

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
      errors.president = "L’associé unique doit être président.";
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
                        <Label htmlFor="nom_entreprise">Nom de l’entreprise</Label>
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
                          <Label htmlFor="date_cloture">Date de clôture de l’exercice</Label>
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
                          placeholder="Décrivez l’activité principale de la société"
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
                              "Une SASU ne peut comporter qu’un seul associé. Modifiez l’associé existant."
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
                          {editingAssocieIndex !== null ? "Modifier l’associé" : "Nouvel associé"}
                        </CardTitle>
                        <CardDescription>Complétez les informations de l’associé.</CardDescription>
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
                              value={associeForm.nationalite}
                              onChange={(event) =>
                                setAssocieForm((previous) => ({
                                  ...previous,
                                  nationalite: event.target.value,
                                }))
                              }
                            />
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

                        {associeFormErrors.nom || associeFormErrors.prenom || associeFormErrors.president ? (
                          <Alert variant="destructive">
                            <AlertDescription>
                              {[associeFormErrors.nom, associeFormErrors.prenom, associeFormErrors.president]
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
                        Pour les SASU, l’associé unique dirige automatiquement. Pour les SAS, vous pouvez nommer un directeur général distinct.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.associes.length === 0 ? (
                        <Alert variant="destructive">
                          <AlertDescription>
                            Ajoutez au moins un associé à l’étape précédente avant de définir les dirigeants.
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
                        Le capital représente l’argent que vous investissez. Minimum conseillé : 1000 €.
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

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Précédent
                </Button>
                {currentStep < TOTAL_STEPS ? (
                  <Button type="button" onClick={handleNext}>
                    Suivant
                  </Button>
                ) : (
                  <Button type="submit">Envoyer mes informations</Button>
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
  5: "Pièces jointes",
  6: "Validation finale",
};

