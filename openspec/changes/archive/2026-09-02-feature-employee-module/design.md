## Context

Backend modul employee sudah lengkap: schema (`employees`, `departments`, `users`), CRUD service, RBAC se-department, dan objek `department { id, name }` embedded di response (`withDepartmentProjection`, `employee.service.ts`). Frontend sudah memiliki modul department (`features/departments` + rute `/departments`) dengan pola TanStack Query, dan nav "Karyawan" (`features/shell/navigation.tsx`) masih `roles: ["HRD"]` tanpa rute.

Keputusan produk yang disepakati: STAFF hanya melihat daftar (nama + jabatan) anggota se-department secara read-only, tanpa akses detail; HRD memegang seluruh operasi tulis pada department dan employee. Batasan ini menuntut perubahan bentuk response backend (proyeksi per-role), bukan sekadar masking frontend.

## Goals / Non-Goals

**Goals:**
- Backend: `GET /employees` mengembalikan proyeksi per-role — STAFF hanya `{ id, full_name, position }`; HRD proyeksi penuh + `department`.
- Backend: `GET /employees/:id` dibatasi HRD-only; STAFF mengakses profil sendiri via `/employees/mine`.
- Client: satu halaman `/employees` dengan dua wujud UI per role (list read-only STAFF / tabel CRUD HRD).
- Client: modal kredensial sekali pakai untuk create & reset-password.

**Non-Goals:**
- Tidak menambahkan pagination/search/filter di backend (dataset kecil).
- Tidak menambah role baru (mis. MANAGER).
- Tidak mengubah CRUD department (sudah selesai di change sebelumnya).
- Tidak membangun halaman detail employee terpisah untuk STAFF.

## Decisions

### 1. Backend: proyeksi per-role di `listEmployees`
`listEmployees` memilih proyeksi berdasarkan role: HRD memakai `withDepartmentProjection` yang ada; STAFF memakai `select({ id, full_name, position })` setelah resolve department miliknya (`getUserDepartmentId`).

**Alternatif yang ditolak:**
- *Single shape + null mask* (`position`, `base_salary: null`) → field tetap terkirim (leak), bentuk "terlihat disembunyikan".
- *Query param `?fields=`* → conditional di service/controller dan konsumen dapat salah memilih.
Keputusan produk "hanya nama + jabatan" menuntut data tidak pernah meninggalkan server untuk STAFF.

### 2. Backend: `GET /employees/:id` HRD-only
Tambah `rbacGuard(["HRD"])` pada rute `GET /:id`, dan sederhanakan `getEmployeeById(id)` — hapus param `userRole`/`userId` dan semua branch 403 se-department. `getUserDepartmentId` tetap dipakai `listEmployees`. `getMine` (via `getEmployeeByUserId`) tetap untuk semua role dan mengembalikan profil penuh + department (data milik sendiri).

**Alternatif yang ditolak:** membiarkan akses se-department — tidak ada UI pemanggil dan inkonisten dengan keputusan produk.

### 3. Client: satu rute, dua wujud UI
`routes/_app/employees/index.tsx` membaca role dari `useAuthStore`:
- **STAFF** → daftar ringkas (nama + jabatan) dari `GET /employees`, badge department dari `GET /employees/mine`, tanpa aksi dan tanpa navigasi detail.
- **HRD** → tabel lengkap (nama, jabatan, department, status, aksi) + tombol "Tambah Karyawan".

**Alternatif yang ditolak:** dua rute terpisah per role — redundant; satu halaman berbeda wujud lebih sederhana dan memakai pola `filterNavForRole`/masking yang sudah ada di modul department.

### 4. Client: tipe canonical pindah ke `features/employees/types.ts`
Dua tipe: `EmployeeListItem = { id, full_name, position }` (STAFF) dan `Employee` (penuh, termasuk `department: { id, name } | null` dan `status`). `features/departments` (`useActiveEmployees`, dipakai dropdown manager — HRD-only) mengimpor tipe `Employee` dari sini dan tipe flat lama dihapus.

**Risiko:** keterkaitan antar-feature — dimitigasi karena pemanggil list hanya HRD (guard di dialog), dan bentuk penuh tetap dikembalikan server untuk HRD.

### 5. Client: sumber badge department STAFF
Header STAFF mengambil nama department dari `GET /employees/mine` (sudah ada, berisi `department.name`).

**Alternatif yang ditolak:** menyertakan `department` di response list STAFF (bertentangan dengan "hanya nama + jabatan"); tanpa badge (kehilangan konteks visual).

### 6. Query keys & cache
- `["employees"]` (list), `["employee-mine"]`; mutation employee (create/update/deactivate/reset) → invalidate `["employees"]`.
- Dropdown department di dialog HRD memakai `useDepartments()` dengan `enabled` saat dialog terbuka (mengikuti pola `useActiveEmployees`).
- Rename department membuat nama department embedded di cache employee menjadi stale → diterima; TanStack Query default `refetchOnWindowFocus` menyembuhkannya. Tidak menggandeng cache department ↔ employee (menghindari coupling antar-modul).

### 7. Modal kredensial sekali pakai
Response create/reset hanya mengembalikan plaintext password sekali. Setelah mutation sukses, tampilkan komponen modal khusus (mirip dialog yang sudah ada di modul department) berisi email + password + tombol salin, bukan toast.

## Risks / Trade-offs

- [Bentuk response per-role → dua tipe client + dokumentasi lebih berat] → Diterima: ruang lingkup kecil (2 field STAFF); Swagger/spec menerangkan dua bentuk.
- [Snapshot `department.name` di cache HRD stale setelah rename department] → Self-heal via `refetchOnWindowFocus`; tidak dibuat invalidasi silang.
- [Perubahan kontrak API (breaking: proyeksi STAFF + revoke detail)] → Sesuai AGENTS.md dikonfirmasi eksplisit; tidak ada konsumen client yang rusak karena modul employee baru dibuat.
- [`useActiveEmployees` / dialog manager bergantung bentuk penuh] → Dialog hanya dibuka HRD sehingga response penuh selalu didapat; tipe diimpor dari `features/employees`.
- [Karyawan nonaktif tetap muncul di daftar STAFF tanpa penanda status] → Sesuai keputusan produk (#4); tidak ada kolom status di tampilan STAFF.

## Migration Plan

1. **Backend dulu** (`server/`): proyeksi per-role di `listEmployees`, `rbacGuard(["HRD"])` di `GET /:id`, sederhanakan `getEmployeeById`, perbarui unit test, regen Swagger (`npm run docs --prefix server`).
2. **Client** (`client/`): tipe canonical → `features/employees/{types,api,schema,hooks}`, komponen dialog, rute `/employees`, update nav, update `features/departments` (import tipe + bentuk).
3. **Verifikasi** di root: `npm run lint && npm run typecheck && npm run build`.
4. **Spec**: sinkronisasi delta ke `openspec/specs/` saat apply.

Rollback: kembalikan service/controller/rute ke versi sebelumnya via git (tanpa migrasi DB — tidak ada perubahan skema).

## Open Questions

- Apakah daftar HRD perlu kolom "Jumlah Anggota" atau filter per department? Tidak untuk sekarang (non-goal), bisa ditambah belakangan tanpa perubahan kontrak.
- Tombol "Salin" kredensial memakai `navigator.clipboard` — perlu cek environment (http vs https) pada deploy Vercel.