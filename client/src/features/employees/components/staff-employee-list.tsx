import { Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useEmployees, useMyProfile } from "../hooks";

export function StaffEmployeeList() {
  const { data, isLoading, isError, refetch } = useEmployees();

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="grid gap-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="grid place-items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Gagal memuat daftar karyawan.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : data && data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada anggota"
            description="Belum ada karyawan di department Anda."
          />
        ) : (
          <ul className="divide-y">
            {data?.map((employee) => (
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
          </ul>
        )}
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