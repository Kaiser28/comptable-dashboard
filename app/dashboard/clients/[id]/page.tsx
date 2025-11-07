'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabaseClient } from "@/lib/supabase";
import type { Client } from "@/types/database";

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
      </div>
    </div>
  );
}

