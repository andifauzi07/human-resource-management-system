## Context

Modul employee di backend (`server/src/services/employee.service.ts`) saat ini membatasi:
- `listEmployees` hanya untuk HRD (STAFF dapat 403).
- `getEmployeeById` membatasi STAFF hanya boleh lihat record employee miliknya sendiri.
- Semua query `select()` dari `employeesTable` mengembalikan `department_id` polos tanpa nama department.

Kebutuhan baru: STAFF boleh melihat seluruh karyawan di department yang sama, dan response harus menyertakan objek `department { id, name }` agar frontend tidak perlu lookup/filter tambahan.

## Goals / Non-Goals

**Goals:**
- `GET /employees` mengembalikan semua karyawan untuk HRD, dan hanya karyawan se-department untuk STAFF.
- `GET /employees/:id` mengizinkan STAFF melihat detail karyawan lain di department yang sama; tolak 403 untuk department berbeda.
- Response `list`, `getById`, dan `getMine` menyertakan objek `department { id, name }`.
- Konsisten dengan pola JOIN yang sudah dipakai di `department.service.ts`.

**Non-Goals:**
- Tidak mengubah endpoint CRUD lain (create/update/deactivate/reset-password tetap HRD-only).
- Tidak menambahkan pagination/filtering/search di backend (di luar scope; dataset kecil).
- Tidak mengimplementasikan frontend — ditangani change terpisah.

## Decisions

### 1. Tambah tipe `EmployeeWithDepartment`

Buat interface baru yang menambah objek department di atas hasil select employee:

```ts
export interface EmployeeWithDepartment extends Employee {
  department: Pick<Department, "id" | "name"> | null;
}
```

Alternatif yang ditolak: query param `?include=department` — menambah kompleksitas conditional di service/controller padahal semua consumer (HRD & STAFF list/detail/mine) butuh department. Selalu JOIN lebih sederhana dan konsisten.

### 2. JOIN department pada 3 query

Gunakan projection + LEFT JOIN (pola identik dengan `withManagerProjection` di `department.service.ts:18-25`):

```ts
const withDepartmentProjection = {
  id: employeesTable.id,
  department_id: employeesTable.department_id,
  full_name: employeesTable.full_name,
  position: employeesTable.position,
  base_salary: employeesTable.base_salary,
  join_date: employeesTable.join_date,
  status: employeesTable.status,
  created_at: employeesTable.created_at,
  updated_at: employeesTable.updated_at,
  department: { id: departmentsTable.id, name: departmentsTable.name }
};
```

Query: `select(withDepartmentProjection).from(employeesTable).leftJoin(departmentsTable, eq(departmentsTable.id, employeesTable.department_id))`.

Alasan LEFT JOIN (bukan INNER): `department_id` NOT NULL, namun LEFT JOIN menjaga konsistensi pola dengan department service dan aman jika ada data orphant.

### 3. Scope STAFF di `listEmployees`

Ubah signature menjadi `listEmployees(userRole: string, userId: string)`:

- Jika role `HRD` → return semua (JOIN department).
- Jika role `STAFF` → resolve department user lewat `users.employee_id` → filter `employees.department_id = deptId` (JOIN department).

Menolak selain HRD/STAFF dengan 403 (safety, mengikuti aturan RBAC service-level).

### 4. Scope STAFF di `getEmployeeById`

Ubah logic: STAFF kini diizinkan jika ditemukan karyawan lain di department yang sama. Implementasi: resolve department milik user STAFF (via `users.employee_id`), lalu cek apakah `employee.department_id === deptId`. Jika tidak → 403.

Alternatif yang ditolak: self-only check (perilaku lama) — bertentangan dengan kebutuhan se-department.

## Risks / Trade-offs

- [Perubahan kontrak API (breaking: response + RBAC)] → Respond aneh bagi frontend lama; dimitigasi karena frontend employee belum ada dan docs/Swagger diupdate bersamaan. Sesuai AGENTS.md, perubahan kontrak sudah dikonfirmasi eksplisit.
- [LEFT JOIN mengembalikan `department: null` jika data orphant] → `department_id` NOT NULL di DB sehingga praktis tidak terjadi; frontend tetap boleh fallback.
- [N+1: resolve department STAFF lewat query terpisah] → Hanya 1 query tambahan per request (resolve dept STAFF), tidak N+1 per-row. Diterima karena jarang.
- [`createEmployee`/`updateEmployee` return flat employee tanpa department] → Dilakukan terpisah/diakui; bukan bagian dari kebutuhan list/detail/mine. Bisa di-reconcile saat frontend butuh.

## Migration Plan

1. Ubah service type & query (`employee.service.ts`).
2. Ubah controller `list` untuk meneruskan `userId`.
3. Update unit test (`employee.service.test.ts`, `employee.controller.test.ts`).
4. Regen Swagger: `npm run docs --prefix server`.
5. Update `openspec/specs/employee-management/spec.md`.
6. Verifikasi: `npm run lint --prefix server`, `npm run typecheck`, lalu `npm run build` di root.

Rollback: kembalikan service/controller ke versi sebelumnya (git) tanpa migrasi DB (tidak ada perubahan skema).
