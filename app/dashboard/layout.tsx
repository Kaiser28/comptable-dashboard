'use client';

import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
// TODO: Réactiver après avoir corrigé les RLS policies
// import { supabaseClient } from "@/lib/supabase";
// import { initExpertComptable, getCabinetIdByUserId } from "@/lib/initExpert";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // TODO: Réactiver après avoir corrigé les RLS policies
  // Filet de sécurité : vérifier et créer l'expert-comptable au chargement
  // useEffect(() => {
  //   const ensureExpertComptable = async () => {
  //     try {
  //       const {
  //         data: { user },
  //         error: userError,
  //       } = await supabaseClient.auth.getUser();

  //       if (userError || !user) {
  //         return; // Pas d'utilisateur connecté, ne rien faire
  //       }

  //       // Récupérer le cabinet_id
  //       const cabinetId = await getCabinetIdByUserId(user.id);
  //       if (!cabinetId) {
  //         console.warn("Cabinet non trouvé pour l'utilisateur:", user.id);
  //         return;
  //       }

  //       // Vérifier si l'expert existe, sinon le créer
  //       const result = await initExpertComptable(
  //         user.id,
  //         cabinetId,
  //         user.email || ""
  //       );

  //       if (!result.success) {
  //         console.error("Erreur lors de l'initialisation de l'expert:", result.error);
  //       }
  //     } catch (error) {
  //       console.error("Erreur dans ensureExpertComptable:", error);
  //     }
  //   };

  //   void ensureExpertComptable();
  // }, []);

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto bg-muted px-6 py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}

