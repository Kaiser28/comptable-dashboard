'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Search } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import type { Client, Associe, PieceJointe } from "@/types/database";
import { validateStatutsData } from "@/lib/validateStatuts";
import { searchEntreprise } from "@/lib/pappers";
import { checkRateLimit, getRateLimitCount } from "@/lib/rateLimiter";

const FORME_JURIDIQUE_OPTIONS = ["SAS", "SASU", "SARL", "EURL", "SA", "SCI"] as const;

type ClientFormData = {
  nom_entreprise: string;
  forme_juridique: string;
  capital_social: number | null;
  nb_actions: number;
  montant_libere: number;
  duree_societe: number;
  date_debut_activite: string;
  date_cloture: string;
  objet_social: string;
  email: string;
  telephone: string;
  siret: string;
  adresse_siege: {
    numero_voie?: string;
    type_voie?: string;
    nom_voie?: string;
    code_postal?: string;
    ville?: string;
    pays?: string;
  };
  banque_depot_capital: string;
};

type AssocieFormData = {
  id?: string;
  civilite: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  adresse: string;
  email: string;
  telephone: string;
  nombre_actions: number;
  montant_apport: number;
  president: boolean;
  directeur_general: boolean;
  _deleted?: boolean; // Flag pour marquer les associés à supprimer
};

