import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto bg-muted px-6 py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}

