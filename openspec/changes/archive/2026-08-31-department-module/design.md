## Context

Backend modul department sudah lengkap: schema `departments`, CRUD di `department.controller.ts` + `department.service.ts`, proteksi `authGuard` + `rbacGuard(["HRD"])`, serta unit test (Vitest — sudah terpasang di `server/`). Frontend belum memiliki modul department: menu sidebar "Department" sudah aktif mengarah ke `/departments` namun rute tersebut belum ada. Aturan bisnis manager juga belum konsisten — `manager_id` diterima tanpa validasi dan respons tidak menyertakan nama manager.

Keputusan produk yang sudah disepakati: form berbentuk dialog (bukan halaman detail), manager boleh karyawan mana pun asal berstatus `ACTIVE`, STAFF boleh melihat department namun aksi CRUD hanya HRD, data fetching memakai TanStack Query, dan deaktivasi karyawan mengosongkan `departments.manager_id` yang menunjuk karyawan tersebut.

## Goals / Non-Goals

**Goals:**
- Frontend modul department: halaman list `/departments` + dialog create/edit + konfirmasi hapus.
- Backend: validasi manager (exists + ACTIVE), respons menyertakan `manager_name`, deaktivasi membersihkan referensi manager.
- Kontrak spesifikasi `department-management`, `employee-management`, dan kapabilitas baru `department-management-ui`.

**Non-Goals:**
- Halaman detail department `/departments/:id` — data keanggotaan karyawan akan dilayani modul employee.
- Konstrain FK di DB untuk `manager_id` — cukup validasi di service (menghindari migrasi).
- Endpoint baru `GET /employees?department_id` — dropdown manager memakai `GET /employees` + filter client-side.
- UI modul employee — berada di luar cakupan change ini.

## Decisions

### 1. TanStack Query sebagai lapisan data fetching
`@tanstack/react-query` ditambahkan (dependency production). `QueryClientProvider` dipasang sekali di root. Keputusan ini diambil karena modul ini (dan modul berikutnya: employee, cuti, absensi) banyak memakai data server list + mutation + kebutuhan invalidasi setelah aksi — pola yang dikerjakan manual dengan `useEffect` akan berulang dan rawan stale.

**Alternatif yang ditolak**: tetap `useEffect` + state lokal (meniru pola sesi) — cukup untuk satu halaman namun tidak memberi cache/invalidasi lintas modul; Zustand — tepat untuk client-state (auth), bukan server-state.

### 2. Struktur fitur mengikuti pola `features/*`
Fitur ditaruh di `client/src/features/departments/` (api + hooks + komponen) dan rute di `client/src/routes/_app/departments/index.tsx` — konsisten dengan `features/auth`, `features/shell`, dan layout `_app`. Item navigasi "Department" di `features/shell/navigation.tsx` diubah: hapus `roles: ["HRD"]` agar terlihat semua role, dengan aksi CRUD dimasking oleh `role` dari `useAuthStore`.

### 3. Validasi manager di service (bukan DB constraint)
`department.service` memeriksa `manager_id` (jika diisi) dengan query ke `employees`: karyawan harus ada dan `status = "ACTIVE"`. TIDAK menambahkan FK di schema — `manager_id` tetap UUID longgar, sehingga tidak ada migrasi/alter tabel.

**Alternatif yang ditolak**: tambah `REFERENCES` + migrasi — lebih ketat tetapi menyentuh struktur tabel dan menambah langkah `db:generate`/`db:migrate` tanpa manfaat nyata untuk aturan yang juga bergantung pada status `ACTIVE` (FK tidak bisa mengungkapkan itu).

### 4. Join nama manager untuk semua respons department
Dengan Drizzle, query `select` pada list/detail memakai `leftJoin` dari `departments` ke `employees` (kunci: `employees.id = departments.manager_id`) lalu memproyeksikan `manager_name` (dan tetap `manager_id`). `manager_name` bernilai `null` bila tanpa manager. Perubahan ini menyentuh `createDepartment`, `updateDepartment`, `getDepartmentById`, `listDepartments` — seluruhnya mengembalikan bentuk data yang sama.

### 5. Pembersihan manager saat deaktivasi
Di `employee.service.deactivateEmployee`, setelah update status, jalankan `db.transaction` yang juga melakukan `UPDATE departments SET manager_id = NULL, updated_at = now() WHERE manager_id = <id>`. Dipilih `transaction` agar status karyawan dan pembersihan manager tidak terpisah sebagian.

### 6. Sumber data dropdown manager via `GET /employees`
Dialog (hanya dibuka HRD) memakai query employees (HRD-only, `rbacGuard` sudah di backend) dan memfilter `status === "ACTIVE"` di client. Query employees di-fetch saat dialog dibuka (bukan sejak halaman dimuat) agar tidak boros untuk pandangan read-only.

### 7. Strategi query key & invalidasi
- `["departments"]` → list.
- Mutation post/patch/delete → `invalidateQueries({ queryKey: ["departments"] })`.
- Query employees tetap terpisah (`["employees"]`) dan tidak di-invalidate oleh mutation department.

### 8. Unit test backend diperbarui
Vitest sudah ada di `server/` (`npm test --prefix server`). `department.service.test.ts` dan `employee.service.test.ts` dimutakhirkan: validasi manager ditolak/tidak ada/nonaktif, bentuk respons `manager_name`, dan pembersihan `manager_id` saat deaktivasi (mengikuti pola mock builder yang sudah ada).

## Risks / Trade-offs

- **`manager_id` dapat melenceng bila data diubah langsung di DB** (bukan lewat service) → Mitigasi: seluruh akses tulis melewati service; dokumentasikan di spec bahwa validasi berlapis service.
- **Menambah dependency `@tanstack/react-query`** → Mitigasi: dipakai sebagai lapisan standar server-state untuk modul berikutnya; setup QueryClient sekali di root.
- **STAFF melihat nama manager (respons join)** → Trade-off yang disepakati (directory organisasi); tidak ada operasi sensitif lain yang terekspos.
- **Response shape backend berubah (`manager_name` ditambahkan)** → Ini perubahan kontrak API; frontend lama belum ada, sehingga tidak ada konsumen yang rusak. Dokumentasikan sebagai delta di spec.
- **Kombinasi dialog create dengan manager** → Sesuai aturan "manager bebas", create boleh langsung set manager; backend harus memvalidasi ACTIVE sehingga tidak ada window sepatu sial.

## Migration Plan

1. **Backend dulu** (`server/`): validasi manager di service, join `manager_name`, pembersihan pada `deactivateEmployee`, perbarui unit test, regen Swagger (`npm run docs --prefix server`).
2. **Frontend** (`client/`): pasang `@tanstack/react-query`, pasang QueryClient di root, buat `features/departments`, rute list, dialog, ubah navigasi.
3. **Verifikasi** di root: `npm run lint && npm run typecheck && npm run build`.
4. **Spec**: sinkronisasi delta ke main specs saat apply/archive.

## Open Questions

- Apakah tabel list perlu kolom jumlah anggota department? Saat ini tidak (diputuskan cukup nama + manager + tanggal); bisa ditambah belakangan tanpa mengubah kontrak besar.
- Haruskah `AGENTS.md` (catatan "test runner belum terpasang") diperbarui karena Vitest sudah ada? Disarankan ikut dibenahi sebagai bagian housekeeping di tasks.