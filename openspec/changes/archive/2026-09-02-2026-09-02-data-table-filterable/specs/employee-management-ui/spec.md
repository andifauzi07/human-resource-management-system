## ADDED Requirements

### Requirement: Tabel karyawan HRD memakai `DataTable` dengan search/filter/sort/pagination

Tabel karyawan untuk HRD MUST menggunakan pattern `DataTable` dengan kolom: nama (teks, sortable, ikut search), jabatan (teks, sortable, ikut search), department (kategorikal, filterable), status (kategorikal, filterable), dan aksi (action). Search aktif, pagination aktif, dan urutan default descending oleh `created_at`.

#### Scenario: HRD mencari karyawan
- **WHEN** HRD mengetik di input search tabel karyawan
- **THEN** hasil difilter berdasarkan nama atau jabatan (teks) secara case-insensitive

#### Scenario: HRD memfilter department
- **WHEN** HRD membuka dropdown filter kolom department dan memilih satu nilai
- **THEN** hanya karyawan dari department tersebut yang tampil

#### Scenario: HRD memfilter status
- **WHEN** HRD membuka dropdown filter kolom status dan memilih nilai (mis. "Aktif"/"Nonaktif")
- **THEN** hanya karyawan dengan status tersebut yang tampil

#### Scenario: HRD mengurutkan nama/jabatan
- **WHEN** HRD mengklik header kolom nama atau jabatan
- **THEN** baris diurutkan sesuai abjad naik/turun

#### Scenario: HRD membagi halaman
- **WHEN** jumlah karyawan melebihi ukuran halaman
- **THEN** hasil dibagi ke beberapa halaman dengan pemilih ukuran 10/25/50

## MODIFIED Requirements

### Requirement: Daftar STAFF read-only tanpa detail

Sistem SHALL menampilkan kepada STAFF hanya nama dan jabatan anggota se-department (data dari `GET /api/v1/employees`), tanpa tombol create/edit/deactivate/reset-password, dan tanpa jalur menuju detail karyawan. Daftar STAFF TIDAK dilengkapi search, filter, sort, maupun pagination — karena satu department hanya berisi beberapa pegawai, daftar ditampilkan apa adanya dalam bentuk list (`<ul>`).

#### Scenario: STAFF melihat daftar anggota
- **WHEN** halaman employee STAFF memuat daftar dari `GET /api/v1/employees`
- **THEN** setiap baris menampilkan `full_name` dan `position`, dan baris tidak dapat diklik menuju detail

#### Scenario: STAFF tidak memiliki aksi CRUD
- **WHEN** user dengan role STAFF berada di halaman employee
- **THEN** tidak ada tombol tambah karyawan, edit, nonaktifkan, ataupun reset password yang dirender

#### Scenario: Daftar STAFF tanpa fitur pengolahan
- **WHEN** user dengan role STAFF berada di halaman employee
- **THEN** daftar anggota ditampilkan polos sebagai list, tanpa input search, tanpa filter, tanpa sort, dan tanpa pagination
