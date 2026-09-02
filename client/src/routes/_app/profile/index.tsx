import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera, IdCard, Landmark, MapPin, Phone, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ApiClientError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { updateMineSchema } from "@/features/employees/schema";
import { useMyProfile, useUpdateMyProfile } from "@/features/employees/hooks";
import type { Employee } from "@/features/employees/types";

export const Route = createFileRoute("/_app/profile/")({
  component: ProfilePage
});

type FormValues = {
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

function formatRupiah(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(num);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-destructive text-xs">
      {message}
    </p>
  );
}

function toFormValues(emp: Employee): FormValues {
  return {
    nik: emp.nik ?? "",
    address: emp.address ?? "",
    bank_account_number: emp.bank_account_number ?? "",
    bank_account_name: emp.bank_account_name ?? "",
    phone: emp.phone ?? ""
  };
}

function ProfileForm({ profile }: { profile: Employee }) {
  const user = useAuthStore((s) => s.user);
  const updateMutation = useUpdateMyProfile();

  const [values, setValues] = useState<FormValues>(() => toFormValues(profile));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function setField(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = updateMineSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
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
      await updateMutation.mutateAsync(parsed.data);
      toast.success("Profil berhasil diperbarui");
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
      <Card>
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="bg-secondary flex size-20 items-center justify-center rounded-xl">
              <span className="text-secondary-foreground text-2xl font-semibold">
                {initials(profile?.full_name ?? user?.email ?? "?")}
              </span>
            </div>
            <div className="grid gap-1.5">
              <Button variant="outline" size="sm" disabled title="Segera hadir">
                <Camera /> Upload Foto
              </Button>
              <p className="text-muted-foreground text-xs">
                Integrasi upload foto menyusul.
              </p>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="text-muted-foreground text-xs">Nama Lengkap</dt>
              <dd className="font-medium">{profile?.full_name}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground text-xs">Jabatan</dt>
              <dd className="font-medium">{profile?.position}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground text-xs">Department</dt>
              <dd className="font-medium">{profile?.department?.name ?? "—"}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground text-xs">Tanggal Bergabung</dt>
              <dd className="font-medium">{profile?.join_date}</dd>
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <dt className="text-muted-foreground text-xs">Gaji Pokok</dt>
              <dd className="font-medium">
                {profile?.base_salary ? formatRupiah(profile.base_salary) : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Pribadi</CardTitle>
          <CardDescription>
            Informasi kontak dan rekening untuk keperluan administrasi.
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
              <Label htmlFor="pf-nik">
                <IdCard className="size-4" /> NIK
              </Label>
              <Input
                id="pf-nik"
                name="nik"
                inputMode="numeric"
                maxLength={16}
                placeholder="16 digit NIK"
                value={values.nik}
                onChange={(e) => setField("nik", e.target.value)}
                aria-invalid={Boolean(fieldErrors.nik)}
                aria-describedby={fieldErrors.nik ? "pf-nik-error" : undefined}
              />
              <FieldError id="pf-nik-error" message={fieldErrors.nik} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pf-phone">
                <Phone className="size-4" /> Nomor Telepon
              </Label>
              <Input
                id="pf-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="+62 812-3456-7890"
                value={values.phone}
                onChange={(e) => setField("phone", e.target.value)}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "pf-phone-error" : undefined}
              />
              <FieldError id="pf-phone-error" message={fieldErrors.phone} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pf-address">
                <MapPin className="size-4" /> Alamat
              </Label>
              <Input
                id="pf-address"
                name="address"
                placeholder="Alamat tempat tinggal"
                value={values.address}
                onChange={(e) => setField("address", e.target.value)}
                aria-invalid={Boolean(fieldErrors.address)}
              />
              <FieldError id="pf-address-error" message={fieldErrors.address} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="pf-bank-number">
                  <Landmark className="size-4" /> Nomor Rekening
                </Label>
                <Input
                  id="pf-bank-number"
                  name="bank_account_number"
                  placeholder="Nomor rekening"
                  value={values.bank_account_number}
                  onChange={(e) =>
                    setField("bank_account_number", e.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.bank_account_number)}
                />
                <FieldError
                  id="pf-bank-number-error"
                  message={fieldErrors.bank_account_number}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf-bank-name">
                  <UserRound className="size-4" /> Nama Rekening
                </Label>
                <Input
                  id="pf-bank-name"
                  name="bank_account_name"
                  placeholder="Nama pemilik rekening"
                  value={values.bank_account_name}
                  onChange={(e) => setField("bank_account_name", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.bank_account_name)}
                />
                <FieldError
                  id="pf-bank-name-error"
                  message={fieldErrors.bank_account_name}
                />
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

function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useMyProfile();

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Profil" description="Data pribadi Anda." />
        <Card>
          <CardContent className="grid gap-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Profil" description="Data pribadi Anda." />
        <Card>
          <CardContent className="grid place-items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Gagal memuat profil.
            </p>
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
      <PageHeader
        title="Profile"
        description="Kelola data pribadi Anda. Field jabatan, gaji, dan department dikelola oleh HRD."
      />
      <ProfileForm key={profile.id} profile={profile} />
    </div>
  );
}