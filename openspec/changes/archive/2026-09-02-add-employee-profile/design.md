## Context

HRIS sudah memiliki modul Karyawan (`employee-management`): CRUD oleh HRD + daftar read-only se-department untuk STAFF, `GET /employees/mine` untuk profil sendiri, dan dropdown topbar "Profil" yang masih disabled. Data `employees` saat ini hanya menyimpan field inti (`full_name`, `department_id`, `position`, `base_salary`, `join_date`, `status`) yang seluruhnya ditetapkan oleh HRD saat create. Belum ada kolom data pribadi (NIK, alamat, telepon, rekening), belum ada halaman detail per karyawan, dan belum ada halaman profil/self-service.

Change ini menambah kolom pribadi, menyediakan self-service untuk STAFF, dan halaman detail+edit untuk HRD, sambil menjaga kolom inti tetap menjadi otoritas HRD.

## Goals / Non-Goals

**Goals:**
- Menambah kolom pribadi nullable pada `employees`: `nik` (UNIQUE), `address`, `bank_account_number`, `bank_account_name`, `phone`.
- STAFF dapat menyunting data pribadinya sendiri lewat halaman `/profile`, tanpa bisa mengubah field inti.
- HRD dapat melihat & menyunting seluruh field (termasuk inti dan pribadi) lewat halaman detail `/employees/:id` yang baru.
- Menjaga field inti (`position`, `base_salary`, `join_date`, `department_id`) hanya editable oleh HRD.
- Mengaktifkan item dropdown "Profil" di topbar.
- `join_date` default ke hari ini saat create (UX).

**Non-Goals:**
- Kolom `photo` dan integrasi upload S3 — ditunda ke iterasi berikutnya (hanya template avatar kotak + input disabled).
- Mengganti dialog "Ubah" pada tabel karyawan (halaman detail HRD bersifat tambahan).
- Mengubah kontrak field inti yang sudah dipakai frontend.
- Login/registrasi publik, modul cuti/absensi/payroll.

## Decisions

### 1. Self-service memakai endpoint baru `PATCH /employees/mine`, bukan memperluas `PATCH /employees/:id`
Alasan: `PATCH /employees/:id` sudah di-guard `rbacGuard(["HRD"])` dan STAFF tidak boleh mengubah karyawan lain. Endpoint `mine` memakai `authGuard` saja dan me-resolve karyawan dari `req.user.sub → users.employee_id`, sehingga STAFF hanya bisa mengubah dirinya sendiri. Field inti dikecualikan di Zod schema endpoint ini → tidak mungkin diedit lewat self-service (defense-in-depth, sejalan aturan "cek boleh lihat/edit data sendiri di service layer").

Alternatif ditolak: memperluas `PATCH /employees/:id` untuk menerima `STAFF` — akan memaksa guard "hanya diri sendiri" di controller/service dan berisiko bocor ke karyawan lain; endpoint terpisah lebih eksplisit.

### 2. Kolom baru nullable; `nik` UNIQUE
Karyawan dibuat HRD lewat dialog yang TIDAK berisi NIK/telepon, maka kolom pribadi **nullable di DB** (create tidak mengharuskan). "Wajib + validasi" hanya ditegakkan **di level UI/form zod** (self-service STAFF & edit HRD), bukan NOT NULL DB. `nik` dibuat `UNIQUE` index di DB untuk mencegah duplikat NIK.

### 3. Validasi zod dibedakan per konteks
- `PATCH /employees/mine` (STAFF & HRD, data pribadi): `nik`, `phone` wajib + format; `address`, `bank_*` opsional. `position`, `base_salary`, `join_date`, `department_id` TIDAK diterima (ditolak/diabaikan).
- `PATCH /employees/:id` (HRD): semua field inti (existing) + pribadi; `nik`, `phone` wajib saat dikirim; `bank_*`, `address` opsional.

### 4. Foto: kolom di-defer, UI template
Kolom `photo` **tidak** ditambahkan sekarang (P2). UI menampilkan avatar placeholder kotak dan input upload **disabled** sebagai template — diisi integrasi S3 pada iterasi berikutnya. Menghindari kolom DB mati sebelum integrasi siap.

### 5. Default `join_date` = hari ini
Saat create employee, bila `join_date` tidak dikirim, backend mengisi tanggal hari ini. Frontend juga menginisialisasi field date dengan hari ini di dialog create (UX), namun backend tetap menegakkan default (server-side) agar konsisten bila ada konsumen API lain.

### 6. Halaman detail HRD `/employees/:id` — tambahan, bukan pengganti
Route baru `routes/_app/employees/$id.tsx` menampilkan detail + form edit semua field. Baris tabel karyawan HRD mendapat aksi/navigasi menuju detail. Dialog "Ubah" tetap ada (tidak dihapus) — keduanya mengedit field yang sama.

## Risks / Trade-offs

- **Staf mengisi `nik` duplikat** → Ditangani `UNIQUE` index di DB + error 409; service menangkap error unik dan menerjemahkannya ke pesan ramah.
- **`photo` ditunda meninggalkan UI dengan tombol disabled** → Diterima sebagai trade-off; template memperjelas arah tanpa kolom DB mati. Ditandai jelas di UI "Segera hadir".
- **Dua jalur edit (dialog + halaman detail) menambah duplikasi form** → Dibatasi dengan mereuse skema/validasi bersama antar form; halaman detail adalah tambahan, dialog existing tidak dirombak.
- **Endpoint `mine` baru berpotensi divergen dengan `mine` GET** → Dipusatkan lewat helper resolve-by-userId yang sama di service (dipakai `getEmployeeByUserId` dan update `mine`).
- **Field baru bersifat additive di response** → Tidak memutuskan frontend; namun perlu update tipe `Employee` di client dan regen Swagger.

## Migration Plan

1. Ubah `drizzle/schemas/employee.schema.ts` (tambah kolom nullable + unique `nik`).
2. `npm run db:generate --prefix server` → migration baru; `npm run db:migrate --prefix server`.
3. Jangan mengedit migration lama yang sudah diapply.
4. Rollback: migration baru bersifat additive (nullable) → aman di-rollback dengan drop kolom bila diperlukan sebelum ada data.
