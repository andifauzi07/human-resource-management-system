## Why

Saat ini STAFF hanya bisa melihat profil karyawannya sendiri (`GET /employees/:id`), sedangkan list employee hanya bisa diakses HRD. Untuk mendukung frontend employee module di mana STAFF perlu melihat daftar karyawan se-department, backend perlu mengubah scope RBAC dan menyertakan informasi department dalam response sehingga frontend tidak perlu melakukan lookup/filter tambahan.

## What Changes

- **BREAKING** `GET /api/v1/employees` (list): tidak lagi HRD-only. HRD melihat semua karyawan; STAFF melihat semua karyawan di department yang sama.
- **BREAKING** `GET /api/v1/employees/:id` (detail): STAFF kini boleh melihat detail karyawan lain selama berada di department yang sama (sebelumnya hanya diri sendiri).
- **BREAKING** Response `GET /employees`, `GET /employees/:id`, dan `GET /employees/mine` kini menyertakan objek `department: { id, name }` yang di-JOIN dari tabel `departments`.
- Behavior CRUD lain (create, update, deactivate, reset-password) tidak berubah dan tetap HRD-only.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `employee-management`: RBAC scope perubahan untuk list & detail employee berbasis department, dan penambahan objek `department` dalam response.

## Impact

- **Server**
  - `server/src/services/employee.service.ts` — filter by role untuk list (HRD all / STAFF same dept), ubah akses `getEmployeeById`, tambah JOIN department di 3 query, tambah type `EmployeeWithDepartment`.
  - `server/src/controllers/employee.controller.ts` — sampaikan `userId` ke `listEmployees` agar bisa resolve department STAFF.
  - Test: `employee.controller.test.ts`, `employee.service.test.ts`.
- **Docs**: regen Swagger (`npm run docs --prefix server`), update `openspec/specs/employee-management/spec.md`.
- **Client**: belum di-scope pada change ini, diimplementasikan setelah backend selesai.
