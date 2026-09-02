import { useState } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useDeactivateEmployee } from "../hooks";
import type { Employee } from "../types";

interface EmployeeDeactivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export function EmployeeDeactivateDialog({
  open,
  onOpenChange,
  employee
}: EmployeeDeactivateDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const deactivateMutation = useDeactivateEmployee();

  async function handleDeactivate() {
    if (!employee) return;
    setFormError(null);
    try {
      await deactivateMutation.mutateAsync(employee.id);
      toast.success("Employee berhasil dinonaktifkan");
      onOpenChange(false);
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nonaktifkan Karyawan</DialogTitle>
          <DialogDescription>
            Anda yakin ingin menonaktifkan{" "}
            <span className="font-medium text-foreground">
              {employee?.full_name}
            </span>
            ? Akun terkait tidak dapat login, dan karyawan tidak muncul sebagai
            manager. Data tetap tersimpan.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deactivateMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending && <Spinner />}
            Nonaktifkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}