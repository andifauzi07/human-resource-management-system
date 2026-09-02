import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { ApiClientError } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useResetPassword } from "@/features/employees/hooks";
import { StaffEmployeeList, StaffDepartmentBadge } from "@/features/employees/components/staff-employee-list";
import { EmployeeTable } from "@/features/employees/components/employee-table";
import { EmployeeDialog } from "@/features/employees/components/employee-dialog";
import { EmployeeDeactivateDialog } from "@/features/employees/components/employee-delete-dialog";
import { CredentialsDialog } from "@/features/employees/components/credentials-dialog";
import type { Employee, EmployeeCredentials, CreateEmployeeResult } from "@/features/employees/types";

export const Route = createFileRoute("/_app/employees/")({
  component: EmployeesPage
});

interface CredentialsState {
  title: string;
  description?: string;
  credentials: EmployeeCredentials;
}

function EmployeesPage() {
  const isHRD = useAuthStore((s) => s.user?.role === "HRD");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [createNonce, setCreateNonce] = useState(0);
  const [deactivating, setDeactivating] = useState<Employee | null>(null);
  const [credentials, setCredentials] = useState<CredentialsState | null>(null);
  const resetPasswordMutation = useResetPassword();

  function openCreate() {
    setEditing(null);
    setCreateNonce((n) => n + 1);
    setDialogOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setDialogOpen(true);
  }

  function handleCreated(result: CreateEmployeeResult) {
    setCredentials({
      title: "Karyawan Berhasil Dibuat",
      description: `Akun ${result.employee.full_name}. Kredensial hanya ditampilkan sekali.`,
      credentials: result.credentials
    });
  }

  async function handleResetPassword(employee: Employee) {
    try {
      const creds = await resetPasswordMutation.mutateAsync(employee.id);
      setCredentials({
        title: "Password Berhasil Direset",
        description: `Akun ${employee.full_name}. Kredensial hanya ditampilkan sekali.`,
        credentials: creds
      });
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Gagal me-reset password"
      );
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Karyawan"
        description={
          isHRD
            ? "Kelola data karyawan dan akunnya."
            : "Daftar anggota department Anda."
        }
        actions={
          <>
            {!isHRD && <StaffDepartmentBadge />}
            {isHRD && (
              <Button onClick={openCreate}>
                <Plus /> Tambah Karyawan
              </Button>
            )}
          </>
        }
      />

      {isHRD ? (
        <EmployeeTable
          onEdit={openEdit}
          onDeactivate={setDeactivating}
          onResetPassword={handleResetPassword}
        />
      ) : (
        <StaffEmployeeList />
      )}

      {isHRD && (
        <EmployeeDialog
          key={editing ? editing.id : `new-${createNonce}`}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employee={editing}
          onCreated={handleCreated}
        />
      )}

      {isHRD && (
        <EmployeeDeactivateDialog
          key={deactivating ? deactivating.id : "deactivate-unset"}
          open={Boolean(deactivating)}
          onOpenChange={(open) => {
            if (!open) setDeactivating(null);
          }}
          employee={deactivating}
        />
      )}

      <CredentialsDialog
        key={credentials ? credentials.credentials.email : "credentials-unset"}
        open={Boolean(credentials)}
        onOpenChange={(open) => {
          if (!open) setCredentials(null);
        }}
        title={credentials?.title ?? ""}
        description={credentials?.description}
        credentials={credentials?.credentials ?? null}
      />
    </div>
  );
}