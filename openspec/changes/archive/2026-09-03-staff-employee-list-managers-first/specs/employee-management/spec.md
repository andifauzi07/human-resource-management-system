## MODIFIED Requirements

### Requirement: Daftar STAFF read-only tanpa detail
Sistem SHALL menampilkan kepada STAFF hanya nama, jabatan, dan tanggal gabung (`join_date`) anggota se-department (data dari `GET /api/v1/employees`), tanpa tombol create/edit/deactivate/reset-password, dan tanpa jalur menuju detail karyawan. Daftar STAFF TIDAK dilengkapi search, filter, maupun pagination — karena satu department hanya berisi beberapa pegawai, daftar ditampilkan apa adanya dalam bentuk list (`<ul>`).

#### Scenario: STAFF melihat daftar anggota
- **WHEN** halaman employee STAFF memuat daftar dari `GET /api/v1/employees`
- **THEN** setiap baris menampilkan `full_name`, `position`, dan `join_date`, dan baris tidak dapat diklik menuju detail

#### Scenario: STAFF tidak memiliki aksi CRUD
- **WHEN** user dengan role STAFF berada di halaman employee
- **THEN** tidak ada tombol tambah karyawan, edit, nonaktifkan, ataupun reset password yang dirender

#### Scenario: Daftar STAFF tanpa fitur pengolahan
- **WHEN** user dengan role STAFF berada di halaman employee
- **THEN** daftar anggota ditampilkan polos sebagai list, tanpa input search, tanpa filter, dan tanpa pagination
