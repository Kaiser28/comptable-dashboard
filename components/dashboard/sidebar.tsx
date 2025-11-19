'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Upload, LayoutDashboard, Users, Plus, FileText, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabaseClient } from "@/lib/supabase";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    label: "Actes juridiques",
    href: "/dashboard/actes",
    icon: FileText,
  },
  {
    label: "Import CSV",
    href: "/dashboard/import",
    icon: Upload,
  },
  {
    label: "Nouveau client",
    href: "/dashboard/clients/new",
    icon: Plus,
  },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (isMounted) {
        setUserEmail(user?.email ?? null);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    const { error } = await supabaseClient.auth.signOut();
    setIsLoggingOut(false);

    if (!error) {
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-slate-200 px-6 py-8 hidden lg:flex">
      <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-800 to-blue-600 text-white font-bold text-xl">
          L
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">LexiGen</h1>
          <p className="text-xs text-slate-500">Juridique automatisé</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 mt-4">
        {NAV_ITEMS.map((item) => {
          // Gérer l'état actif : exact match ou commence par le href pour les sous-routes
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const IconComponent = item.icon;

          // Style spécial pour le lien Clients
          if (item.href === "/dashboard/clients") {
            const isClientsActive = pathname === "/dashboard/clients" || pathname?.startsWith("/dashboard/clients/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isClientsActive
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 text-blue-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:translate-x-1"
                }`}
              >
                <IconComponent className={`h-5 w-5 transition-colors ${isClientsActive ? "text-blue-600" : "text-slate-500 group-hover:text-blue-600"}`} />
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 text-blue-900 font-semibold" 
                  : "text-slate-600 hover:bg-slate-50 hover:translate-x-1"
              }`}
            >
              <IconComponent className={`h-5 w-5 transition-colors ${isActive ? "text-blue-600" : "text-slate-500 group-hover:text-blue-600"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-6" />

      <div className="space-y-3 text-sm text-slate-500">
        <p className="truncate text-xs text-slate-400">{userEmail ?? ""}</p>
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
        </Button>
      </div>
    </aside>
  );
}

