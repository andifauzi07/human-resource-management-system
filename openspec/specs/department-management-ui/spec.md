# Department Management UI

## Capability Overview

Antarmuka manajemen department di sisi client, mencakup daftar, CRUD via dialog, dan RBAC tampilan.

## Requirements

### Requirement: Query client TanStack Query di root aplikasi

Client MUST menyediakan `QueryClientProvider` (TanStack Query) yang membungkus seluruh aplikasi, dengan satu `QueryClient` di tingkat root (setelah restore sesi). Dependency `@tanstack/react-query` merupakan dependency production.

#### Scenario: Provider ada di root

- **WHEN** aplikasi dirender
- **THEN** `QueryClientProvider` melingkupi seluruh route sehingga hook `useQuery`/`useMutation` tersedia di semua modul

### Requirement: Halaman list department

Client MUST memiliki route file-based `/departments` (`routes/_app/departments/index.tsx`) yang menampilkan tabel daftar department: kolom nama, nama manager (dari `manager_name`; kosong → "—"), dan tanggal dibuat. Data diambil dengan TanStack Query via `apiFetch` ke `GET /departments`. Selama pemuatan, tabel memperlihatkan placeholder (skeleton); kegagalan memuat menampilkan pesan error.

#### Scenario: Pemuatan daftar

- **WHEN** HRD atau STAFF membuka `/departments`
- **THEN** tabel menampilkan daftar department dengan nama, manager (bila ada), dan tanggal dibuat setelah data terambil

#### Scenario: Sesi belum siap

- **WHEN** route dibuka sementara sesi sedang dipulihkan
- **THEN** halaman menunggu restore sesi selesai sebelum mengambil data (tidak memunculkan error 401 spuriously)

#### Scenario: Gagal memuat

- **WHEN** request `GET /departments` gagal
- **THEN** pesan error tampil di halaman dan pengguna dapat mencoba memuat ulang

### Requirement: RBAC tampilan frontend

Menu "Department" di sidebar MUST terlihat oleh semua role yang sudah login (STAFF dan HRD) — tidak lagi dibatasi HRD. Pada halaman list, tombol aksi (tambah, edit, hapus) MUST ditampilkan hanya untuk role `HRD`; STAFF hanya melihat data read-only tanpa elemen aksi. Pembatasan di sisi tampilan TIDAK menggantikan otorisasi di backend (mutasi tetap dijaga `rbacGuard(["HRD"])`).

#### Scenario: Menu terlihat untuk semua role

- **WHEN** pengguna STAFF login dan membuka sidebar
- **THEN** item "Department" muncul dan dapat dinavigasi

#### Scenario: STAFF tidak melihat aksi

- **WHEN** STAFF membuka `/departments`
- **THEN** tabel read-only tanpa tombol tambah/edit/hapus

#### Scenario: HRD melihat aksi

- **WHEN** HRD membuka `/departments`
- **THEN** tombol "Tambah Department" tersedia dan tiap baris memiliki aksi edit/hapus

### Requirement: Dialog buat dan ubah department

Create dan update MUST memakai dialog (bukan halaman terpisah), dibuka dari tombol "Tambah Department" (create) atau aksi per baris (edit). Dialog berisi field: nama department (wajib, maks 100 karakter) dan manager (opsional, dropdown semua karyawan berstatus `ACTIVE` dari `GET /employees`). Submit memanggil mutation `POST /departments` atau `PATCH /departments/:id`; sukses menutup dialog, memunculkan toast, dan menyegarkan daftar (invalidate query). Validasi memakai schema Zod (paralel dengan skema di backend).

#### Scenario: Nama wajib

- **WHEN** dialog create disubmit dengan nama kosong
- **THEN** pesan validasi muncul dan request tidak dikirim

#### Scenario: Nama duplikat dari server

- **WHEN** server menolak 400 karena nama department sudah ada
- **THEN** pesan dari envelope API ditampilkan di dialog dan dialog tetap terbuka

#### Scenario: Manager dari semua karyawan ACTIVE

- **WHEN** dialog edit dibuka dan ditekan dropdown manager
- **THEN** pilihan menampilkan seluruh karyawan berstatus `ACTIVE` (tanpa filter department) serta opsi kosonguntuk menghapus manager

#### Scenario: Create sukses

- **WHEN** dialog create disubmit valid dan server berhasil membuat department
- **THEN** dialog tertutup, toast sukses tampil, daftar department diperbarui

#### Scenario: Update sukses

- **WHEN** dialog edit disubmit valid dan server berhasil memperbarui department
- **THEN** dialog tertutup, toast sukses tampil, daftar department diperbarui

### Requirement: Konfirmasi hapus department

Hapus department MUST melalui dialog konfirmasi yang menjelaskan konsekuensinya. Konfirmasi memanggil mutation `DELETE /departments/:id`; sukses menutup dialog, toast sukses, dan invalidate daftar. Apabila department masih memiliki karyawan, server menolak dengan 400 dan pesan tersebut ditampilkan (dialog tetap terbuka).

#### Scenario: Hapus sukses

- **WHEN** HRD mengkonfirmasi hapus department tanpa karyawan
- **THEN** department hilang dari daftar dan toast sukses muncul

#### Scenario: Hapus ditolak karena berisi karyawan

- **WHEN** HRD mengkonfirmasi hapus department yang masih memiliki karyawan
- **THEN** pesan 400 dari server ("masih memiliki karyawan") ditampilkan dan department tetap ada

#### Scenario: Batal konfirmasi

- **WHEN** HRD membatalkan dialog konfirmasi
- **THEN** tidak ada request dikirim dan daftar tidak berubah
