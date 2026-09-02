## 1. Database & Skema

- [x] 1.1 Tambah kolom nullable pada `employees` di `drizzle/schemas/employee.schema.ts`: `nik` (varchar, unique), `address` (varchar/text), `bank_account_number` (varchar), `bank_account_name` (varchar), `phone` (varchar); atur `unique()` pada `nik`
- [x] 1.2 Update type `Employee`/`NewEmployee` (otomatis dari `$inferSelect`/`$inferInsert`)
- [x] 1.3 Jalankan `npm run db:generate --prefix server` dan `npm run db:migrate --prefix server` (jangan edit migration lama)

## 2. Server — Service & Controller

- [x] 2.1 Perluas `EmployeeWithDepartment` dan projection agar mengembalikan field pribadi di `service/employee.service.ts`
- [x] 2.2 Terapkan default `join_date` = hari ini pada `createEmployee` bila tidak dikirim
- [x] 2.3 Tambah `updateOwnProfile(userId, input)` di service: resolve karyawan lewat `users.employee_id` (reuse helper yang sama dengan `getEmployeeByUserId`), hanya mengubah field pribadi
- [x] 2.4 Perluas `updateEmployee` agar menerima field pribadi; tangkap error `UNIQUE` pada `nik` dan lempar 409 ApiError
- [x] 2.5 Tambah Zod schema self-service di `controllers/employee.controller.ts`: `updateMineSchema` (nik/phone wajib, bank/address opsional, TIDAK menerima field inti) dan perluas `updateEmployeeSchema` untuk field pribadi
- [x] 2.6 Tambah controller `updateMine` (authGuard, resolve dari `req.user.sub`), gandengkan ke `routes/employee.routes.ts` sebagai `PATCH /employees/mine`
- [x] 2.7 Regenerate Swagger (`npm run docs --prefix server`)

## 3. Server — Tes

- [x] 3.1 Tambah/update unit test `employee.service.test.ts`: default join_date, update own profile, penolakan field inti (bila relevan di service)
- [x] 3.2 Tambah test penanganan NIK duplikat → 409

## 4. Client — Feature Employees

- [x] 4.1 Perluas tipe `Employee` di `features/employees/types.ts` dengan `nik`, `address`, `bank_account_number`, `bank_account_name`, `phone`
- [x] 4.2 Perluas `employeesApi` (`features/employees/api.ts`): method `updateMine` (PATCH `/employees/mine`) dan `update` untuk field pribadi; perluas `UpdateEmployeeInput`
- [x] 4.3 Perluas `hooks.ts`: `useUpdateMyProfile` mutation + invalidate `employeesKeys.mine`; perluas `useUpdateEmployee` input
- [x] 4.4 Perluas schema form (`features/employees/schema.ts`) utk field pribadi; tambah skema self-service terpisah jika perlu

## 5. Client — Halaman Profil STAFF

- [x] 5.1 Buat route `routes/_app/profile/index.tsx` (`/profile`) + `routeTree.gen.ts` regenerasi via TanStack plugin
- [x] 5.2 Implementasikan halaman profil: avatar kotak placeholder + input upload disabled ("Segera hadir"), field pribadi editable, field inti read-only
- [x] 5.3 Wire submit → `useUpdateMyProfile` (PATCH `/employees/mine`) dengan validasi zod & tampil error
- [x] 5.4 Aktifkan item dropdown "Profil" di `features/shell/components/topbar.tsx` → navigasi ke `/profile`

## 6. Client — Halaman Detail HRD

- [x] 6.1 Buat route `routes/_app/employees/$id.tsx` + string `$id` di routeTree
- [x] 6.2 Implementasikan halaman detail HRD: tampilkan + edit seluruh field (inti & pribadi) via `PATCH /employees/:id`
- [x] 6.3 Tambah jalur navigasi dari baris tabel karyawan HRD (`employee-table.tsx` + `DataTable`) menuju `/employees/:id` (aksi/klik: detail)
- [x] 6.4 Tampilkan field pribadi pada dialog edit "Ubah" (dialog tetap dipertahankan); dialog "Tambah" tidak merubah wajib field inti

## 7. Verifikasi

- [x] 7.1 Jalankan `npm run lint` dan `npm run typecheck` (root) — lolos
- [x] 7.2 Jalankan `npm test --prefix server` — lolos
- [x] 7.3 Perbarui `docs/ARCHITECTURE.md` (skema, RBAC matrix, daftar endpoint self-service)
