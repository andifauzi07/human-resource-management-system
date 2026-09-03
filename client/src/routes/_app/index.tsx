import { createFileRoute } from "@tanstack/react-router";
import { Building2, CalendarDays, MapPin, Users } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useDepartments } from "@/features/departments/hooks";
import { useEmployees } from "@/features/employees/hooks";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isHRD = user?.role === "HRD";
  const { data: departments, isLoading: departmentsLoading } =
    useDepartments(isHRD);
  const { data: employees, isLoading: employeesLoading } = useEmployees();

  const departmentValue = departmentsLoading
    ? <Skeleton className="h-7 w-10" />
    : String(departments?.length ?? 0);

  const activeEmployees = employees?.filter((e) => e.status !== "RESIGNED");
  const employeeValue = employeesLoading
    ? <Skeleton className="h-7 w-10" />
    : String(activeEmployees?.length ?? 0);

  const stats = isHRD
    ? [
        { label: "Karyawan", value: employeeValue, icon: Users, hint: "Total karyawan" },
        { label: "Cuti", value: "--", icon: CalendarDays, hint: "Menunggu persetujuan" },
        { label: "Absensi", value: "--", icon: MapPin, hint: "Kehadiran hari ini" },
        { label: "Department", value: departmentValue, icon: Building2, hint: "Struktur organisasi" }
      ]
    : [
        { label: "Cuti tersisa", value: "--", icon: CalendarDays, hint: "Kuota tahun berjalan" },
        { label: "Absensi", value: "--", icon: MapPin, hint: "Kehadiran bulan ini" }
      ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan akun dan ruang kerja Anda."
      />

      <div
        className={
          isHRD
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            : "grid gap-4 sm:grid-cols-2 lg:grid-cols-2"
        }
      >
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            hint={stat.hint}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">
            Selamat datang di HRIS
          </CardTitle>
          <CardDescription>Anda berhasil masuk ke sistem.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Role</span>
            <StatusBadge status={user?.role ?? "guest"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}