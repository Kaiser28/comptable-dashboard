'use client';

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { CabinetProvider, useCabinet } from "@/lib/contexts/CabinetContext";
import { Loader2 } from "lucide-react";

type DashboardLayoutProps = {
  children: ReactNode;
};

/**
 * Composant interne qui utilise le hook useCabinet
 * Nécessaire car les hooks doivent être utilisés dans un composant enfant du Provider
 */
function DashboardContent({ children }: DashboardLayoutProps) {
  const { loading, error } = useCabinet();

  // Afficher un loading pendant le chargement du cabinet_id
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Chargement de votre cabinet...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur si le cabinet_id n'a pas pu être chargé
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-6">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">
            Redirection vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen">
        <DashboardSidebar />
        <div className="flex-1 overflow-auto bg-muted px-6 py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <CabinetProvider>
      <DashboardContent>{children}</DashboardContent>
    </CabinetProvider>
  );
}

