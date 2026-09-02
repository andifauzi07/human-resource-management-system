import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Building2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useDepartments } from "@/features/departments/hooks";
import { DepartmentDialog } from "@/features/departments/components/department-dialog";
import { DepartmentDeleteDialog } from "@/features/departments/components/department-delete-dialog";
import type { Department } from "@/features/departments/types";

export const Route = createFileRoute("/_app/departments/")({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== "HRD") {
      throw redirect({ to: "/" });
    }
  },
  component: DepartmentsPage
});

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

interface DepartColumnsProps {
  isHRD: boolean;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}

function buildColumns({
  isHRD,
  onEdit,
  onDelete
}: DepartColumnsProps): DataTableColumn<Department>[] {
  const base: DataTableColumn<Department>[] = [
    {
      key: "name",
      header: "Nama",
      type: "text",
      sortable: true,
      getValue: (d) => d.name,
      className: "px-4 font-medium"
    },
    {
      key: "manager",
      header: "Manager",
      type: "text",
      sortable: true,
      getValue: (d) => d.manager_name ?? "",
      render: (d) => d.manager_name ?? "—"
    },
    {
      key: "created_at",
      header: "Dibuat",
      type: "date",
      sortable: true,
      getValue: (d) => new Date(d.created_at),
      render: (d) => formatDate(d.created_at)
    }
  ];

  if (isHRD) {
    base.push({
      key: "actions",
      header: "",
      type: "action",
      getValue: () => null,
      className: "w-12 text-right",
      headerClassName: "w-12",
      render: (department) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Aksi">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(department)}>
              <Pencil /> Ubah
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(department)}
            >
              <Trash2 /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    });
  }

  return base;
}

function DepartmentsPage() {
  const user = useAuthStore((s) => s.user);
  const isHRD = user?.role === "HRD";
  const { data, isLoading, isError, refetch } = useDepartments();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [createNonce, setCreateNonce] = useState(0);
  const [deleting, setDeleting] = useState<Department | null>(null);

  function openCreate() {
    setEditing(null);
    setCreateNonce((n) => n + 1);
    setDialogOpen(true);
  }

  function openEdit(department: Department) {
    setEditing(department);
    setDialogOpen(true);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Department"
        description="Kelola struktur organisasi."
        actions={
          isHRD ? (
            <Button onClick={openCreate}>
              <Plus /> Tambah Department
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="grid gap-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="grid place-items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Gagal memuat daftar department.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : data && data.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Belum ada department"
              description="Tambahkan department pertama untuk mulai."
            />
          ) : (
            <DataTable
              columns={buildColumns({
                isHRD,
                onEdit: openEdit,
                onDelete: setDeleting
              })}
              rows={data ?? []}
              getRowKey={(d) => d.id}
              searchEnabled
              searchPlaceholder="Cari nama atau manager…"
              defaultSortKey="created_at"
              emptyState="Tidak ada department yang cocok."
            />
          )}
        </CardContent>
      </Card>

      <DepartmentDialog
        key={editing ? editing.id : `new-${createNonce}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editing}
      />

      <DepartmentDeleteDialog
        key={deleting ? deleting.id : "delete-unset"}
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        department={deleting}
      />
    </div>
  );
}
