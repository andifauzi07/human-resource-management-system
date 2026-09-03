import { useMemo } from "react";
import { Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useEmployees, useMyProfile } from "../hooks";

export function StaffEmployeeList() {
  const { data, isLoading, isError, refetch } = useEmployees();

  const { managers, staff } = useMemo(() => {
    if (!data) return { managers: [], staff: [] };

    const sorted = [...data].sort((a, b) => {
      if (a.position === "MANAGER") return -1;
      if (b.position === "MANAGER") return 1;
      return a.join_date.localeCompare(b.join_date);
    });

    return {
      managers: sorted.filter((e) => e.position === "MANAGER"),
      staff: sorted.filter((e) => e.position !== "MANAGER")
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="grid gap-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="grid place-items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Gagal memuat daftar karyawan.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data && data.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Users}
            title="Belum ada anggota"
            description="Belum ada karyawan di department Anda."
          />
        </CardContent>
      </Card>
    );
  }

  const hasManagers = managers.length > 0;
  const hasStaff = staff.length > 0;

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {hasManagers &&
            managers.map((employee) => (
              <li
                key={employee.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium">{employee.full_name}</span>
                <Badge variant="outline">MANAGER</Badge>
              </li>
            ))}

          {hasManagers && hasStaff && <div className="border-t" />}

          {hasStaff &&
            staff.map((employee) => (
              <li
                key={employee.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium">{employee.full_name}</span>
                <span className="text-muted-foreground text-sm">
                  {employee.position}
                </span>
              </li>
            ))}

          {hasManagers && !hasStaff && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              Belum ada staf di department ini
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

export function StaffDepartmentBadge() {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading) return null;

  const name = profile?.department?.name;
  if (!name) return null;

  return (
    <Badge variant="secondary" className="gap-1.5">
      <Building2 />
      Dept. {name}
    </Badge>
  );
}
