## Why

Backend modul employee sudah lengkap (CRUD + RBAC se-department + objek `department` embedded di response), namun frontend belum ada — menu "Karyawan" di sidebar belum punya rute. Saat implementasi UI terungkap kebutuhan produk yang lebih ketat: STAFF hanya perlu melihat daftar nama + jabatan anggota se-department (read-only), sedangkan operasi tulis (department & employee) sepenuhnya milik HRD.

## What Changes

- **Client modul employee (baru)**: halaman `/employees` yang melayani dua peran — STAFF melihat daftar read-only (nama + jabatan, tanpa detail), HRD melihat tabel lengkap dengan CRUD (create, edit, deactivate, reset-password) dan kolom department.
- **BREAKING** `GET /employees` untuk STAFF: response diubah menjadi proyeksi ringkas `{ id, full_name, position }` (sebelumnya baris penuh termasuk `base_salary`, `status`, `join_date`). HRD tetap mendapat proyeksi penuh + `department { id, name }`.
- **BREAKING** `GET /employees/:id` menjadi HRD-only (`rbacGuard(["HRD"])`); STAFF mendapat 403 dan hanya mengakses profil sendiri via `GET /employees/mine`.
- Navigasi: item "Karyawan" kini tampil untuk STAFF & HRD (sebelumnya HRD-only), dengan aksi CRUD dimasking berdasarkan role.

## Capabilities

### New Capabilities
- `employee-management-ui`: UI manajemen karyawan di sisi client — daftar karyawan berbasis role, dialog create/edit, konfirmasi deactivate, tampilan kredensial sekali pakai, dan masking aksi berdasarkan role.

### Modified Capabilities
- `employee-management`: RBAC & bentuk response employee diubah sebagai berikut — STAFF pada `GET /employees` hanya menerima `{ id, full_name, position }` dari karyawan se-department; `GET /employees/:id` dibatasi HRD-only; STAFF mengakses profil sendiri lewat `GET /employees/mine`.

## Impact

**Server (`server/`)**
- `services/employee.service.ts` — proyeksi per-role di `listEmployees` (STAFF ringkas / HRD penuh), sederhanakan `getEmployeeById` (hapus branch & param STAFF).
- `controllers/employee.controller.ts` — `getById` hanya meneruskan id (tanpa logika role).
- `routes/employee.routes.ts` — tambah `rbacGuard(["HRD"])` pada `GET /:id`.
- Test: `employee.service.test.ts`, `employee.controller.test.ts`.
- Regen Swagger: `npm run docs --prefix server`.

**Client (`client/`)**
- Fitur baru `features/employees/` (api, types, schema, hooks, komponen) — pola mengikuti `features/departments`.
- Rute baru `routes/_app/employees/index.tsx`.
- `features/shell/navigation.tsx` — item "Karyawan" tanpa filter `roles` (semua role), CRUD dimasking di halaman.
- Tipe `Employee` canonical dipindahkan ke `features/employees/types.ts` (dua bentuk: `EmployeeListItem` ringkas untuk STAFF, `Employee` penuh untuk HRD); `features/departments` mengimpor dari sana.

**Dokumentasi**
- Delta spec `employee-management` + `employee-management-ui`; sinkronisasi ke `openspec/specs/` saat apply.