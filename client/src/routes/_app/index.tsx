import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan akun Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">
            Selamat datang di HRIS
          </CardTitle>
          <CardDescription>
            Anda berhasil masuk ke sistem.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Role</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {user?.role}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
