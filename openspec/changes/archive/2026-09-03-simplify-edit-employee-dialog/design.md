## Context

`EmployeeDialog` (`client/src/features/employees/components/employee-dialog.tsx`) adalah dialog unified untuk create & edit karyawan. Saat ini, mode edit menampilkan 10 field — 5 field inti + 5 field pribadi (NIK, telepon, alamat, no. rekening, nama rekening). Field pribadi seharusnya diisi oleh karyawan sendiri via halaman profil (`/profile`), sehingga dialog edit seharusnya hanya menampilkan 5 field inti saja — sama dengan dialog create.

## Goals / Non-Goals

**Goals:**
- Hapus section "Data Pribadi" dari dialog edit sehingga tampilan create & edit identik
- Pertahankan kemampuan HRD melihat/mengedit data pribadi via halaman detail (`/employees/:id`)

**Non-Goals:**
- Tidak mengubah backend, schema Zod, halaman detail, atau halaman profil
- Tidak menambah fitur baru

## Decisions

### 1. Hapus rendering JSX section "Data Pribadi" (baris 322-423)

Hapus blok `{isEdit && (<> ... </>)}` yang berisi section "Data Pribadi" dan semua field-nya (NIK, telepon, alamat, no. rekening, nama rekening).

### 2. Simplifikasi `doSubmit` untuk edit mode

Saat ini `doSubmit` mengirim personal fields ke API (baris 118-127):
```ts
...(parsed.data.nik ? { nik: parsed.data.nik } : {}),
...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
// ...dst
```

Karena form tidak lagi mengumpulkan data pribadi, baris ini harus dihapus. Cukup kirim 5 field inti saja.

### 3. Bersihkan `FormValues` dan `editableFields`

Hapus field personal dari `FormValues` interface dan dari array `editableFields` karena tidak lagi digunakan di dialog. Initial state (baris 73-85) juga tidak perlu menginisialisasi field personal.

### 4. Tidak ubah `employeeEditSchema`

Schema Zod tetap ada dengan semua field opsional — tidak merugikan dan bisa dipakai di tempat lain (mis. halaman detail).

## Risks / Trade-offs

- **[Risk]** HRD tidak bisa lagi edit data pribadi dari dialog → **Mitigation**: HRD masih bisa edit dari halaman detail `/employees/:id`
- **[Trade-off]** Duplikasi logic edit di 2 tempat (dialog + detail page) → diterima karena scope perbedaan tugas jelas: dialog = edit cepat field inti, detail page = edit lengkap
