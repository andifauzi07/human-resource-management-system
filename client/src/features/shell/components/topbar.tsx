import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      useAuthStore.getState().clear();
      await navigate({ to: "/login" });
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      <div className="text-sm text-muted-foreground">
        {user?.role === "HRD" ? "Manajemen SDM" : "Portal Karyawan"}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {user?.email ? initials(user.email.split("@")[0]) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-sm">
            <span className="font-medium">{user?.email}</span>
            <span className="text-xs text-muted-foreground">{user?.role}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut && <Spinner />}
          Keluar
        </Button>
      </div>
    </header>
  );
}
