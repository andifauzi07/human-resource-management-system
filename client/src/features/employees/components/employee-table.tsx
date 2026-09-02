import { KeyRound, MoreHorizontal, Pencil, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { useAllEmployees } from "../hooks";
import type { Employee } from "../types";

interface EmployeeTableProps {
  onEdit: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onResetPassword: (employee: Employee) => void;
}

export function EmployeeTable({
  onEdit,
  onDeactivate,
  onResetPassword
}: EmployeeTableProps) {
  const { data, isLoading, isError, refetch } = useAllEmployees(true);

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
            title="Belum ada karyawan"
            description="Tambahkan karyawan pertama untuk mulai."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="px-4 font-medium">
                    {employee.full_name}
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department?.name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={employee.status}
                      label={employee.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(employee)}>
                          <Pencil /> Ubah
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => onDeactivate(employee)}
                        >
                          <UserX /> Nonaktifkan
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onResetPassword(employee)}>
                          <KeyRound /> Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}