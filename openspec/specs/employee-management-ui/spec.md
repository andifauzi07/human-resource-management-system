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

### Requirement: Badge department pada tampilan STAFF
Client MUST menampilkan nama department pada header halaman employee untuk STAFF, diambil dari `GET /employees/mine` (objek `department.name`), karena response list STAFF tidak menyertakan department.

#### Scenario: Header menampilkan nama department STAFF
- **WHEN** user dengan role STAFF membuka `/employees`
- **THEN** header menampilkan nama department miliknya (mis. "Dept. Engineering") dari profil `mine`

### Requirement: CRUD lengkap untuk HRD
Client MUST menyediakan bagi HRD operasi create, edit, nonaktifkan (soft delete), dan reset-password melalui dialog, dengan data department untuk dropdown diambil dari `GET /departments`. Dialog edit HANYA menampilkan field inti (nama, department, jabatan, gaji, tanggal gabung) — SAMA dengan dialog create. Field pribadi (NIK, telepon, alamat, data rekening) TIDAK ditampilkan di dialog edit; HRD mengakses field pribadi melalui halaman detail `/employees/:id`.

#### Scenario: HRD membuat karyawan baru
- **WHEN** HRD mengklik "Tambah Karyawan", mengisi nama, department (dropdown), jabatan, gaji pokok, dan tanggal gabung, lalu menyimpan
- **THEN** sistem mengirim `POST /employees` dan menampilkan modal kredensial sekali pakai

#### Scenario: HRD mengedit karyawan
- **WHEN** HRD memilih aksi "Ubah" pada satu baris, mengubah field inti (nama, department, jabatan, gaji, tanggal gabung) pada dialog, lalu menyimpan
- **THEN** sistem mengirim `PATCH /employees/:id` hanya dengan field inti yang diubah dan daftar diperbarui

#### Scenario: HRD mengedit karyawan tanpa field pribadi di dialog
- **WHEN** HRD membuka dialog "Ubah Karyawan" dari tabel
- **THEN** dialog hanya menampilkan 5 field inti (nama, department, jabatan, gaji, tanggal gabung) tanpa section "Data Pribadi"

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

### Requirement: Halaman detail karyawan untuk HRD
Client MUST menyediakan halaman detail karyawan pada route `/employees/:id` (`routes/_app/employees/$id.tsx`) yang hanya diakses HRD, memuat data lengkap karyawan (termasuk field pribadi) dan memungkinkan edit seluruh field (inti + pribadi) melalui `PATCH /employees/:id`. Halaman ini bersifat TAMBAHAN terpisah; dialog "Ubah" pada tabel tetap dipertahankan.

#### Scenario: HRD membuka detail karyawan
- **WHEN** HRD mengarahkan ke `/employees/:id` untuk satu karyawan
- **THEN** halaman menampilkan field inti dan pribadi karyawan, serta kontrol untuk menyuntingnya

#### Scenario: HRD menyimpan perubahan dari halaman detail
- **WHEN** HRD mengubah field (inti dan/atau pribadi) pada halaman detail dan menyimpan
- **THEN** sistem mengirim `PATCH /employees/:id` dan detail diperbarui

### Requirement: Navigasi tabel karyawan menuju detail
Baris pada tabel karyawan HRD SHALL menyediakan jalur menuju halaman detail `/employees/:id` (mis. aksi atau klik baris), selain aksi dialog yang sudah ada.

#### Scenario: HRD berpindah dari tabel ke detail
- **WHEN** HRD memilih aksi "Detail"/mengklik baris pada tabel karyawan
- **THEN** user diarahkan ke `/employees/:id` untuk karyawan tersebut

### Requirement: Validasi & kewajiban field pribadi pada form
Pada form pembuatan/edit (dialog) maupun halaman detail HRD, field inti yang wajib tetap seperti semula; saat field pribadi (`nik`, `phone`) disertakan, field tersebut SHALL divalidasi dengan `nik` wajib unik dan `phone` wajib berformat valid. Dialog "Tambah Karyawan" TIDAK mengharuskan field pribadi.

#### Scenario: Menambah karyawan tanpa field pribadi
- **WHEN** HRD membuat karyawan baru hanya dengan field inti pada dialog tambah
- **THEN** karyawan berhasil dibuat tanpa membutuhkan NIK/telepon/rekening

#### Scenario: Field pribadi tidak valid ditolak pada edit
- **WHEN** HRD menyimpan edit dengan `nik`/`phone` tidak valid atau `nik` duplikat
- **THEN** form menampilkan error validasi dan penyimpanan tidak dikirim

### Requirement: Tampilan read-only field inti untuk STAFF
Permukaan UI yang menampilkan data karyawan untuk STAFF (halaman profil `/profile`) SHALL menampilkan field inti `position`, `base_salary`, `join_date`, dan `department` sebagai read-only, tanpa kontrol edit.

#### Scenario: STAFF melihat field inti sebagai read-only
- **WHEN** user dengan role STAFF membuka `/profile`
- **THEN** field jabatan, gaji, tanggal gabung, dan department tampil read-only sementara field pribadi dapat disunting