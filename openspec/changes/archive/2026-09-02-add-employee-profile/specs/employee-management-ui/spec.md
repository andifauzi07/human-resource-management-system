# Employee Management UI

## ADDED Requirements

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