type FormState = {
  client: ClientFormData | null;
  associes: AssocieFormData[];
  pieces_jointes: PieceJointe[];
};

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    client: null,
    associes: [],
    pieces_jointes: [],
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [siretSearch, setSiretSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rateLimitCount, setRateLimitCount] = useState(0);

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

  useEffect(() => {
    const fetchData = async () => {
      const clientId = params?.id;
      if (!clientId || typeof clientId !== "string") {
        setError("Identifiant du client invalide.");
        setIsLoading(false);
        return;
      }

      try {
        // Récupérer le client
        const { data: client, error: clientError } = await supabaseClient
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single<Client>();

        if (clientError) throw clientError;

        // Récupérer les associés
        const { data: associes, error: associesError } = await supabaseClient
          .from("associes")
          .select("*")
          .eq("client_id", clientId)
          .returns<Associe[]>();

        if (associesError) throw associesError;

        // Récupérer les pièces jointes
        const { data: piecesJointes, error: piecesError } = await supabaseClient
          .from("pieces_jointes")
          .select("*")
          .eq("client_id", clientId)
          .returns<PieceJointe[]>();

        if (piecesError) throw piecesError;

        // Parser adresse_siege si c'est une string JSON
        let adresseSiege = {
          numero_voie: "",
          type_voie: "",
          nom_voie: "",
          code_postal: "",
          ville: "",
          pays: "France",
        };

        if ((client as any).adresse_siege) {
          if (typeof (client as any).adresse_siege === "string") {
            try {
              adresseSiege = { ...adresseSiege, ...JSON.parse((client as any).adresse_siege) };
            } catch {
              // Si ce n'est pas du JSON, traiter comme une string simple
            }
          } else {
            adresseSiege = { ...adresseSiege, ...(client as any).adresse_siege };
          }
        }

        setFormState({
          client: {
            nom_entreprise: client.nom_entreprise || "",
            forme_juridique: client.forme_juridique || "",
            capital_social: client.capital_social,
            nb_actions: (client as any).nb_actions || 0,
            montant_libere: (client as any).montant_libere || 0,
            duree_societe: (client as any).duree_societe || 0,
            date_debut_activite: (client as any).date_debut_activite || "",
            date_cloture: (client as any).date_cloture || "",
            objet_social: (client as any).objet_social || "",
            email: client.email || "",
            telephone: client.telephone || "",
            siret: client.siret || "",
            adresse_siege: adresseSiege,
            banque_depot_capital: (client as any).banque_depot_capital || "",
          },
          associes: (associes || []).map((a) => ({
            id: a.id,
            civilite: a.civilite || "",
            nom: a.nom || "",
            prenom: a.prenom || "",
            date_naissance: a.date_naissance || "",
            lieu_naissance: a.lieu_naissance || "",
            nationalite: a.nationalite || "Française",
            adresse: a.adresse || "",
            email: a.email || "",
            telephone: a.telephone || "",
            nombre_actions: a.nombre_actions || 0,
            montant_apport: a.montant_apport || 0,
            president: a.president || false,
            directeur_general: a.directeur_general || false,
          })),
          pieces_jointes: piecesJointes || [],
        });
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError("Impossible de charger les données du client. Veuillez réessayer ou contacter le support.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [params]);

  const handleClientChange = <K extends keyof ClientFormData>(
    field: K,
    value: ClientFormData[K]
  ) => {
    if (!formState.client) return;
    setFormState({
      ...formState,
      client: {
        ...formState.client,
        [field]: value,
      },
    });
    // Effacer l'erreur du champ modifié
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  const handleAdresseSiegeChange = (field: string, value: string) => {
    if (!formState.client) return;
    setFormState({
      ...formState,
      client: {
        ...formState.client,
        adresse_siege: {
          ...formState.client.adresse_siege,
          [field]: value,
        },
      },
    });
  };

  const handleAssocieChange = (
    index: number,
    field: keyof AssocieFormData,
    value: any
  ) => {
    const updatedAssocies = [...formState.associes];
    updatedAssocies[index] = { ...updatedAssocies[index], [field]: value };
    setFormState({
      ...formState,
      associes: updatedAssocies,
    });
  };

  const handleAddAssocie = () => {
    const newAssocie: AssocieFormData = {
      id: undefined,
      civilite: "M.",
      nom: "",
      prenom: "",
      date_naissance: "",
      lieu_naissance: "",
      nationalite: "Française",
      adresse: "",
      email: "",
      telephone: "",
      nombre_actions: 0,
      montant_apport: 0,
      president: false,
      directeur_general: false,
      _deleted: false,
    };

    setFormState({
      ...formState,
      associes: [...formState.associes, newAssocie],
    });
  };

  const handleRemoveAssocie = (index: number) => {
    const associesActifs = formState.associes.filter(a => !a._deleted);
    
    if (associesActifs.length <= 1) {
      setError("Impossible de supprimer le dernier associé. Au moins 1 associé est requis.");
      return;
    }

    const associe = formState.associes[index];
    
    // Si l'associé a un id (existe en DB), le marquer pour suppression
    if (associe.id) {
      setFormState({
        ...formState,
        associes: formState.associes.map((a, i) =>
          i === index ? { ...a, _deleted: true } : a
        ),
      });
    } else {
      // Si pas d'id, retirer directement du state
      const updatedAssocies = formState.associes.filter((_, i) => i !== index);
      setFormState({
        ...formState,
        associes: updatedAssocies,
      });
    }
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

  const formatAdresse = (adresseSiege: {
    numero_voie?: string;
    type_voie?: string;
    libelle_voie?: string;
    nom_voie?: string;
    code_postal?: string;
    ville?: string;
    pays?: string;
  }): string => {
    const nomVoie = adresseSiege.libelle_voie || adresseSiege.nom_voie;
    const parts = [
      adresseSiege.numero_voie,
      adresseSiege.type_voie,
      nomVoie,
      adresseSiege.code_postal,
      adresseSiege.ville,
    ].filter(Boolean);
    return parts.join(" ") || "";
  };

  const handleSearchSiret = async () => {
    if (!siretSearch.trim()) {
      setSearchError("Veuillez saisir un numéro SIRET");
      return;
    }

    if (!formState.client) {
      setSearchError("Données client non chargées");
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
    setSearchSuccess(null);

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
        if (FORME_JURIDIQUE_OPTIONS.includes(formeText as any)) {
          formeJuridiqueMapped = entrepriseData.forme_juridique;
        }
      }

      // Compter les champs mis à jour
      let champsMisAJour = 0;

      // Écraser les champs avec les données Pappers (forcer la mise à jour)
      const updatedClient = {
        ...formState.client,
        // Écraser même si les champs sont déjà remplis
        nom_entreprise: entrepriseData.nom_entreprise || formState.client.nom_entreprise || "",
        forme_juridique: formeJuridiqueMapped || formState.client.forme_juridique || "",
        siret: entrepriseData.siret || formState.client.siret || "",
        capital_social:
          entrepriseData.capital_social && entrepriseData.capital_social > 0
            ? entrepriseData.capital_social
            : formState.client.capital_social,
        date_debut_activite: entrepriseData.date_creation
          ? formatDateISO(entrepriseData.date_creation)
          : formState.client.date_debut_activite || "",
        adresse_siege: {
          ...formState.client.adresse_siege,
          // Écraser avec les données Pappers (même si déjà remplis)
          numero_voie: entrepriseData.adresse_siege.numero_voie || formState.client.adresse_siege.numero_voie || "",
          type_voie: entrepriseData.adresse_siege.type_voie || formState.client.adresse_siege.type_voie || "",
          nom_voie: entrepriseData.adresse_siege.libelle_voie || formState.client.adresse_siege.nom_voie || "",
          code_postal: entrepriseData.adresse_siege.code_postal || formState.client.adresse_siege.code_postal || "",
          ville: entrepriseData.adresse_siege.ville || formState.client.adresse_siege.ville || "",
        },
      };

      // Compter les champs mis à jour depuis Pappers
      if (entrepriseData.nom_entreprise) champsMisAJour++;
      if (formeJuridiqueMapped) champsMisAJour++;
      if (entrepriseData.siret) champsMisAJour++;
      if (entrepriseData.capital_social && entrepriseData.capital_social > 0) champsMisAJour++;
      if (entrepriseData.date_creation) champsMisAJour++;
      // Compter l'adresse comme un seul champ si au moins un sous-champ est présent
      if (entrepriseData.adresse_siege.numero_voie || entrepriseData.adresse_siege.type_voie || entrepriseData.adresse_siege.libelle_voie || entrepriseData.adresse_siege.code_postal || entrepriseData.adresse_siege.ville) {
        champsMisAJour++;
      }

      setFormState({
        ...formState,
        client: updatedClient,
      });

      // Afficher le message de succès
      setSearchSuccess(`✅ ${champsMisAJour} champ${champsMisAJour > 1 ? 's' : ''} mis à jour depuis Pappers`);
      
      // Effacer le message après 5 secondes
      setTimeout(() => {
        setSearchSuccess(null);
      }, 5000);

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formState.client) {
      setError("Données client manquantes.");
      return false;
    }

    const client = formState.client;

    // Validation nom entreprise
    if (!client.nom_entreprise.trim()) {
      errors.nom_entreprise = "Le nom de l'entreprise est requis.";
    }

    // Validation capital et actions
    if (client.capital_social !== null && client.capital_social < 0) {
      errors.capital_social = "Le capital social doit être positif.";
    }

    if (client.nb_actions <= 0) {
      errors.nb_actions = "Le nombre d'actions doit être supérieur à 0.";
    }

    if (client.montant_libere < 0) {
      errors.montant_libere = "Le montant libéré doit être positif.";
    }

    // Validation durée
    if (client.duree_societe < 1 || client.duree_societe > 99) {
      errors.duree_societe = "La durée doit être entre 1 et 99 ans.";
    }

    // Validation juridique avec validateStatutsData
    if (client.capital_social && client.nb_actions && client.montant_libere && client.duree_societe && client.objet_social) {
      const validationResult = validateStatutsData({
        capital_social: client.capital_social,
        nb_actions: client.nb_actions,
        montant_libere: client.montant_libere,
        duree_societe: client.duree_societe,
        objet_social: client.objet_social,
      });

      if (!validationResult.isValid) {
        validationResult.errors.forEach((err) => {
          errors[err.field] = err.message;
        });
      }
    }

    // Validation SIRET
    if (client.siret && !/^\d{14}$/.test(client.siret)) {
      errors.siret = "Le SIRET doit contenir exactement 14 chiffres.";
    }

    // Validation email
    if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
      errors.email = "L'adresse e-mail n'est pas valide.";
    }

    // Validation email (déjà fait plus haut, mais gardé pour cohérence)

    // Validation associés (exclure ceux marqués pour suppression)
    const associesActifs = formState.associes.filter(a => !a._deleted);
    if (associesActifs.length === 0) {
      errors.associes = "Au moins un associé est requis.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm() || !formState.client) {
      return;
    }

    setIsSaving(true);

    try {
      const clientId = params?.id as string;

      // Préparer les données client pour l'UPDATE
      const clientDataToUpdate = {
        nom_entreprise: formState.client.nom_entreprise.trim(),
        forme_juridique: formState.client.forme_juridique || null,
        capital_social: formState.client.capital_social,
        email: formState.client.email?.trim() || null,
        telephone: formState.client.telephone?.trim() || null,
        siret: formState.client.siret?.trim() || null,
        nb_actions: formState.client.nb_actions,
        montant_libere: formState.client.montant_libere,
        duree_societe: formState.client.duree_societe,
        date_debut_activite: formState.client.date_debut_activite || null,
        date_cloture: formState.client.date_cloture || null,
        objet_social: formState.client.objet_social || null,
        adresse_siege: formState.client.adresse_siege,
        banque_depot_capital: formState.client.banque_depot_capital || null,
      };

      // Mise à jour du client
      const { error: clientError } = await supabaseClient
        .from("clients")
        .update(clientDataToUpdate)
        .eq("id", clientId);

      if (clientError) {
        console.error("Erreur Supabase (client):", {
          message: clientError.message,
          details: clientError.details,
          hint: clientError.hint,
          code: clientError.code,
        });
        throw clientError;
      }

      // Gestion des associés : INSERT, UPDATE, DELETE
      const associesToInsert: AssocieFormData[] = [];
      const associesToUpdate: AssocieFormData[] = [];
      const associesToDelete: string[] = [];

      // Séparer les associés selon leur état (exclure ceux marqués _deleted de l'affichage)
      const associesActifs = formState.associes.filter(a => !a._deleted);
      
      for (const associe of associesActifs) {
        if (!associe.id) {
          // Nouvel associé sans id
          associesToInsert.push(associe);
        } else {
          // Associé existant à mettre à jour
          associesToUpdate.push(associe);
        }
      }

      // Récupérer les associés marqués pour suppression
      const associesMarquesSuppression = formState.associes.filter(a => a._deleted && a.id);
      for (const associe of associesMarquesSuppression) {
        if (associe.id) {
          associesToDelete.push(associe.id);
        }
      }

      // DELETE : Supprimer les associés marqués
      for (const associeId of associesToDelete) {
        const { error: deleteError } = await supabaseClient
          .from("associes")
          .delete()
          .eq("id", associeId);

        if (deleteError) {
          console.error(`Erreur Supabase lors de la suppression (associé ${associeId}):`, deleteError);
          throw new Error("Impossible de supprimer l'associé. Veuillez réessayer.");
        }
      }

      // INSERT : Créer les nouveaux associés
      for (const associe of associesToInsert) {
        const associeDataToInsert = {
          client_id: clientId,
          civilite: associe.civilite,
          nom: associe.nom.trim(),
          prenom: associe.prenom.trim(),
          date_naissance: associe.date_naissance || null,
          lieu_naissance: associe.lieu_naissance || null,
          nationalite: associe.nationalite || "Française",
          adresse: associe.adresse.trim(),
          email: associe.email?.trim() || null,
          telephone: associe.telephone?.trim() || null,
          nombre_actions: associe.nombre_actions,
          montant_apport: associe.montant_apport,
          president: associe.president,
          directeur_general: associe.directeur_general,
        };

        const { error: insertError } = await supabaseClient
          .from("associes")
          .insert(associeDataToInsert);

        if (insertError) {
          console.error("Erreur Supabase lors de l'insertion (associé):", insertError);
          throw new Error("Impossible d'ajouter l'associé. Veuillez réessayer.");
        }
      }

      // UPDATE : Mettre à jour les associés existants
      for (const associe of associesToUpdate) {
        const associeDataToUpdate = {
          civilite: associe.civilite,
          nom: associe.nom.trim(),
          prenom: associe.prenom.trim(),
          date_naissance: associe.date_naissance || null,
          lieu_naissance: associe.lieu_naissance || null,
          nationalite: associe.nationalite || "Française",
          adresse: associe.adresse.trim(),
          email: associe.email?.trim() || null,
          telephone: associe.telephone?.trim() || null,
          nombre_actions: associe.nombre_actions,
          montant_apport: associe.montant_apport,
          president: associe.president,
          directeur_general: associe.directeur_general,
        };

        const { error: updateError } = await supabaseClient
          .from("associes")
          .update(associeDataToUpdate)
          .eq("id", associe.id);

        if (updateError) {
          console.error(`Erreur Supabase lors de la mise à jour (associé ${associe.id}):`, updateError);
          throw new Error("Impossible de mettre à jour l'associé. Veuillez réessayer.");
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/clients/${clientId}`);
      }, 1500);
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde:", err);
      const errorMessage = err?.message || "Une erreur est survenue lors de la sauvegarde.";
      setError(errorMessage.includes("Supabase") || errorMessage.includes("impossible") 
        ? errorMessage 
        : "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer ou contacter le support.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Chargement des données...</span>
      </div>
    );
  }

  if (error && !formState.client) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formState.client) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <nav className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/dashboard" className="hover:text-primary">
                  Clients
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/dashboard/clients/${params.id}`} className="hover:text-primary">
                  {formState.client.nom_entreprise}
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-foreground">Modifier</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Modifier le client
          </h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle>Succès</AlertTitle>
          <AlertDescription>Les modifications ont été enregistrées avec succès.</AlertDescription>
        </Alert>
      )}

      {/* Recherche automatique par SIRET */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche automatique par SIRET</CardTitle>
          <CardDescription>
            Recherchez les informations de l'entreprise via l'API Pappers pour pré-remplir automatiquement les champs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={userId ? `SIRET (${rateLimitCount}/10 recherches aujourd'hui)` : "Saisir le numéro SIRET (14 chiffres)"}
              value={siretSearch}
              onChange={(e) => {
                setSiretSearch(e.target.value);
                setSearchError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearchSiret();
                }
              }}
              disabled={isSearching || rateLimitCount >= 10}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => void handleSearchSiret()}
              disabled={isSearching || !siretSearch.trim() || rateLimitCount >= 10}
              variant="outline"
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
            <Alert variant="destructive">
              <AlertTitle>Erreur de recherche</AlertTitle>
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}
          {searchSuccess && (
            <Alert>
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>{searchSuccess}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 : Infos entreprise */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
            <CardDescription>Dénomination et forme juridique</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_entreprise">Nom de l'entreprise *</Label>
              <Input
                id="nom_entreprise"
                value={formState.client.nom_entreprise}
                onChange={(e) => handleClientChange("nom_entreprise", e.target.value)}
                required
              />
              {validationErrors.nom_entreprise && (
                <p className="text-sm text-red-600">{validationErrors.nom_entreprise}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="forme_juridique">Forme juridique</Label>
                <Select
                  value={formState.client.forme_juridique || ""}
                  onValueChange={(value) => handleClientChange("forme_juridique", value)}
                >
                  <SelectTrigger id="forme_juridique">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORME_JURIDIQUE_OPTIONS.map((form) => (
                      <SelectItem key={form} value={form}>
                        {form}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={formState.client.siret}
                  onChange={(e) => handleClientChange("siret", e.target.value)}
                  maxLength={14}
                />
                {validationErrors.siret && (
                  <p className="text-sm text-red-600">{validationErrors.siret}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objet_social">Objet social</Label>
              <Textarea
                id="objet_social"
                value={formState.client.objet_social}
                onChange={(e) => handleClientChange("objet_social", e.target.value)}
                rows={4}
              />
              {validationErrors.objet_social && (
                <p className="text-sm text-red-600">{validationErrors.objet_social}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2 : Informations de contact */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de contact</CardTitle>
            <CardDescription>Coordonnées de l'entreprise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email de contact</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@entreprise.fr"
                value={formState.client.email}
                onChange={(e) => handleClientChange("email", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Email pour recevoir le lien du formulaire
              </p>
              {validationErrors.email && (
                <p className="text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                value={formState.client.telephone}
                onChange={(e) => handleClientChange("telephone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3 : Capital et dates */}
        <Card>
          <CardHeader>
            <CardTitle>Capital social et dates</CardTitle>
            <CardDescription>Montants et durée de la société</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="capital_social">Capital social (€)</Label>
                <Input
                  id="capital_social"
                  type="number"
                  min={0}
                  value={formState.client.capital_social ?? ""}
                  onChange={(e) =>
                    handleClientChange(
                      "capital_social",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
                {validationErrors.capital_social && (
                  <p className="text-sm text-red-600">{validationErrors.capital_social}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nb_actions">Nombre d'actions</Label>
                <Input
                  id="nb_actions"
                  type="number"
                  min={1}
                  value={formState.client.nb_actions}
                  onChange={(e) => handleClientChange("nb_actions", Number(e.target.value))}
                />
                {validationErrors.nb_actions && (
                  <p className="text-sm text-red-600">{validationErrors.nb_actions}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="montant_libere">Montant libéré (€)</Label>
                <Input
                  id="montant_libere"
                  type="number"
                  min={0}
                  value={formState.client.montant_libere}
                  onChange={(e) => handleClientChange("montant_libere", Number(e.target.value))}
                />
                {validationErrors.montant_libere && (
                  <p className="text-sm text-red-600">{validationErrors.montant_libere}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duree_societe">Durée (années)</Label>
                <Input
                  id="duree_societe"
                  type="number"
                  min={1}
                  max={99}
                  value={formState.client.duree_societe}
                  onChange={(e) => handleClientChange("duree_societe", Number(e.target.value))}
                />
                {validationErrors.duree_societe && (
                  <p className="text-sm text-red-600">{validationErrors.duree_societe}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_debut_activite">Date de début d'activité</Label>
                <Input
                  id="date_debut_activite"
                  type="date"
                  value={formState.client.date_debut_activite ? formState.client.date_debut_activite.split('T')[0] : ""}
                  onChange={(e) => handleClientChange("date_debut_activite", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_cloture">Date clôture exercice</Label>
                <Input
                  id="date_cloture"
                  type="text"
                  placeholder="31/12"
                  value={formState.client.date_cloture}
                  onChange={(e) => handleClientChange("date_cloture", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banque_depot_capital">Banque de dépôt du capital</Label>
              <Input
                id="banque_depot_capital"
                value={formState.client.banque_depot_capital}
                onChange={(e) => handleClientChange("banque_depot_capital", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4 : Siège social */}
        <Card>
          <CardHeader>
            <CardTitle>Siège social</CardTitle>
            <CardDescription>Adresse complète du siège</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="numero_voie">Numéro de voie</Label>
                <Input
                  id="numero_voie"
                  value={formState.client.adresse_siege.numero_voie || ""}
                  onChange={(e) => handleAdresseSiegeChange("numero_voie", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_voie">Type de voie</Label>
                <Input
                  id="type_voie"
                  value={formState.client.adresse_siege.type_voie || ""}
                  onChange={(e) => handleAdresseSiegeChange("type_voie", e.target.value)}
                  placeholder="Rue, Avenue, etc."
                />
              </div>

              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="nom_voie">Nom de la voie</Label>
                <Input
                  id="nom_voie"
                  value={formState.client.adresse_siege.nom_voie || ""}
                  onChange={(e) => handleAdresseSiegeChange("nom_voie", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="code_postal">Code postal</Label>
                <Input
                  id="code_postal"
                  value={formState.client.adresse_siege.code_postal || ""}
                  onChange={(e) => handleAdresseSiegeChange("code_postal", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formState.client.adresse_siege.ville || ""}
                  onChange={(e) => handleAdresseSiegeChange("ville", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pays">Pays</Label>
                <Input
                  id="pays"
                  value={formState.client.adresse_siege.pays || "France"}
                  onChange={(e) => handleAdresseSiegeChange("pays", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5 : Associés */}
        <Card>
          <CardHeader>
            <CardTitle>Associés</CardTitle>
            <CardDescription>Liste des associés de la société</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationErrors.associes && (
              <Alert variant="destructive">
                <AlertDescription>{validationErrors.associes}</AlertDescription>
              </Alert>
            )}

            {formState.associes
              .map((associe, originalIndex) => ({ associe, originalIndex }))
              .filter(({ associe }) => !associe._deleted)
              .map(({ associe, originalIndex }, displayIndex) => (
              <div key={associe.id || `new-${originalIndex}`} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Associé {displayIndex + 1}</h3>
                  <div className="flex items-center gap-2">
                    {associe.president && (
                      <Badge variant="default">Président</Badge>
                    )}
                    {associe.directeur_general && (
                      <Badge variant="secondary">Directeur Général</Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAssocie(originalIndex)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={formState.associes.filter(a => !a._deleted).length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Civilité</Label>
                    <Select
                      value={associe.civilite || ""}
                      onValueChange={(value) => handleAssocieChange(originalIndex, "civilite", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M.">M.</SelectItem>
                        <SelectItem value="Mme">Mme</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prénom *</Label>
                    <Input
                      value={associe.prenom}
                      onChange={(e) => handleAssocieChange(originalIndex, "prenom", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={associe.nom}
                      onChange={(e) => handleAssocieChange(originalIndex, "nom", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date de naissance</Label>
                    <Input
                      type="date"
                      value={associe.date_naissance ? associe.date_naissance.split('T')[0] : ""}
                      onChange={(e) => handleAssocieChange(originalIndex, "date_naissance", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lieu de naissance</Label>
                    <Input
                      value={associe.lieu_naissance}
                      onChange={(e) => handleAssocieChange(originalIndex, "lieu_naissance", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nationalité</Label>
                    <Input
                      value={associe.nationalite}
                      onChange={(e) => handleAssocieChange(originalIndex, "nationalite", e.target.value)}
                      placeholder="Française"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Adresse complète</Label>
                    <Textarea
                      value={associe.adresse}
                      onChange={(e) => handleAssocieChange(originalIndex, "adresse", e.target.value)}
                      rows={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={associe.email}
                      onChange={(e) => handleAssocieChange(originalIndex, "email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      type="tel"
                      value={associe.telephone}
                      onChange={(e) => handleAssocieChange(originalIndex, "telephone", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nombre d'actions</Label>
                    <Input
                      type="number"
                      min={0}
                      value={associe.nombre_actions}
                      onChange={(e) =>
                        handleAssocieChange(originalIndex, "nombre_actions", Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Montant apport (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={associe.montant_apport}
                      onChange={(e) =>
                        handleAssocieChange(originalIndex, "montant_apport", Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`president-${associe.id}`}
                          checked={associe.president}
                          onChange={(e) =>
                            handleAssocieChange(originalIndex, "president", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`president-${associe.id}`} className="cursor-pointer">
                          Président
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`dg-${associe.id}`}
                          checked={associe.directeur_general}
                          onChange={(e) =>
                            handleAssocieChange(originalIndex, "directeur_general", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`dg-${associe.id}`} className="cursor-pointer">
                          Directeur Général
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddAssocie}
              className="w-full mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un associé
            </Button>
          </CardContent>
        </Card>

        {/* Section 6 : Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Pièces jointes</CardTitle>
            <CardDescription>Documents associés au client (lecture seule)</CardDescription>
          </CardHeader>
          <CardContent>
            {formState.pieces_jointes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune pièce jointe.</p>
            ) : (
              <div className="space-y-2">
                {formState.pieces_jointes.map((piece) => (
                  <div
                    key={piece.id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div>
                      <p className="font-medium">{piece.nom_fichier}</p>
                      <p className="text-sm text-muted-foreground">
                        {(piece.taille_fichier / 1024).toFixed(2)} KB • {piece.type_fichier}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(piece.url_fichier, "_blank")}
                    >
                      Ouvrir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${params.id}`)}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}

