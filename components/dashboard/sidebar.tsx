'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabaseClient } from "@/lib/supabase";

const NAV_ITEMS = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: "📊",
  },
  {
    label: "Clients",
    href: "/dashboard",
    icon: "👥",
  },
  {
    label: "Nouveau client",
    href: "/dashboard/clients/new",
    icon: "➕",
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
    <aside className="flex h-full w-64 flex-col bg-slate-50 px-6 py-8">
      <div className="mb-8 flex items-center gap-3">
        <span className="text-3xl">⚖️</span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            SaaS Statuts
          </p>
          <p className="text-xs text-slate-400">Génération juridique simplifiée</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100 ${
                isActive ? "bg-slate-200 text-slate-900" : "text-slate-600"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
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

