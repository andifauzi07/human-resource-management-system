import { Eye, KeyRound, MoreHorizontal, Pencil, UserX, Users } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useAllEmployees } from "../hooks";
import type { Employee } from "../types";

interface EmployeeTableProps {
  onEdit: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onResetPassword: (employee: Employee) => void;
}

const columns: DataTableColumn<Employee>[] = [
  {
    key: "full_name",
    header: "Nama",
    type: "text",
    sortable: true,
    getValue: (e) => e.full_name,
    className: "px-4 font-medium"
  },
  {
    key: "position",
    header: "Jabatan",
    type: "text",
    sortable: true,
    getValue: (e) => e.position
  },
  {
    key: "department",
    header: "Department",
    type: "category",
    filterable: true,
    getValue: (e) => e.department?.name ?? ""
  },
  {
    key: "status",
    header: "Status",
    type: "category",
    filterable: true,
    getValue: (e) => (e.status === "ACTIVE" ? "Aktif" : "Nonaktif"),
    render: (e) => (
      <StatusBadge
        status={e.status}
        label={e.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
      />
    )
  }
];

export function EmployeeTable({
  onEdit,
  onDeactivate,
  onResetPassword
}: EmployeeTableProps) {
  const { data, isLoading, isError, refetch } = useAllEmployees(true);
  const navigate = useNavigate();

  const actionColumn: DataTableColumn<Employee> = {
    key: "actions",
    header: "",
    type: "action",
    getValue: () => null,
    className: "w-12 text-right",
    headerClassName: "w-12",
    render: (employee) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Aksi">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => navigate({ to: "/employees/$id", params: { id: employee.id } })}
          >
            <Eye /> Detail
          </DropdownMenuItem>
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
    )
  };

  const allColumns = [...columns, actionColumn];

  if (isError) {
    return (
      <Card>
        <CardContent className="grid place-items-center gap-3 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Gagal memuat daftar karyawan.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="grid gap-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const employees = data ?? [];

  return (
    <Card>
      <CardContent className="p-4">
        {employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada karyawan"
            description="Tambahkan karyawan pertama untuk mulai."
          />
        ) : (
          <DataTable
            columns={allColumns}
            rows={employees}
            getRowKey={(e) => e.id}
            searchEnabled
            searchPlaceholder="Cari nama atau jabatan…"
            defaultSortKey="created_at"
            emptyState="Tidak ada karyawan yang cocok."
          />
        )}
      </CardContent>
    </Card>
  );
}
