## Why

Backend CRUD department sudah lengkap (schema, routes, controller, service, test), tetapi frontend belum ada — menu "Department" di sidebar sudah aktif namun rute `/departments` belum dibuat (klik → 404). Di sisi data, aturan manager belum konsisten: `manager_id` diterima tanpa validasi, respons tidak menyertakan nama manager, dan saat manager dinonaktifkan referensi department menggantung.

## What Changes

- **Frontend modul department** (baru): halaman list `/departments` + dialog create/edit/delete, data fetching via TanStack Query.
- **RBAC frontend**: STAFF dan HRD sama-sama bisa melihat department; aksi CRUD hanya untuk HRD.
- **Aturan manager disederhanakan**: manager boleh karyawan mana pun, asalkan ada dan berstatus `ACTIVE` (tidak harus satu department).
- **Respons department menyertakan nama manager** (`manager_id` + `manager_name` hasil join) — berlaku untuk semua role.
- **Konsistensi saat deaktivasi**: `deactivateEmployee` otomatis mengosongkan `departments.manager_id` yang menunjuk karyawan nonaktif tersebut.
- **Tanpa halaman detail**: cukup list + dialog; data keanggotaan karyawan akan dilayani modul employee di masa depan.

## Capabilities

### New Capabilities
- `department-management-ui`: UI manajemen department di sisi client — list, dialog create/edit, konfirmasi hapus, dan masking aksi berdasarkan role.

### Modified Capabilities
- `department-management`: aturan manager (bebas + wajib `ACTIVE`), respons menyertakan `manager_name`, dan tolok ukur aksi frontend.
- `employee-management`: deaktivasi karyawan juga mengosongkan `departments.manager_id` yang menunjuk karyawan tersebut.

## Impact

**Server (`server/`)**
- `services/department.service.ts` — validasi manager (exists + ACTIVE), join nama manager di respons.
- `services/employee.service.ts` — bersihkan `departments.manager_id` saat deaktivasi.
- Spesifikasi OpenSpec `department-management` & `employee-management` diperbarui (delta).

**Client (`client/`)**
- Fitur baru `features/departments/` (api, hooks, komponen) + rute `routes/_app/departments/index.tsx`.
- Dependency baru `@tanstack/react-query` (dan query client di root ap).
- `features/shell/navigation.tsx` — item "Department" tanpa filter role (terlihat semua role).

**Dokumentasi**
- Delta specs + sinkronisasi ke `openspec/specs/` saat apply.