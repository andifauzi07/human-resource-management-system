import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";
import { restoreSession } from "@/features/auth/session";
import { AppShell } from "@/features/shell/components/app-shell";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    await restoreSession();
    if (!useAuthStore.getState().user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  pendingComponent: PendingScreen,
  component: AppShellRoute
});

function PendingScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background">
      <Spinner className="size-6 text-primary" />
      <span className="sr-only">Memuat…</span>
    </main>
  );
}

function AppShellRoute() {
  return <AppShell />;
}
