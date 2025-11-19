'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabaseClient } from "@/lib/supabase";
import DashboardStats from "./components/DashboardStats";
import WorkflowClients from "./components/WorkflowClients";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();

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
      } catch (error) {
        console.error("Erreur lors du chargement du dashboard", error);
        if (isMounted) {
          setErrorMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
        }
      }
    };

    void fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-3xl sm:text-4xl">Tableau de bord</CardTitle>
            <CardDescription>
              {userEmail ? `Connecté en tant que ${userEmail}` : "Chargement de votre session..."}
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="/dashboard/clients/new">Ajouter un client</Link>
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

        {/* Widgets de statistiques */}
        <DashboardStats />

        {/* Workflow Clients */}
        <div className="mt-8">
          <WorkflowClients />
        </div>
      </div>
    </div>
  );
}

