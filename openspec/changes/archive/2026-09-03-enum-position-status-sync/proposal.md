## Why

Posisi karyawan (`position`) saat ini berupa free-text tanpa validasi, sehingga data tidak konsisten (ada yang "Engineer", "Manager", "Staff", dll). Status karyawan hanya `ACTIVE`/`INACTIVE` tanpa lifecycle yang jelas (tidak ada tracking probation, cuti, atau resign). Manager assignment di department tidak terhubung dengan posisi karyawan, sehingga bisa terjadi inkonsistensi (karyawan bernama "Manager" tapi bukan manager department manapun, atau department punya manager tapi karyawan tersebut bukan MANAGER).

## What Changes

- **`position` diubah dari `varchar(100)` menjadi `pgEnum("position", ["STAFF", "MANAGER"])`** — setiap karyawan hanya bisa STAFF atau MANAGER.
- **`status` diekspans dari `["ACTIVE", "INACTIVE"]` menjadi `["PROBATION", "ACTIVE", "ON_LEAVE", "RESIGNED"]`** — mendukung lifecycle karyawan: masa percobaan, aktif, cuti, resign.
- **Bi-directional sync antara `employees.position` dan `departments.manager_id`**:
  - Jika employee dipilih jadi MANAGER → `departments.manager_id` otomatis di-set (hanya jika department belum punya manager).
  - Jika department assign manager → `employees.position` otomatis di-set ke MANAGER.
  - Jika employee position diubah ke STAFF (dari MANAGER) → `departments.manager_id` di-set null.
  - Jika department unassign manager → `employees.position` di-set ke STAFF.
- **Validasi konflik manager**: Department hanya boleh punya 1 manager. Jika sudah ada, sistem menolak dengan pesan error.
- **Constraint same-department**: Manager harus berasal dari department yang sama. HRD harus pindah department dulu sebelum bisa promote ke manager.
- **Guard deactivation**: Karyawan dengan position MANAGER tidak bisa dideactivate. HRD harus ganti manager department dulu.
- **Auto-transition PROBATION → ACTIVE**: Dihitung saat query (join_date + 90 hari < now), bukan cron job.

## Capabilities

### New Capabilities

- `employee-position-sync`: Sinkronisasi bi-directional antara `employees.position` dan `departments.manager_id`, termasuk validasi konflik, same-department constraint, dan guard deactivation.

### Modified Capabilities

- `employee-management`: Perubahan `position` dari varchar ke enum, ekspans `status` enum, penambahan rule deactivation guard (manager tidak bisa dideactivate), auto-transition PROBATION → ACTIVE.
- `department-management`: Penambahan validasi manager harus dari department yang sama, validasi 1 manager per department, sync position saat assign/unassign manager.

## Impact

- **Database Schema**: `employee.schema.ts` — `position` diubah ke `pgEnum`, `status` enum diekspans. Migrasi diperlukan.
- **Backend Service**: `employee.service.ts` — tambah logic same-department check saat set position MANAGER, deactivation guard, auto-transition PROBATION. `department.service.ts` — tambah validasi 1 manager per dept, same-department check, sync position saat assign/unassign.
- **Backend Controller**: Validasi Zod diperbarui untuk enum values baru.
- **Frontend Forms**: `employee-dialog.tsx` — position dari text input jadi Select dropdown. `department-dialog.tsx` — manager select difilter per department.
- **Frontend Types**: Update TypeScript types untuk enum values baru.
- **Frontend Table**: Status badge diperbarui (4 state bukan 2).
- **API Contracts**: Response field `position` dan `status` sekarang enum values, bukan free text. **BREAKING** untuk client yang expect free text.
