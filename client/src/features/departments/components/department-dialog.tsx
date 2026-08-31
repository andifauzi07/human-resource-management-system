import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { departmentFormSchema, type DepartmentFormValues } from "../schema";
import { useActiveEmployees, useCreateDepartment, useUpdateDepartment } from "../hooks";
import type { Department } from "../types";

type FieldErrors = Partial<Record<keyof DepartmentFormValues, string>>;

const NO_MANAGER = "none";

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  department
}: DepartmentDialogProps) {
  const isEdit = Boolean(department);
  const [values, setValues] = useState<DepartmentFormValues>(() => ({
    name: department?.name ?? "",
    manager_id: department?.manager_id ?? null
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { data: employees, isFetching: employeesLoading } = useActiveEmployees(open);
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const submitting = createMutation.isPending || updateMutation.isPending;

  function setField(field: keyof DepartmentFormValues, value: string | null) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = departmentFormSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name" || key === "manager_id") {
          errors[key] ??= issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name: parsed.data.name,
      manager_id: parsed.data.manager_id || null
    };

    try {
      if (isEdit && department) {
        await updateMutation.mutateAsync({
          id: department.id,
          input: payload
        });
        toast.success("Department berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Department berhasil dibuat");
      }
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
          <DialogTitle>
            {isEdit ? "Ubah Department" : "Tambah Department"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi department."
              : "Buat department baru di organisasi."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="dept-name">Nama</Label>
            <Input
              id="dept-name"
              name="name"
              placeholder="Nama department"
              value={values.name}
              onChange={(e) => setField("name", e.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "dept-name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="dept-name-error" className="text-destructive text-xs">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dept-manager">Manager</Label>
            <Select
              value={values.manager_id ?? NO_MANAGER}
              onValueChange={(v) =>
                setField("manager_id", v === NO_MANAGER ? null : v)
              }
            >
              <SelectTrigger id="dept-manager" className="w-full">
                <SelectValue
                  placeholder={employeesLoading ? "Memuat..." : "Pilih manager (opsional)"}
                />
              </SelectTrigger>
              <SelectContent>
                {employeesLoading ? (
                  <div className="flex items-center justify-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                    <Spinner className="size-3" /> Memuat…
                  </div>
                ) : (
                  <>
                    <SelectItem value={NO_MANAGER}>Tanpa manager</SelectItem>
                    {(employees ?? []).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner />}
              {isEdit ? "Simpan" : "Buat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
