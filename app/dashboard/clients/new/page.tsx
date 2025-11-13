'use client';

import { useMemo, useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import { searchEntreprise } from "@/lib/pappers";
import { checkRateLimit, getRateLimitCount } from "@/lib/rateLimiter";
import { getFormulaireEmail } from "@/lib/emailTemplates";
import type { Client } from "@/types/database";

type ClientFormData = Pick<
  Client,
  | "nom_entreprise"
  | "forme_juridique"
  | "capital_social"
  | "email"
  | "telephone"
  | "adresse"
  | "siret"
  | "code_ape"
  | "date_debut_activite"
  | "type_dossier"
  | "cabinet_cedant_nom"
  | "cabinet_cedant_adresse"
  | "date_reprise"
  | "mission_objectif"
  | "mission_honoraires"
  | "mission_periodicite"
>; 

const LEGAL_FORMS = ["SAS", "SASU", "SARL", "EURL", "SA", "SCI"] as const;

const initialFormState: ClientFormData = {
  nom_entreprise: "",
  forme_juridique: "",
  capital_social: null,
  email: "",
  telephone: "",
  adresse: "",
  siret: "",
  code_ape: "",
  date_debut_activite: "",
  type_dossier: "création",
  cabinet_cedant_nom: null,
  cabinet_cedant_adresse: null,
  date_reprise: null,
  mission_objectif: null,
  mission_honoraires: null,
  mission_periodicite: null,
};

type FormErrors = Partial<Record<keyof ClientFormData, string>> & { global?: string };

const isSiretValid = (value: string) => /^\d{14}$/.test(value);

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ClientFormData>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siretSearch, setSiretSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [typeDossier, setTypeDossier] = useState<'création' | 'reprise'>('création');

  const handleChange = <Field extends keyof ClientFormData>(field: Field, value: ClientFormData[Field]) => {
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

  const mapFormeJuridiqueCode = (code?: string): string => {
    if (!code) return "";
    // Code 5710 = SASU
    if (code === "5710") return "SASU";
    // Code 5499 = SAS
    if (code === "5499") return "SAS";
    // Autres codes = laisser vide pour l'instant
    return "";
  };

  const formatDateISO = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      // Si la date est déjà au format ISO (YYYY-MM-DD), la retourner telle quelle
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Sinon, essayer de parser et formater
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0]; // Format YYYY-MM-DD
      }
    } catch {
      // En cas d'erreur, retourner la chaîne originale
    }
    return "";
  };

  // Récupérer le userId au chargement
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        if (user) {
          setUserId(user.id);
          setRateLimitCount(getRateLimitCount(user.id));
        }
      } catch (error) {
        console.error("Erreur récupération userId:", error);
        // Erreur silencieuse, l'utilisateur pourra toujours utiliser le formulaire
      }
    };
    void fetchUserId();
  }, []);

  const handleSearchSiret = async () => {
    if (!siretSearch.trim()) {
      setSearchError("Veuillez saisir un numéro SIRET");
      return;
    }

    if (!userId) {
      setSearchError("Session utilisateur non disponible");
      return;
    }

    // Vérifier le rate limit
    if (!checkRateLimit(userId, 10)) {
      setSearchError("❌ Limite quotidienne atteinte (10/10). Réessayez demain.");
      setRateLimitCount(10);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const entrepriseData = await searchEntreprise(siretSearch.trim());
      
      // Mettre à jour le compteur après succès
      setRateLimitCount(getRateLimitCount(userId));

      // Mapper le code de forme juridique vers SAS/SASU
      // Priorité : categorie_juridique mappé > forme_juridique texte > vide
      let formeJuridiqueMapped = "";
      if (entrepriseData.categorie_juridique) {
        formeJuridiqueMapped = mapFormeJuridiqueCode(entrepriseData.categorie_juridique);
      } else if (entrepriseData.forme_juridique) {
        // Si pas de code, utiliser le texte et vérifier s'il correspond à nos valeurs
        const formeText = entrepriseData.forme_juridique.toUpperCase();
        if (LEGAL_FORMS.includes(formeText as any)) {
          formeJuridiqueMapped = entrepriseData.forme_juridique;
        }
      }

      // Utiliser adresse_ligne_1 si disponible, sinon formater depuis adresse_siege
      const adresseFormatee =
        entrepriseData.adresse_ligne_1 ||
        formatAdresse(entrepriseData.adresse_siege);

      // Pré-remplir les champs automatiquement
      // On ne remplace que les champs vides pour ne pas écraser les données déjà saisies
      // Si un champ Pappers est null/undefined, ne pas écraser le champ du formulaire
      setFormData((previous) => ({
        ...previous,
        nom_entreprise: previous.nom_entreprise || entrepriseData.nom_entreprise || "",
        forme_juridique: previous.forme_juridique || formeJuridiqueMapped || "",
        siret: previous.siret || entrepriseData.siret || "",
        capital_social:
          previous.capital_social ||
          (entrepriseData.capital_social && entrepriseData.capital_social > 0
            ? entrepriseData.capital_social
            : null),
        adresse: previous.adresse || adresseFormatee || "",
        code_ape: previous.code_ape || entrepriseData.code_naf || "",
        date_debut_activite:
          previous.date_debut_activite ||
          (entrepriseData.date_creation ? formatDateISO(entrepriseData.date_creation) : ""),
      }));

      // Effacer le champ de recherche après succès
      setSiretSearch("");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la recherche. Vérifiez votre connexion et réessayez.";
      
      // Messages d'erreur plus clairs pour l'utilisateur
      if (errorMessage.includes("introuvable")) {
        setSearchError("Entreprise introuvable. Vérifiez le numéro SIRET saisi.");
      } else if (errorMessage.includes("Limite") || errorMessage.includes("rate limit")) {
        setSearchError("Limite de recherches quotidienne atteinte. Réessayez demain.");
      } else if (errorMessage.includes("réseau") || errorMessage.includes("fetch")) {
        setSearchError("Problème de connexion. Vérifiez votre réseau et réessayez.");
      } else {
        setSearchError(errorMessage);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const formatAdresse = (adresseSiege: {
    numero_voie?: string;
    type_voie?: string;
    nom_voie?: string;
    code_postal?: string;
    ville?: string;
    pays?: string;
  }): string => {
    const parts = [
      adresseSiege.numero_voie,
      adresseSiege.type_voie,
      adresseSiege.nom_voie,
      adresseSiege.code_postal,
      adresseSiege.ville,
    ].filter(Boolean);
    return parts.join(" ") || "";
  };

  const validate = useMemo(
    () =>
      (data: ClientFormData): FormErrors => {
        const errors: FormErrors = {};

        if (!data.nom_entreprise.trim()) {
          errors.nom_entreprise = "Le nom de l’entreprise est requis.";
        }

        if (data.siret && !isSiretValid(data.siret)) {
          errors.siret = "Le SIRET doit contenir exactement 14 chiffres.";
        }

        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          errors.email = "L’adresse e-mail n’est pas valide.";
        }

        if (data.telephone && !/^\+?[0-9\s.-]{6,}$/.test(data.telephone)) {
          errors.telephone = "Le numéro de téléphone n’est pas valide.";
        }

        if (data.capital_social !== null && Number.isFinite(data.capital_social)) {
          if (Number(data.capital_social) < 0) {
            errors.capital_social = "Le capital social doit être positif ou nul.";
          }
        }

        return errors;
      },
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        setFormErrors({
          global: "Impossible de récupérer votre session. Veuillez vous reconnecter.",
        });
        return;
      }

      const payload = {
        cabinet_id: user.id,
        nom_entreprise: formData.nom_entreprise.trim(),
        forme_juridique: formData.forme_juridique || null,
        capital_social:
          formData.capital_social !== null && formData.capital_social !== undefined
            ? Number(formData.capital_social)
            : null,
        email: formData.email?.trim() || null,
        telephone: formData.telephone?.trim() || null,
        adresse: formData.adresse?.trim() || null,
        siret: formData.siret?.trim() || null,
        code_ape: formData.code_ape?.trim() || null,
        date_debut_activite: formData.date_debut_activite?.trim() || null,
        type_dossier: formData.type_dossier || "création",
        // Champs de reprise de dossier
        cabinet_cedant_nom: formData.cabinet_cedant_nom?.trim() || null,
        cabinet_cedant_adresse: formData.cabinet_cedant_adresse?.trim() || null,
        date_reprise: formData.date_reprise?.trim() || null,
        mission_objectif: formData.mission_objectif?.trim() || null,
        mission_honoraires: formData.mission_honoraires?.trim() || null,
        mission_periodicite: formData.mission_periodicite?.trim() || null,
        statut: "en attente",
        formulaire_token: crypto.randomUUID(),
        formulaire_complete: false,
      } satisfies Partial<Client>;

      const { data: insertedClient, error: insertError } = await supabaseClient
        .from("clients")
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error("Erreur création client:", insertError);
        setFormErrors({ 
          global: "Impossible de créer le client. Veuillez vérifier vos informations et réessayer." 
        });
        return;
      }

      // Envoyer l'email au client si l'email est fourni
      let emailSentSuccess = false;
      if (formData.email && insertedClient) {
        try {
          const formUrl = `${window.location.origin}/formulaire/${payload.formulaire_token}`;
          const expertName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Votre expert-comptable";
          const expertEmail = user.email || "";
          
          const emailHtml = getFormulaireEmail(
            formData.nom_entreprise,
            expertName,
            expertEmail,
            formUrl
          );

          const emailResponse = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: formData.email.trim(),
              subject: "Complétez vos informations - Création de votre société",
              html: emailHtml,
            }),
          });

          const emailResult = await emailResponse.json();
          
          if (emailResult.success) {
            emailSentSuccess = true;
          } else {
            console.error("Erreur envoi email:", emailResult.error);
            // Ne pas bloquer la création du client si l'email échoue
          }
        } catch (emailError) {
          console.error("Erreur lors de l'envoi de l'email:", emailError);
          // Ne pas bloquer la création du client si l'email échoue
        }
      }

      // Afficher le message de succès avant la redirection
      if (emailSentSuccess) {
        setEmailSent(true);
        // Rediriger après 2 secondes pour laisser le temps de voir le message
        setTimeout(() => {
          router.push("/dashboard?created=1");
        }, 2000);
      } else {
        router.push("/dashboard?created=1");
      }
    } catch (error) {
      console.error("Erreur lors de la création d'un client", error);
      setFormErrors({
        global: "Une erreur est survenue lors de la création du client. Veuillez réessayer ou contacter le support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl">Ajouter un nouveau client</CardTitle>
            <CardDescription>
              Complétez le formulaire pour enregistrer un nouveau client au sein de votre cabinet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  ✅ Client créé avec succès ! L'email de formulaire a été envoyé.
                </AlertDescription>
              </Alert>
            )}
            {formErrors.global ? (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formErrors.global}
              </div>
            ) : null}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Section recherche SIRET */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="space-y-3">
                  <Label htmlFor="siret_search" className="text-sm font-semibold text-blue-900">
                    🔍 Recherche automatique par SIRET
                  </Label>
                  <p className="text-xs text-blue-700">
                    Saisissez un numéro SIRET pour pré-remplir automatiquement les informations de l'entreprise
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="siret_search"
                      type="text"
                      inputMode="numeric"
                      value={siretSearch}
                      onChange={(e) => {
                        setSiretSearch(e.target.value);
                        setSearchError(null);
                      }}
                      placeholder={userId ? `SIRET (${rateLimitCount}/10 recherches aujourd'hui)` : "12345678901234"}
                      maxLength={14}
                      disabled={isSearching || rateLimitCount >= 10}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleSearchSiret}
                      disabled={isSearching || !siretSearch.trim() || rateLimitCount >= 10}
                      variant="default"
                    >
                      {isSearching ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Recherche...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Rechercher
                        </>
                      )}
                    </Button>
                  </div>
                  {searchError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription className="text-sm">{searchError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Section : Informations générales */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="type_dossier">Type de dossier</Label>
                    <p className="text-sm text-muted-foreground">
                      Choisissez Création pour une nouvelle entreprise, Reprise si le client vient d'un autre cabinet comptable
                    </p>
                  </div>
                  <RadioGroup
                    value={typeDossier}
                    onValueChange={(value) => {
                      const typedValue = value as 'création' | 'reprise';
                      setTypeDossier(typedValue);
                      handleChange("type_dossier", typedValue);
                    }}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent">
                      <RadioGroupItem value="création" id="type_creation" />
                      <Label htmlFor="type_creation" className="cursor-pointer font-normal">
                        Création d'entreprise
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent">
                      <RadioGroupItem value="reprise" id="type_reprise" />
                      <Label htmlFor="type_reprise" className="cursor-pointer font-normal">
                        Reprise de dossier
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Section conditionnelle : Informations reprise de dossier */}
              {typeDossier === 'reprise' && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Informations reprise de dossier</CardTitle>
                    <CardDescription>
                      Complétez les informations relatives à la reprise du dossier depuis l'ancien cabinet comptable
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="cabinet_cedant_nom">
                          Nom du cabinet cédant <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="cabinet_cedant_nom"
                          required={typeDossier === 'reprise'}
                          value={formData.cabinet_cedant_nom ?? ""}
                          onChange={(event) => handleChange("cabinet_cedant_nom", event.target.value || null)}
                          placeholder="Ex : Cabinet Expert-Comptable Dupont"
                        />
                        {formErrors.cabinet_cedant_nom ? (
                          <p className="text-sm text-red-600">{formErrors.cabinet_cedant_nom}</p>
                        ) : null}
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="cabinet_cedant_adresse">
                          Adresse complète du cabinet cédant <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="cabinet_cedant_adresse"
                          required={typeDossier === 'reprise'}
                          rows={3}
                          value={formData.cabinet_cedant_adresse ?? ""}
                          onChange={(event) => handleChange("cabinet_cedant_adresse", event.target.value || null)}
                          placeholder="123 Rue de la République, 75001 Paris"
                        />
                        {formErrors.cabinet_cedant_adresse ? (
                          <p className="text-sm text-red-600">{formErrors.cabinet_cedant_adresse}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date_reprise">
                          Date de reprise du dossier <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="date_reprise"
                          type="date"
                          required={typeDossier === 'reprise'}
                          value={formData.date_reprise ?? ""}
                          onChange={(event) => handleChange("date_reprise", event.target.value || null)}
                        />
                        {formErrors.date_reprise ? (
                          <p className="text-sm text-red-600">{formErrors.date_reprise}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mission_periodicite">
                          Périodicité des interventions <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="mission_periodicite"
                          required={typeDossier === 'reprise'}
                          value={formData.mission_periodicite ?? ""}
                          onChange={(event) => handleChange("mission_periodicite", event.target.value || null)}
                          placeholder="Ex: Trimestrielle"
                        />
                        {formErrors.mission_periodicite ? (
                          <p className="text-sm text-red-600">{formErrors.mission_periodicite}</p>
                        ) : null}
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="mission_objectif">
                          Objectif de la mission comptable <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="mission_objectif"
                          required={typeDossier === 'reprise'}
                          rows={3}
                          value={formData.mission_objectif ?? ""}
                          onChange={(event) => handleChange("mission_objectif", event.target.value || null)}
                          placeholder="Ex: Tenue comptable, établissement des comptes annuels..."
                        />
                        {formErrors.mission_objectif ? (
                          <p className="text-sm text-red-600">{formErrors.mission_objectif}</p>
                        ) : null}
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="mission_honoraires">
                          Honoraires <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="mission_honoraires"
                          required={typeDossier === 'reprise'}
                          value={formData.mission_honoraires ?? ""}
                          onChange={(event) => handleChange("mission_honoraires", event.target.value || null)}
                          placeholder="Ex: 1500€ HT/an"
                        />
                        {formErrors.mission_honoraires ? (
                          <p className="text-sm text-red-600">{formErrors.mission_honoraires}</p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="nom_entreprise">Nom de l'entreprise</Label>
                  <Input
                    id="nom_entreprise"
                    required
                    value={formData.nom_entreprise}
                    onChange={(event) => handleChange("nom_entreprise", event.target.value)}
                    placeholder="Ex : Société Nouvel Horizon"
                  />
                  {formErrors.nom_entreprise ? (
                    <p className="text-sm text-red-600">{formErrors.nom_entreprise}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forme_juridique">Forme juridique</Label>
                  <Select
                    value={formData.forme_juridique || ""}
                    onValueChange={(value) => handleChange("forme_juridique", value)}
                  >
                    <SelectTrigger id="forme_juridique">
                      <SelectValue placeholder="Sélectionner une option" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_FORMS.map((form) => (
                        <SelectItem key={form} value={form}>
                          {form}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capital_social">Capital social</Label>
                  <Input
                    id="capital_social"
                    type="number"
                    min={0}
                    value={formData.capital_social ?? ""}
                    onChange={(event) =>
                      handleChange(
                        "capital_social",
                        event.target.value ? Number(event.target.value) : null
                      )
                    }
                    placeholder="Ex : 10000"
                  />
                  {formErrors.capital_social ? (
                    <p className="text-sm text-red-600">{formErrors.capital_social}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email ?? ""}
                    onChange={(event) => handleChange("email", event.target.value)}
                    placeholder="contact@entreprise.fr"
                  />
                  {formErrors.email ? (
                    <p className="text-sm text-red-600">{formErrors.email}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone ?? ""}
                    onChange={(event) => handleChange("telephone", event.target.value)}
                    placeholder="Ex : 06 12 34 56 78"
                  />
                  {formErrors.telephone ? (
                    <p className="text-sm text-red-600">{formErrors.telephone}</p>
                  ) : null}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Textarea
                    id="adresse"
                    rows={3}
                    value={formData.adresse ?? ""}
                    onChange={(event) => handleChange("adresse", event.target.value)}
                    placeholder="Adresse complète du client"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    type="text"
                    inputMode="numeric"
                    value={formData.siret ?? ""}
                    onChange={(event) => handleChange("siret", event.target.value)}
                    placeholder="12345678901234"
                    maxLength={14}
                  />
                  {formErrors.siret ? (
                    <p className="text-sm text-red-600">{formErrors.siret}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code_ape">Code APE</Label>
                  <Input
                    id="code_ape"
                    type="text"
                    value={formData.code_ape ?? ""}
                    onChange={(event) => handleChange("code_ape", event.target.value)}
                    placeholder="Ex : 62.01Z"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_debut_activite">Date de début d'activité</Label>
                  <Input
                    id="date_debut_activite"
                    type="date"
                    value={formData.date_debut_activite ?? ""}
                    onChange={(event) => handleChange("date_debut_activite", event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement en cours…" : "Enregistrer le client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

