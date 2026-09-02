## 1. Service Layer

- [x] 1.1 Tambah interface `EmployeeWithDepartment` (extends `Employee`) di `employee.service.ts`
- [x] 1.2 Tambah projection `withDepartmentProjection` (LEFT JOIN departments) di `employee.service.ts`
- [x] 1.3 Ubah `listEmployees(userRole, userId)` — HRD all / STAFF same-department (JOIN department)
- [x] 1.4 Ubah `getEmployeeById(id, userRole, userId)` — STAFF boleh lihat employee se-department (JOIN department)
- [x] 1.5 Ubah `getEmployeeByUserId(userId)` — tambah JOIN department pada response
- [x] 1.6 Konfirmasi `createEmployee`/`updateEmployee` tidak wajib diubah (return flat employee di luar scope list/detail)

## 2. Controller Layer

- [x] 2.1 Ubah handler `list` untuk meneruskan `userId` ke `employeeService.listEmployees`

## 3. Tests

- [x] 3.1 Update `employee.service.test.ts` — list: HRD all, STAFF same-dept; getById: STAFF same-dept allowed & different-dept 403
- [x] 3.2 Update `employee.controller.test.ts` — handler `list` signature & response shape
- [x] 3.3 Jalankan `npm test --prefix server` dan pastikan lolos

## 4. Docs & Verifikasi

- [x] 4.1 Regen Swagger: `npm run docs --prefix server`
- [x] 4.2 Update `openspec/specs/employee-management/spec.md` (RBAC & response department)
- [x] 4.3 Jalankan `npm run lint --prefix server` dan `npm run typecheck --prefix server`
- [x] 4.4 Jalankan `npm run build` di root (validasi client + server)
