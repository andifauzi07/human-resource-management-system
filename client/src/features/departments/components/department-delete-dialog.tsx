import { useState } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteDepartment } from "../hooks";
import type { Department } from "../types";

interface DepartmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
}

export function DepartmentDeleteDialog({
  open,
  onOpenChange,
  department
}: DepartmentDeleteDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const deleteMutation = useDeleteDepartment();

  async function handleDelete() {
    if (!department) return;
    setFormError(null);
    try {
      await deleteMutation.mutateAsync(department.id);
      toast.success("Department berhasil dihapus");
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
          <DialogTitle>Hapus Department</DialogTitle>
          <DialogDescription>
            Anda yakin ingin menghapus department{" "}
            <span className="font-medium text-foreground">
              {department?.name}
            </span>
            ? Tindakan ini tidak dapat dibatalkan. Department yang masih
            memiliki karyawan tidak dapat dihapus.
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
            disabled={deleteMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Spinner />}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
