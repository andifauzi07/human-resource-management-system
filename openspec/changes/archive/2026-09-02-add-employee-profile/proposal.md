## Why

Fitur "Profil" di dropdown topbar (topbar.tsx) saat ini disabled dan belum memiliki halaman maupun data. Karyawan (STAFF) maupun HRD belum bisa melihat/menyimpan data pribadi tambahan (NIK, alamat, telepon, rekening) di luar data inti yang dibuat HRD saat create. Untuk melengkapi modul Karyawan dan menyiapkan data yang dibutuhkan modul payroll (info rekening), perlu ada halaman profil dengan alur self-service untuk STAFF dan detail/editable untuk HRD.

## What Changes

- **Skema DB**: tambah kolom nullable ke tabel `employees` — `nik` (UNIQUE), `address`, `bank_account_number`, `bank_account_name`, `phone`. Kolom `photo` **TIDAK** dibuat di iterasi ini (di-defer ke iterasi integrasi S3).
- **Alur create tidak berubah**: form dialog HRD tetap meminta `full_name`, `department_id`, `position`, `base_salary` (tetap wajib), dan `join_date` yang kini di-set default ke hari ini.
- **Endpoint self-service baru**: `PATCH /api/v1/employees/mine` (STAFF/HRD, hanya data diri sendiri) untuk memperbarui `nik`, `address`, `bank_account_number`, `bank_account_name`, `phone` — field inti (position, salary, join_date, department) tidak boleh diedit lewat endpoint ini.
- **Detail HRD**: `GET /employees/:id` (sudah ada) diperluas untuk mengembalikan field baru; `PATCH /employees/:id` (sudah ada, HRD) diperluas agar bisa mengedit seluruh field termasuk `nik`, `address`, `bank_*`, `phone`.
- **Halaman baru**: `/profile` (STAFF — self-service) dan `/employees/:id` (HRD — detail + edit semua field). Halaman detail HRD bersifat **tambahan terpisah**; dialog edit "Ubah" pada tabel tetap dipertahankan.
- **Foto**: hanya template UI avatar (kotak) + input upload disabled; kolom `photo` dan integrasi upload S3 ditunda ke iterasi berikutnya.
- **Mengaktifkan** item dropdown "Profil" di topbar yang saat ini disabled.

**BREAKING** (internal, field baru di response `GET /employees/:id` & `/employees/mine`; kontrak JSON additive — tidak menghapus/mengubah field lama).

## Capabilities

### New Capabilities
- `employee-profile`: Halaman profil & self-service karyawan — STAFF melihat/menyunting data pribadinya sendiri, HRD melihat/menyunting data lengkap lewat halaman detail; foto sebagai placeholder (S3 ditunda).

### Modified Capabilities
- `employee-management`: Menambah kolom pribadi pada skema `employees` (`nik` UNIQUE, `address`, `bank_account_number`, `bank_account_name`, `phone`), menambah endpoint `PATCH /employees/mine` untuk self-service, memperluas `PATCH /employees/:id` agar HRD dapat mengedit field baru, serta default `join_date` = hari ini saat create.
- `employee-management-ui`: Menambah halaman detail karyawan `/employees/:id` untuk HRD (tambahan terpisah dari dialog "Ubah") dan memuat field pribadi pada dialog edit/create; menambah jalur navigasi dari baris tabel menuju detail.

## Impact

- **DB**: migrasi baru pada `employees` (kolom nullable; `nik` UNIQUE). Bukan penghapusan/modifikasi kolom berisi data.
- **Server**: `drizzle/schemas/employee.schema.ts`, `controllers/employee.controller.ts`, `services/employee.service.ts`, `routes/employee.routes.ts`, Zod schema validasi; regen Swagger (`npm run docs --prefix server`).
- **Client**: route baru `/profile` (`routes/_app/profile/`) dan `/employees/:id` (`routes/_app/employees/$id.tsx`); `features/employees/` (api, hooks, types, schema) diperluas; `features/shell/navigation.tsx` + dropdown "Profil" di topbar diaktifkan; navigasi tabel karyawan menuju detail (HRD).
- **Docs**: `docs/ARCHITECTURE.md` (skema/RBAC/endpoint) diperbarui.
- **Pending / iterasi berikutnya**: kolom `photo`, upload foto, integrasi S3.
