'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { supabaseClient } from "@/lib/supabase";
import type { Client } from "@/types/database";
import { validateStatutsData, ValidationResult } from "@/lib/validateStatuts";

type ClientState = {
  data: Client | null;
  isLoading: boolean;
  error: string | null;
};

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [clientState, setClientState] = useState<ClientState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    const clientId = params?.id;

    if (!clientId || typeof clientId !== "string") {
      setClientState({
        data: null,
        isLoading: false,
        error: "Identifiant du client invalide.",
      });
      return;
    }

    const fetchClient = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setClientState({ data: data ?? null, isLoading: false, error: null });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du client", error);
        if (isMounted) {
          setClientState({ data: null, isLoading: false, error: "Client introuvable." });
        }
      }
    };

    void fetchClient();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const formattedDates = useMemo(() => {
    if (!clientState.data) {
      return { createdAt: "", updatedAt: "" };
    }

    return {
      createdAt: new Date(clientState.data.created_at).toLocaleDateString("fr-FR"),
      updatedAt: new Date(clientState.data.updated_at).toLocaleDateString("fr-FR"),
    };
  }, [clientState.data]);

  if (clientState.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Chargement des informations client…</span>
      </div>
    );
  }

  if (clientState.error || !clientState.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Client introuvable</CardTitle>
            <CardDescription>
              {clientState.error ?? "Aucun client ne correspond à cette référence."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = clientState.data;

  async function handleGenerateStatuts(ignoreWarnings = false) {
    try {
      setIsGenerating(true);
      setGenerateError(null);
      setValidationErrors(null);

      // Validation des données (sauf si on ignore les warnings)
      if (!ignoreWarnings) {
        const validationResult = validateStatutsData({
          capital_social: client.capital_social ?? 0,
          nb_actions: (client as any).nb_actions ?? 0,
          montant_libere: (client as any).montant_libere ?? 0,
          duree_societe: (client as any).duree_societe ?? 0,
          objet_social: (client as any).objet_social || ''
        });

        // Si erreurs bloquantes, afficher la modal et arrêter
        if (!validationResult.isValid) {
          setValidationErrors(validationResult);
          setIsGenerating(false);
          return;
        }

        // Si seulement des warnings, afficher la modal mais permettre de continuer
        if (validationResult.warnings.length > 0) {
          setValidationErrors(validationResult);
          setIsGenerating(false);
          return;
        }
      }

      const response = await fetch("/api/generate-statuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: params.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la génération");
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Statuts-${client?.nom_entreprise || "document"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setGenerateError(error?.message ?? "Une erreur est survenue");
    } finally {
      setIsGenerating(false);
    }
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
              <li className="font-medium text-foreground">{client.nom_entreprise}</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            {client.nom_entreprise}
          </h1>
          <p className="text-sm text-muted-foreground">
            Créé le {formattedDates.createdAt} • Dernière mise à jour le {formattedDates.updatedAt}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Retour
          </Button>
          <Button>Modifier</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Détails de l’entreprise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nom</p>
              <p className="font-medium text-foreground">{client.nom_entreprise}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Forme juridique</p>
              <p className="font-medium text-foreground">
                {client.forme_juridique || "Non renseignée"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Capital social</p>
              <p className="font-medium text-foreground">
                {client.capital_social !== null
                  ? `${client.capital_social.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 0,
                    })}`
                  : "Non renseigné"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
            <CardDescription>Moyens de contacts du client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{client.email || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Téléphone</p>
              <p className="font-medium text-foreground">{client.telephone || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Adresse</p>
              <p className="font-medium text-foreground whitespace-pre-line">
                {client.adresse || "Non renseignée"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations légales</CardTitle>
            <CardDescription>Statut juridique du client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">SIRET</p>
              <p className="font-medium text-foreground">{client.siret || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Statut</p>
              <Badge
                variant={
                  client.statut.toLowerCase() === "statuts générés"
                    ? "outline"
                    : client.statut.toLowerCase() === "formulaire rempli"
                    ? "default"
                    : "secondary"
                }
              >
                {client.statut}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formulaire client</CardTitle>
            <CardDescription>État d’avancement du formulaire partagé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {client.formulaire_complete ? (
              <div className="space-y-2">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  Formulaire complété
                </Badge>
                <p className="text-muted-foreground">
                  Formulaire complété le {formattedDates.updatedAt}.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="secondary">En attente</Badge>
                <p className="text-muted-foreground">
                  Ce client n’a pas encore complété le formulaire.
                </p>
                <Button variant="outline">Envoyer le lien formulaire</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Générez automatiquement les statuts de cette société.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generateError && (
              <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{generateError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => handleGenerateStatuts()}
                disabled={isGenerating || !client?.nom_entreprise}
                className="w-full"
                size="lg"
              >
                {isGenerating ? <>⏳ Génération en cours...</> : <>📄 Générer les statuts (Word)</>}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Le document sera généré au format Word modifiable (.docx)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {validationErrors && (
        <AlertDialog open={!!validationErrors} onOpenChange={() => setValidationErrors(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {validationErrors.isValid ? (
                  <>⚠️ Avertissements détectés</>
                ) : (
                  <>❌ Impossible de générer les statuts</>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                {validationErrors.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold text-red-600">
                      {validationErrors.errors.length} erreur(s) juridique(s) détectée(s) :
                    </p>
                    {validationErrors.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="font-medium text-red-800">{error.code.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-red-700 mt-1">{error.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {validationErrors.warnings.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="font-semibold text-orange-600">
                      {validationErrors.warnings.length} avertissement(s) :
                    </p>
                    {validationErrors.warnings.map((warning, index) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded p-3">
                        <p className="text-sm text-orange-700">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {!validationErrors.isValid && (
                  <p className="text-sm text-gray-600 mt-4">
                    Veuillez corriger les erreurs dans les données du client avant de générer les statuts.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction 
                onClick={() => {
                  if (validationErrors.isValid) {
                    // Si que des warnings, fermer modal et générer quand même
                    setValidationErrors(null);
                    handleGenerateStatuts(true);
                  } else {
                    // Si erreurs bloquantes, juste fermer la modal
                    setValidationErrors(null);
                  }
                }}
              >
                {validationErrors.isValid ? "Générer quand même" : "Corriger les données"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

