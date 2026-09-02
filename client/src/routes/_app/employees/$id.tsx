import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Camera, IdCard, Landmark, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ApiClientError } from "@/lib/api";
import { useDepartments } from "@/features/departments/hooks";
import { employeeDetailSchema } from "@/features/employees/schema";
import { useEmployee, useUpdateEmployee } from "@/features/employees/hooks";
import type { Employee } from "@/features/employees/types";

export const Route = createFileRoute("/_app/employees/$id")({
  component: EmployeeDetailPage
});

type FormValues = {
  full_name: string;
  department_id: string;
  position: string;
  base_salary: string;
  join_date: string;
  status: "ACTIVE" | "INACTIVE";
  nik: string;
  address: string;
  bank_account_number: string;
  bank_account_name: string;
  phone: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toFormValues(emp: Employee): FormValues {
  return {
    full_name: emp.full_name,
    department_id: emp.department_id,
    position: emp.position,
    base_salary: emp.base_salary,
    join_date: emp.join_date,
    status: emp.status,
    nik: emp.nik ?? "",
    address: emp.address ?? "",
    bank_account_number: emp.bank_account_number ?? "",
    bank_account_name: emp.bank_account_name ?? "",
    phone: emp.phone ?? ""
  };
}

function EmployeeDetailForm({ employee }: { employee: Employee }) {
  const updateMutation = useUpdateEmployee();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();

  const [values, setValues] = useState<FormValues>(() =>
    toFormValues(employee)
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function setField(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = employeeDetailSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          key === "full_name" ||
          key === "department_id" ||
          key === "position" ||
          key === "base_salary" ||
          key === "join_date" ||
          key === "status" ||
          key === "nik" ||
          key === "address" ||
          key === "bank_account_number" ||
          key === "bank_account_name" ||
          key === "phone"
        ) {
          errors[key] ??= issue.message;
        }
      }
      setFieldErrors(errors);
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
          join_date: parsed.data.join_date,
          status: parsed.data.status,
          nik: parsed.data.nik,
          address: parsed.data.address,
          bank_account_number: parsed.data.bank_account_number,
          bank_account_name: parsed.data.bank_account_name,
          phone: parsed.data.phone
        }
      });
      toast.success("Karyawan berhasil diperbarui");
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={employee.full_name}
        description="Detail dan edit data karyawan."
        actions={
          <Button variant="outline" asChild>
            <Link to="/employees">
              <ArrowLeft /> Kembali
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="bg-secondary flex size-20 items-center justify-center rounded-xl">
              <span className="text-secondary-foreground text-2xl font-semibold">
                {initials(employee.full_name)}
              </span>
            </div>
            <Button variant="outline" size="sm" disabled title="Segera hadir">
              <Camera /> Upload Foto
            </Button>
            <p className="text-muted-foreground text-xs">
              Integrasi upload foto menyusul.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Karyawan</CardTitle>
          <CardDescription>
            Perbarui informasi karyawan, termasuk data pribadinya.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="ed-name">Nama Lengkap</Label>
              <Input
                id="ed-name"
                value={values.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                aria-invalid={Boolean(fieldErrors.full_name)}
              />
              {fieldErrors.full_name && (
                <p className="text-destructive text-xs">{fieldErrors.full_name}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ed-department">Department</Label>
                <Select
                  value={values.department_id}
                  onValueChange={(v) => setField("department_id", v)}
                >
                  <SelectTrigger id="ed-department" className="w-full">
                    <SelectValue
                      placeholder={departmentsLoading ? "Memuat..." : "Pilih department"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments ?? []).map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.department_id && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.department_id}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ed-position">Jabatan</Label>
                <Input
                  id="ed-position"
                  value={values.position}
                  onChange={(e) => setField("position", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.position)}
                />
                {fieldErrors.position && (
                  <p className="text-destructive text-xs">{fieldErrors.position}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="ed-salary">Gaji Pokok (Rp)</Label>
                <Input
                  id="ed-salary"
                  type="number"
                  min="1"
                  inputMode="numeric"
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
                <Label htmlFor="ed-join-date">Tanggal Gabung</Label>
                <Input
                  id="ed-join-date"
                  type="date"
                  value={values.join_date}
                  onChange={(e) => setField("join_date", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.join_date)}
                />
                {fieldErrors.join_date && (
                  <p className="text-destructive text-xs">{fieldErrors.join_date}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ed-status">Status</Label>
                <Select
                  value={values.status}
                  onValueChange={(v) => setField("status", v)}
                >
                  <SelectTrigger id="ed-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ed-nik">
                  <IdCard className="size-4" /> NIK
                </Label>
                <Input
                  id="ed-nik"
                  inputMode="numeric"
                  maxLength={16}
                  placeholder="16 digit NIK"
                  value={values.nik}
                  onChange={(e) => setField("nik", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.nik)}
                />
                {fieldErrors.nik && (
                  <p className="text-destructive text-xs">{fieldErrors.nik}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ed-phone">
                  <Phone className="size-4" /> Nomor Telepon
                </Label>
                <Input
                  id="ed-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+62 812-3456-7890"
                  value={values.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
                {fieldErrors.phone && (
                  <p className="text-destructive text-xs">{fieldErrors.phone}</p>
                )}
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="ed-address">
                  <MapPin className="size-4" /> Alamat
                </Label>
                <Input
                  id="ed-address"
                  placeholder="Alamat tempat tinggal"
                  value={values.address}
                  onChange={(e) => setField("address", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.address)}
                />
                {fieldErrors.address && (
                  <p className="text-destructive text-xs">{fieldErrors.address}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ed-bank-number">
                  <Landmark className="size-4" /> Nomor Rekening
                </Label>
                <Input
                  id="ed-bank-number"
                  placeholder="Nomor rekening"
                  value={values.bank_account_number}
                  onChange={(e) => setField("bank_account_number", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.bank_account_number)}
                />
                {fieldErrors.bank_account_number && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.bank_account_number}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ed-bank-name">Nama Rekening</Label>
                <Input
                  id="ed-bank-name"
                  placeholder="Nama pemilik rekening"
                  value={values.bank_account_name}
                  onChange={(e) => setField("bank_account_name", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.bank_account_name)}
                />
                {fieldErrors.bank_account_name && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.bank_account_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Spinner />}
                Simpan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeDetailPage() {
  const { id } = useParams({ from: "/_app/employees/$id" });
  const { data: employee, isLoading, isError, refetch } = useEmployee(id);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-9 w-40" />
        <Card>
          <CardContent className="grid gap-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Karyawan"
          description="Detail karyawan tidak dapat dimuat."
          actions={
            <Button variant="outline" asChild>
              <Link to="/employees">
                <ArrowLeft /> Kembali
              </Link>
            </Button>
          }
        />
        <Card>
          <CardContent className="grid place-items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">Gagal memuat karyawan.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <EmployeeDetailForm key={employee.id} employee={employee} />
    </div>
  );
}