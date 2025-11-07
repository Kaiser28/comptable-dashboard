'use client';

import { useMemo, useState, type FormEvent } from "react";
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
import { supabaseClient } from "@/lib/supabase";
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
};

type FormErrors = Partial<Record<keyof ClientFormData, string>> & { global?: string };

const isSiretValid = (value: string) => /^\d{14}$/.test(value);

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ClientFormData>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        email: formData.email.trim() || null,
        telephone: formData.telephone.trim() || null,
        adresse: formData.adresse.trim() || null,
        siret: formData.siret.trim() || null,
        statut: "en attente",
        formulaire_token: crypto.randomUUID(),
        formulaire_complete: false,
      } satisfies Partial<Client>;

      const { error: insertError } = await supabaseClient.from("clients").insert(payload);

      if (insertError) {
        setFormErrors({ global: insertError.message || "Impossible de créer le client." });
        return;
      }

      router.push("/dashboard?created=1");
    } catch (error) {
      console.error("Erreur lors de la création d’un client", error);
      setFormErrors({
        global: "Une erreur inattendue est survenue. Veuillez réessayer.",
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
            {formErrors.global ? (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formErrors.global}
              </div>
            ) : null}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="nom_entreprise">Nom de l’entreprise</Label>
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
                    value={formData.forme_juridique || undefined}
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

