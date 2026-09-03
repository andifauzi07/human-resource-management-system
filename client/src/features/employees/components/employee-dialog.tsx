import { Fragment, useState, useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useDepartments } from "@/features/departments/hooks";
import { employeeEditSchema, employeeFormSchema } from "../schema";
import { useCreateEmployee, useUpdateEmployee } from "../hooks";
import type { CreateEmployeeResult } from "../types";
import type { Employee } from "../types";

interface FormValues {
  full_name: string;
  department_id: string;
  position: "STAFF" | "MANAGER";
  base_salary: string;
  join_date: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const editableFields: Array<keyof FormValues> = [
  "full_name",
  "department_id",
  "position",
  "base_salary",
  "join_date"
];

function collectErrors(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && editableFields.includes(key as keyof FormValues)) {
      errors[key as keyof FormValues] ??= issue.message;
    }
  }
  return errors;
}

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onCreated?: (result: CreateEmployeeResult) => void;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  onCreated
}: EmployeeDialogProps) {
  const isEdit = Boolean(employee);
  const [values, setValues] = useState<FormValues>(() => ({
    full_name: employee?.full_name ?? "",
    department_id: employee?.department_id ?? "",
    position: employee?.position ?? "STAFF",
    base_salary: employee ? String(employee.base_salary) : "",
    join_date: employee?.join_date ?? ""
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDemote, setConfirmDemote] = useState(false);

  const { data: departments, isFetching: departmentsLoading } =
    useDepartments(open);
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const submitting = createMutation.isPending || updateMutation.isPending;

  function setField(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const doSubmit = useCallback(async (values: FormValues) => {
    if (isEdit && employee) {
      const parsed = employeeEditSchema.safeParse(values);
      if (!parsed.success) {
        setFieldErrors(collectErrors(parsed.error));
        return;
      }

      try {
        await updateMutation.mutateAsync({
          id: employee.id,
          input: {
            full_name: parsed.data.full_name,
            department_id: parsed.data.department_id,
            position: parsed.data.position,
            base_salary: parsed.data.base_salary,
            join_date: parsed.data.join_date
          }
        });
        toast.success("Employee berhasil diperbarui");
        onOpenChange(false);
      } catch (error) {
        setFormError(
          error instanceof ApiClientError
            ? error.message
            : "Terjadi kesalahan, coba lagi."
        );
      }
      return;
    }

    const parsed = employeeFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(collectErrors(parsed.error));
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        full_name: parsed.data.full_name,
        department_id: parsed.data.department_id,
        position: parsed.data.position,
        base_salary: parsed.data.base_salary,
        join_date: parsed.data.join_date
      });
      onOpenChange(false);
      onCreated?.(result);
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Terjadi kesalahan, coba lagi."
      );
    }
  }, [isEdit, employee, updateMutation, createMutation, onOpenChange, onCreated]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (isEdit && employee?.position === "MANAGER" && values.position === "STAFF") {
      setConfirmDemote(true);
      return;
    }

    await doSubmit(values);
  }

  return (
    <Fragment>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Karyawan" : "Tambah Karyawan"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi karyawan."
              : "Buat karyawan baru. Kredensial login dibuat otomatis."}
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
            <Label htmlFor="emp-name">Nama Lengkap</Label>
            <Input
              id="emp-name"
              name="full_name"
              placeholder="Nama lengkap karyawan"
              value={values.full_name}
              onChange={(e) => setField("full_name", e.target.value)}
              aria-invalid={Boolean(fieldErrors.full_name)}
              aria-describedby={fieldErrors.full_name ? "emp-name-error" : undefined}
            />
            {fieldErrors.full_name && (
              <p id="emp-name-error" className="text-destructive text-xs">
                {fieldErrors.full_name}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emp-department">Department</Label>
            <Select
              value={values.department_id}
              onValueChange={(v) => setField("department_id", v)}
            >
              <SelectTrigger
                id="emp-department"
                className="w-full"
                aria-invalid={Boolean(fieldErrors.department_id)}
              >
                <SelectValue
                  placeholder={departmentsLoading ? "Memuat..." : "Pilih department"}
                />
              </SelectTrigger>
              <SelectContent>
                {departmentsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                    <Spinner className="size-3" /> Memuat…
                  </div>
                ) : (
                  (departments ?? []).map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {fieldErrors.department_id && (
              <p className="text-destructive text-xs">
                {fieldErrors.department_id}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emp-position">Jabatan</Label>
            <Select
              value={values.position}
              onValueChange={(v) => setField("position", v)}
            >
              <SelectTrigger
                id="emp-position"
                className="w-full"
                aria-invalid={Boolean(fieldErrors.position)}
              >
                <SelectValue placeholder="Pilih jabatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">STAFF</SelectItem>
                <SelectItem value="MANAGER">MANAGER</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.position && (
              <p id="emp-position-error" className="text-destructive text-xs">
                {fieldErrors.position}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="emp-salary">Gaji Pokok (Rp)</Label>
              <Input
                id="emp-salary"
                name="base_salary"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="5000000"
                value={values.base_salary}
                onChange={(e) => setField("base_salary", e.target.value)}
                aria-invalid={Boolean(fieldErrors.base_salary)}
              />
              {fieldErrors.base_salary && (
                <p className="text-destructive text-xs">
                  {fieldErrors.base_salary}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emp-join-date">Tanggal Gabung</Label>
              <Input
                id="emp-join-date"
                name="join_date"
                type="date"
                value={values.join_date}
                onChange={(e) => setField("join_date", e.target.value)}
                aria-invalid={Boolean(fieldErrors.join_date)}
              />
              {fieldErrors.join_date && (
                <p className="text-destructive text-xs">
                  {fieldErrors.join_date}
                </p>
              )}
            </div>
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

    <Dialog open={confirmDemote} onOpenChange={setConfirmDemote}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Ubah Jabatan</DialogTitle>
          <DialogDescription>
            Mengubah jabatan dari MANAGER ke STAFF akan menghapus karyawan ini dari posisi manager department. Lanjutkan?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmDemote(false);
            }}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              setConfirmDemote(false);
              await doSubmit(values);
            }}
            disabled={submitting}
          >
            {submitting && <Spinner />}
            Ya, Ubah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </Fragment>
  );
}