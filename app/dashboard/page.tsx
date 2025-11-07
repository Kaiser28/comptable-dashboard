'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabaseClient } from "@/lib/supabase";
import type { Client } from "@/types/database";

type ClientWithFormattedDates = Client & { formattedCreatedAt: string };

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const statusStyles: Record<string, string> = {
  actif: "bg-emerald-100 text-emerald-700",
  "en attente": "bg-amber-100 text-amber-700",
  archive: "bg-gray-200 text-gray-700",
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
        <div className="flex min-h-[200px] items-center justify-center">
          <span className="text-sm text-gray-500">Chargement de vos clients…</span>
        </div>
      );
    }

    if (clients && clients.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Aucun client pour le moment
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Ajoutez votre premier client pour commencer à générer ses statuts.
            </p>
          </div>
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Créer mon premier client
          </Link>
        </div>
      );
    }

    if (clients && clients.length > 0) {
      return (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="max-h-[60vh] overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nom entreprise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    SIRET
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date création
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {clients.map((client) => {
                  const badgeClassName = statusStyles[client.statut.toLowerCase()] ??
                    "bg-gray-200 text-gray-700";

                  return (
                    <tr
                      key={client.id}
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      className="cursor-pointer transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {client.nom_entreprise}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.siret || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeClassName}`}
                        >
                          {client.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.formattedCreatedAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  }, [clients, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">
              {userEmail ? `Connecté en tant que ${userEmail}` : "Chargement de votre session..."}
            </p>
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">Mes clients</h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              Ajouter un client
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:bg-red-400"
              disabled={isSigningOut}
            >
              {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        </header>

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="flex-1">{content}</section>
      </div>
    </div>
  );
}

