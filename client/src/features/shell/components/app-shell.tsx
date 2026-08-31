import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((v) => !v)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="bg-muted/30 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}