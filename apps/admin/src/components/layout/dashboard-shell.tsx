"use client";

import { useState } from "react";
import { AppSidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { cn } from "@/lib/utils";

type Props = { children: React.ReactNode };

export function DashboardShell({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main
        className={cn(
          "pt-16 transition-all duration-200",
          collapsed ? "ml-16" : "ml-56"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
