## 1. Backend: Proyeksi per-role & RBAC detail

- [x] 1.1 Ubah `listEmployees` (`services/employee.service.ts`): proyeksi per-role — STAFF memakai `select({ id, full_name, position })` setelah `getUserDepartmentId`, HRD tetap `withDepartmentProjection`
- [x] 1.2 Sederhanakan `getEmployeeById` menjadi `getEmployeeById(id)` — hapus param `userRole`/`userId` dan branch 403 se-department
- [x] 1.3 Update `getEmployeeByUserId` (profil sendiri) bila diperlukan agar konsisten dengan bentuk `EmployeeWithDepartment` semua-role
- [x] 1.4 Tambah `rbacGuard(["HRD"])` pada `GET /:id` di `routes/employee.routes.ts`
- [x] 1.5 Update `controllers/employee.controller.ts` `getById` — tidak perlu lagi membaca `req.user`, cukup terusan id
- [x] 1.6 Perbarui `services/employee.service.test.ts`: hapus skenario STAFF di `getEmployeeById`, tambah skenario proyeksi ringkas STAFF di `listEmployees`
- [x] 1.7 Perbarui `controllers/employee.controller.test.ts` sesuai signature baru `getById` dan `list`
- [x] 1.8 Regen Swagger: `npm run docs --prefix server`

## 2. Client: Tipe & data-layer employee

- [x] 2.1 Buat `features/employees/types.ts` — `EmployeeListItem = { id, full_name, position }`, `Employee` penuh (`status`, `base_salary`, `join_date`, `department: { id, name } | null`, dst.)
- [x] 2.2 Buat `features/employees/api.ts` — `employeesApi` (list, mine, create, update, remove, resetPassword) via `apiFetch`
- [x] 2.3 Hapus tipe flat `Employee` di `features/departments/types.ts`; update `features/departments/api.ts` & `hooks.ts` (`useActiveEmployees`) agar mengimpor `Employee` dari `features/employees/types.ts`
- [x] 2.4 Buat `features/employees/schema.ts` — Zod schema form create/edit (nama, department_id, position, base_salary, join_date, status)
- [x] 2.5 Buat `features/employees/hooks.ts` — `useEmployees`, `useMyProfile`, `useCreateEmployee`, `useUpdateEmployee`, `useDeactivateEmployee`, `useResetPassword`; query keys `["employees"]`, `["employee-mine"]`; invalidasi list setelah mutation

## 3. Client: Komponen UI

- [x] 3.1 Buat daftar STAFF (read-only): daftar nama + jabatan, badge department dari `mine`, tanpa aksi
- [x] 3.2 Buat tabel HRD: kolom nama, jabatan, department, status (reuse `StatusBadge`), dropdown aksi (Edit / Nonaktifkan / Reset Password)
- [x] 3.3 Buat dialog create/edit employee (`employee-dialog.tsx`) dengan dropdown department dari `useDepartments()` (enabled saat dialog terbuka) — pola mengikuti `department-dialog.tsx`
- [x] 3.4 Buat dialog konfirmasi nonaktif (`employee-delete-dialog.tsx`)
- [x] 3.5 Buat modal kredensial sekali pakai (`credentials-dialog.tsx`) dengan tombol salin, dipakai setelah create & reset-password

## 4. Client: Rute & navigasi

- [x] 4.1 Buat rute `routes/_app/employees/index.tsx` — branch role dari `useAuthStore` (STAFF: daftar read-only; HRD: tabel + aksi)
- [x] 4.2 Update `features/shell/navigation.tsx` — item "Karyawan" tanpa `roles` (tampil untuk semua role)
- [x] 4.3 Update `features/shell/navigation.tsx` — item lain yang disabled tetap tidak berubah

## 5. Verifikasi & spesifikasi

- [x] 5.1 Jalankan verifikasi root: `npm run lint && npm run typecheck && npm run build`
- [x] 5.2 Jalankan test server: `npm test --prefix server`
- [x] 5.3 Sinkronkan delta specs ke `openspec/specs/` (`employee-management`, `employee-management-ui`)
- [x] 5.4 Update `docs/ARCHITECTURE.md` (RBAC matrix, status modul employee) bila perlu

## 6. Follow-up: halaman Department khusus HRD (frontend-only)

- [x] 6.1 `features/shell/navigation.tsx` — item "Department" diberi `roles: ["HRD"]` (sembunyi untuk STAFF)
- [x] 6.2 `routes/_app/departments/index.tsx` — tambah guard `beforeLoad` redirect non-HRD ke `/`
- [x] 6.3 `routes/_app/index.tsx` — `useDepartments` hanya di-enable untuk HRD (`useDepartments(isHRD)`)
- [x] 6.4 Sinkronkan main spec `openspec/specs/department-management-ui/spec.md` (menu Department khusus HRD)