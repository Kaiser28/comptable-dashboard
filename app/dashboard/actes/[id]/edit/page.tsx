'use client';

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

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
import { supabaseClient } from "@/lib/supabase";
import { nombreEnLettres } from "@/lib/utils/nombreEnLettres";
import type { Client, Associe, ActeJuridique } from "@/types/database";

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

type FormErrors = Partial<Record<keyof ActeCessionFormData, string>> & { global?: string };

type ActeWithRelations = ActeJuridique & {
  cedant: Associe | Associe[] | null;
  client: (Client & { associes?: Associe[] }) | null;
};

export default function EditActePage() {
  const router = useRouter();
  const params = useParams();
  const acteId = params.id as string;

  const [acte, setActe] = useState<ActeWithRelations | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [associes, setAssocies] = useState<Associe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ActeCessionFormData>({
    date_acte: '',
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
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch acte avec relations
  useEffect(() => {
    const fetchActe = async () => {
      try {
        const { data: acteData, error: acteError } = await supabaseClient
          .from("actes_juridiques")
          .select(`
            *,
            cedant:associes(*),
            client:clients(*, associes(*))
          `)
          .eq("id", acteId)
          .single();

        if (acteError || !acteData) {
          alert("Acte non modifiable");
          router.push("/dashboard/actes");
          return;
        }

        const acteWithRelations = acteData as unknown as ActeWithRelations;

        // Vérifier si l'acte est signé
        if (acteWithRelations.statut === 'signé') {
          alert("Les actes signés ne peuvent pas être modifiés");
          router.push("/dashboard/actes");
          return;
        }

        setActe(acteWithRelations);

        // Extraire le client et les associés
        const clientData = Array.isArray(acteWithRelations.client)
          ? acteWithRelations.client[0]
          : acteWithRelations.client;

        if (!clientData) {
          alert("Client introuvable pour cet acte");
          router.push("/dashboard/actes");
          return;
        }

        setClient(clientData);
        setAssocies(clientData.associes || []);

        // Extraire le cédant
        const cedant = Array.isArray(acteWithRelations.cedant)
          ? acteWithRelations.cedant[0]
          : acteWithRelations.cedant;

        // Pré-remplir le formulaire avec les données de l'acte
        setFormData({
          date_acte: acteWithRelations.date_acte || '',
          statut: acteWithRelations.statut || 'brouillon',
          cedant_id: cedant?.id || '',
          cessionnaire_civilite: (acteWithRelations.cessionnaire_civilite as 'M.' | 'Mme') || 'M.',
          cessionnaire_nom: acteWithRelations.cessionnaire_nom || '',
          cessionnaire_prenom: acteWithRelations.cessionnaire_prenom || '',
          cessionnaire_adresse: acteWithRelations.cessionnaire_adresse || '',
          cessionnaire_nationalite: acteWithRelations.cessionnaire_nationalite || 'Française',
          nombre_actions: acteWithRelations.nombre_actions || '',
          prix_unitaire: acteWithRelations.prix_unitaire || '',
          prix_total: acteWithRelations.prix_total || '',
          date_agrement: acteWithRelations.date_agrement || '',
          modalites_paiement: acteWithRelations.modalites_paiement || '',
        });
      } catch (err: any) {
        console.error("Erreur récupération acte:", err);
        alert("Erreur lors du chargement de l'acte");
        router.push("/dashboard/actes");
      } finally {
        setIsLoading(false);
      }
    };

    if (acteId) {
      void fetchActe();
    }
  }, [acteId, router]);

  // Calcul automatique du prix total
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparer les données pour la mise à jour
      const updateData = {
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
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabaseClient
        .from("actes_juridiques")
        .update(updateData)
        .eq("id", acteId);

      if (updateError) {
        throw updateError;
      }

      // Succès - redirection
      alert("✅ Acte modifié avec succès");
      router.push("/dashboard/actes");
    } catch (err: any) {
      console.error("Erreur modification acte:", err);
      setFormErrors({
        global: err.message || "Erreur lors de la modification de l'acte. Veuillez réessayer.",
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex min-h-[200px] items-center justify-center">
          <span className="text-sm text-muted-foreground">Chargement de l'acte...</span>
        </div>
      </div>
    );
  }

  if (!acte || !client) {
    return null; // La redirection est gérée dans le useEffect
  }

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
        <span className="text-foreground">Modifier</span>
      </div>

      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Modifier l'acte juridique</h1>
        <p className="text-muted-foreground mt-2">
          Modifiez les informations de cet acte de cession d'actions
        </p>
      </div>

      {formErrors.global && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{formErrors.global}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section Client (non modifiable) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Client</CardTitle>
            <CardDescription>
              Le client ne peut pas être modifié après la création de l'acte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client</Label>
              <Input
                id="client_name"
                value={client.nom_entreprise}
                disabled
                className="bg-muted"
              />
              {client.siret && (
                <p className="text-sm text-muted-foreground">SIRET : {client.siret}</p>
              )}
              <p className="text-sm text-muted-foreground italic">
                Le client ne peut pas être modifié
              </p>
            </div>
          </CardContent>
        </Card>

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
            {associes.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Ce client n'a pas d'associés enregistrés.
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
                      Détient {nombreActionsCedant} action{nombreActionsCedant > 1 ? 's' : ''} dans {client.nom_entreprise}
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
                  onValueChange={(value) =>
                    handleChange("cessionnaire_civilite", value as 'M.' | 'Mme')
                  }
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
          <Button type="submit" disabled={isSubmitting || associes.length === 0}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}

