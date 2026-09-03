## 1. Database Schema & Migrasi

- [x] 1.1 Update `server/src/drizzle/schemas/employee.schema.ts`: ubah `position` dari `varchar(100)` menjadi `pgEnum("position", ["STAFF", "MANAGER"])` dengan default `"STAFF"`
- [x] 1.2 Update `server/src/drizzle/schemas/employee.schema.ts`: ekspans `employeeStatusEnum` dari `["ACTIVE", "INACTIVE"]` menjadi `["PROBATION", "ACTIVE", "ON_LEAVE", "RESIGNED"]` dan ubah default menjadi `"PROBATION"`
- [x] 1.3 Generate migrasi baru via `npm run db:generate --prefix server`
- [x] 1.4 Jalankan migrasi via `npm run db:migrate --prefix server`
- [x] 1.5 Update seed/data testing jika ada agar memakai enum values baru

## 2. Backend Service Layer

- [x] 2.1 Update `server/src/services/employee.service.ts`: definisi enum position & status di service layer
- [x] 2.2 Implement logic auto-transition PROBATION → ACTIVE (computed at query time, berbasis `join_date` + 90 hari) pada list dan detail employee
- [x] 2.3 Implement sync pada `updateEmployee`: saat `position` berubah ke MANAGER, cek department sudah punya manager (reject 409 jika ada) lalu set `departments.manager_id`
- [x] 2.4 Implement sync pada `updateEmployee`: saat `position` berubah dari MANAGER ke STAFF, set `departments.manager_id` yang menunjuk karyawan menjadi `null`
- [x] 2.5 Implement validasi same-department pada saat promote ke MANAGER (manager harus dari department yang sama)
- [x] 2.6 Implement guard: tolak pemindahan department pada karyawan yang berstatus MANAGER (pesan: "status x adalah manager dept A. silahkan ubah manager dept A terlebih dahulu")
- [x] 2.7 Implement guard deactivation: tolak deactivate karyawan yang berstatus MANAGER
- [x] 2.8 Implement status transaction rules: tolak transisi apa pun kembali ke `PROBATION`
- [x] 2.9 Update `deactivateEmployee` agar set status ke `RESIGNED` (menjaga logic unassign manager_id existing)

## 3. Backend Department Service

- [x] 3.1 Update `server/src/services/department.service.ts`: tambah validasi same-department saat assign manager (karyawan harus dari department yang sama)
- [x] 3.2 Implement validasi 1 manager per department (reject 409 jika department sudah punya manager)
- [x] 3.3 Implement sync position saat assign manager (set `employees.position = "MANAGER"`)
- [x] 3.4 Implement sync position saat unassign manager (set `employees.position = "STAFF"`)
- [x] 3.5 Bungkus operasi create/update department dengan transaction agar sync atomic

## 4. Backend Controller & Zod

- [x] 4.1 Update `server/src/controllers/employee.controller.ts`: Zod schema untuk `position` menjadi `z.enum(["STAFF", "MANAGER"])`
- [x] 4.2 Update `server/src/controllers/employee.controller.ts`: Zod schema untuk `status` menjadi `z.enum(["PROBATION", "ACTIVE", "ON_LEAVE", "RESIGNED"])`

## 5. Frontend Types & API

- [x] 5.1 Update `client/src/features/employees/types.ts`: tipe `position` dan `EmployeeStatus` ke enum values baru
- [x] 5.2 Perbarui React Query hooks/caching agar data position & status ter-refetch setelah perubahan manager di department (invalidasi query silang antara employees & departments)

## 6. Frontend Employee UI

- [x] 6.1 Update `client/src/features/employees/schema.ts`: Zod `position` ke `z.enum(["STAFF", "MANAGER"])`, `status` ke enum baru
- [x] 6.2 Update `client/src/features/employees/components/employee-dialog.tsx`: posisi dari text input menjadi `<Select>` dropdown (STAFF/MANAGER)
- [x] 6.3 Tambah dialog konfirmasi saat mengubah position MANAGER → STAFF (pesan jelaskan manager department akan dihapus)
- [x] 6.4 Update `client/src/features/employees/components/employee-table.tsx`: StatusBadge untuk 4 state (PROBATION/ACTIVE/ON_LEAVE/RESIGNED)
- [x] 6.5 Handle & tampilkan error message 409 (department sudah punya manager / manager tidak bisa dipindah / tidak bisa deactivate manager)
- [x] 6.6 Update detail page `/employees/$id` untuk enum position & status

## 7. Frontend Department UI

- [x] 7.1 Update `client/src/features/departments/components/department-dialog.tsx`: filter manager select hanya menampilkan karyawan dari department yang sama
- [x] 7.2 Handle & tampilkan error message untuk validasi same-department dan 1-manager-per-departmen
- [x] 7.3 Update `client/src/features/departments/schema.ts` bila diperlukan
- [x] 7.4 Update department list untuk tampilkan status manager dengan benar

## 8. Verifikasi & Docs

- [x] 8.1 Regen Swagger docs via `npm run docs --prefix server`
- [x] 8.2 Jalankan `npm run lint && npm run typecheck && npm run build` di root pastikan lolos
- [x] 8.3 Jalankan `npm test --prefix server` (Vitest) dan perbarui test yang terkait enum status/position bila ada
