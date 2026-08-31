import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Sparkles, UserRound } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const contextLabel =
    user?.role === "HRD" ? "Manajemen SDM" : "Portal Karyawan";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
        <Sparkles className="size-3.5" />
        {contextLabel}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Avatar>
              <AvatarFallback>
                {user?.email ? initials(user.email.split("@")[0]) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-medium">{user?.email}</span>
              <span className="block text-xs text-muted-foreground">
                {user?.role}
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="grid gap-0.5">
            <span className="truncate font-medium">{user?.email}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {user?.role}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>
              <UserRound />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? <Spinner /> : <LogOut />}
              Keluar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}