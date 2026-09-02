# Employee Management UI

## Capability Overview

Antarmuka manajemen karyawan di sisi client: satu halaman `/employees` yang berpindah wujud berdasarkan role — STAFF melihat daftar read-only (nama + jabatan) anggota se-department, HRD melihat tabel lengkap dengan CRUD.

## Requirements

### Requirement: Halaman daftar karyawan berbasis role
Client MUST menyediakan satu halaman `Employee` di rute `/employees` (`routes/_app/employees/index.tsx`) yang merender tampilan berbeda berdasarkan role user yang terautentikasi: STAFF memperoleh daftar read-only, HRD memperoleh tabel lengkap dengan kemampuan CRUD.

#### Scenario: HRD membuka halaman karyawan
- **WHEN** user dengan role HRD membuka `/employees`
- **THEN** halaman menampilkan tabel karyawan dengan kolom nama, jabatan, department, status, dan menu aksi per baris

#### Scenario: STAFF membuka halaman karyawan
- **WHEN** user dengan role STAFF membuka `/employees`
- **THEN** halaman menampilkan daftar nama dan jabatan anggota se-department tanpa kolom aksi dan tanpa interaksi menuju detail

### Requirement: Daftar STAFF read-only tanpa detail
Client MUST menampilkan kepada STAFF hanya nama dan jabatan anggota se-department (data dari `GET /employees`), tanpa tombol create/edit/deactivate/reset-password, dan tanpa jalur menuju detail karyawan.

#### Scenario: STAFF melihat daftar anggota
- **WHEN** halaman employee STAFF memuat daftar dari `GET /employees`
- **THEN** setiap baris menampilkan `full_name` dan `position`, dan baris tidak dapat diklik menuju detail

#### Scenario: STAFF tidak memiliki aksi CRUD
- **WHEN** user dengan role STAFF berada di halaman employee
- **THEN** tidak ada tombol tambah karyawan, edit, nonaktifkan, ataupun reset password yang dirender

### Requirement: Badge department pada tampilan STAFF
Client MUST menampilkan nama department pada header halaman employee untuk STAFF, diambil dari `GET /employees/mine` (objek `department.name`), karena response list STAFF tidak menyertakan department.

#### Scenario: Header menampilkan nama department STAFF
- **WHEN** user dengan role STAFF membuka `/employees`
- **THEN** header menampilkan nama department miliknya (mis. "Dept. Engineering") dari profil `mine`

### Requirement: CRUD lengkap untuk HRD
Client MUST menyediakan bagi HRD operasi create, edit, nonaktifkan (soft delete), dan reset-password melalui dialog, dengan data department untuk dropdown diambil dari `GET /departments`.

#### Scenario: HRD membuat karyawan baru
- **WHEN** HRD mengklik "Tambah Karyawan", mengisi nama, department (dropdown), jabatan, gaji pokok, dan tanggal gabung, lalu menyimpan
- **THEN** sistem mengirim `POST /employees` dan menampilkan modal kredensial sekali pakai

#### Scenario: HRD mengedit karyawan
- **WHEN** HRD memilih aksi "Ubah" pada satu baris dan menyimpan perubahan
- **THEN** sistem mengirim `PATCH /employees/:id` dan daftar diperbarui

#### Scenario: HRD menonaktifkan karyawan
- **WHEN** HRD memilih aksi "Nonaktifkan" dan mengonfirmasi pada dialog
- **THEN** sistem mengirim `DELETE /employees/:id` dan status karyawan menjadi `INACTIVE`

#### Scenario: HRD me-reset password
- **WHEN** HRD memilih aksi "Reset Password" dan mengonfirmasi
- **THEN** sistem mengirim `POST /employees/:id/reset-password` dan menampilkan modal kredensial baru sekali pakai

### Requirement: Modal kredensial sekali pakai
Client MUST menampilkan email dan password hasil `POST /employees` maupun reset-password di dalam modal khusus dengan tombol salin, karena kredensial hanya dikembalikan satu kali oleh backend.

#### Scenario: Kredensial tampil setelah create
- **WHEN** HRD menyelesaikan pembuatan karyawan dan backend mengembalikan `{ email, password }`
- **THEN** modal menampilkan email dan password dengan aksi salin, dan karyawan sudah masuk ke daftar

#### Scenario: Kredensial tampil setelah reset
- **WHEN** HRD menyelesaikan reset password dan backend mengembalikan `{ email, password }`
- **THEN** modal menampilkan email dan password baru dengan aksi salin

### Requirement: Navigasi employee tersedia untuk semua role
Menu "Karyawan" di sidebar MUST terlihat oleh semua role yang sudah login (STAFF dan HRD), dengan aksi CRUD dimasking di dalam halaman berdasarkan role. Pembatasan di sisi tampilan TIDAK menggantikan otorisasi di backend (mutasi tetap dijaga `rbacGuard(["HRD"])`).

#### Scenario: Menu terlihat oleh STAFF
- **WHEN** user dengan role STAFF login
- **THEN** sidebar menampilkan item "Karyawan" yang mengarah ke `/employees`

#### Scenario: Menu terlihat oleh HRD
- **WHEN** user dengan role HRD login
- **THEN** sidebar menampilkan item "Karyawan" yang mengarah ke `/employees`