'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabaseClient } from "@/lib/supabase";
import type { Client } from "@/types/database";

type ClientWithFormattedDates = Client & { formattedCreatedAt: string };

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const statusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "en attente") {
    return "secondary";
  }

  if (normalizedStatus === "formulaire rempli") {
    return "default";
  }

  if (normalizedStatus === "statuts générés") {
    return "outline";
  }

  return "secondary";
};

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientWithFormattedDates[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const [{ data: userData, error: userError }, { data: clientsData, error: clientsError }] =
          await Promise.all([
            supabaseClient.auth.getUser(),
            supabaseClient.from("clients").select("*").order("created_at", { ascending: false }),
          ]);

        if (userError) {
          setErrorMessage(
            "Impossible de récupérer votre session. Veuillez vous reconnecter."
          );
          router.push("/login");
          return;
        }

        if (!userData.user) {
          router.push("/login");
          return;
        }

        if (isMounted) {
          setUserEmail(userData.user.email ?? null);
        }

        if (clientsError) {
          throw clientsError;
        }

        if (isMounted) {
          const formattedClients = (clientsData ?? []).map((client) => ({
            ...client,
            formattedCreatedAt: formatDate(client.created_at),
          }));
          setClients(formattedClients);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du dashboard", error);
        if (isMounted) {
          setErrorMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setErrorMessage(null);

    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        setErrorMessage("La déconnexion a échoué. Veuillez réessayer.");
        return;
      }

      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
      setErrorMessage("Une erreur inattendue est survenue lors de la déconnexion.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <span className="text-sm text-muted-foreground">Chargement de vos clients…</span>
          </CardContent>
        </Card>
      );
    }

    if (clients && clients.length === 0) {
      return (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Aucun client pour le moment</CardTitle>
            <CardDescription>
              Ajoutez votre premier client pour commencer à générer ses statuts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/clients/new">Créer mon premier client</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (clients && clients.length > 0) {
      return (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>SIRET</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium">{client.nom_entreprise}</TableCell>
                    <TableCell>{client.siret || "—"}</TableCell>
                    <TableCell>
                      {client.statut.toLowerCase() === "statuts générés" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {client.statut}
                        </Badge>
                      ) : (
                        <Badge variant={statusBadgeVariant(client.statut)}>
                          {client.statut}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{client.email || "—"}</TableCell>
                    <TableCell>{client.formattedCreatedAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    return null;
  }, [clients, isLoading, router]);

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-3xl sm:text-4xl">Mes clients</CardTitle>
            <CardDescription>
              {userEmail ? `Connecté en tant que ${userEmail}` : "Chargement de votre session..."}
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="/dashboard/clients/new">Ajouter un client</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
            </Button>
          </div>
        </header>

        {errorMessage ? (
          <Card>
            <CardContent>
              <p className="text-sm text-destructive">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        <section className="flex-1">{content}</section>
      </div>
    </div>
  );
}

