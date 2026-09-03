## Why

Dialog "Ubah Karyawan" saat ini menampilkan 10 field (5 field inti + 5 field pribadi: NIK, telepon, alamat, no. rekening, nama rekening). Padahal, field pribadi sudah diisi oleh karyawan itu sendiri melalui halaman profil (`/profile`). HRD tidak perlu mengedit field pribadi dari dialog — cukup dari halaman detail (`/employees/:id`) bila diperlukan. Dialog yang ringkas (hanya 5 field) membuat proses edit lebih cepat dan konsisten dengan dialog "Tambah Karyawan".

## What Changes

- Hapus section "Data Pribadi" (NIK, telepon, alamat, no. rekening, nama rekening) dari dialog edit di `employee-dialog.tsx`
- Dialog edit hanya menampilkan 5 field inti: nama lengkap, department, jabatan, gaji pokok, tanggal gabung — sama persis dengan dialog create
- Tidak ada perubahan backend, schema Zod, halaman detail, atau halaman profil

## Capabilities

### New Capabilities

_(tidak ada)_

### Modified Capabilities

_(tidak ada — perubahan ini murni UI detail, tidak mengubah requirement spec yang ada)_

## Impact

- **File yang diubah:** `client/src/features/employees/components/employee-dialog.tsx` — hapus blok JSX section "Data Pribadi" pada mode edit
- **Backend:** tidak ada perubahan — PATCH endpoint sudah handle partial update (semua field `optional()`)
- **Schema Zod frontend:** `employeeEditSchema` tetap ada (field opsional, tidak merugikan)
- **Halaman detail `/employees/:id`** tidak berubah — HRD tetap bisa lihat & edit field pribadi di sana
- **Halaman profil `/profile`** tidak berubah — karyawan tetap isi data pribadi sendiri
