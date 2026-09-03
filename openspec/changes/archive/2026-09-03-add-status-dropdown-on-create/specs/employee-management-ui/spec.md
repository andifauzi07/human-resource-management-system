# Employee Management UI

## MODIFIED Requirements

### Requirement: CRUD lengkap untuk HRD
Client MUST menyediakan bagi HRD operasi create, edit, nonaktifkan (soft delete), dan reset-password melalui dialog, dengan data department untuk dropdown diambil dari `GET /departments`. Dialog create DAN edit menampilkan 6 field inti: nama, department, jabatan, status, gaji, tanggal gabung. Field pribadi (NIK, telepon, alamat, data rekening) TIDAK ditampilkan di dialog edit; HRD mengakses field pribadi melalui halaman detail `/employees/:id`.

#### Scenario: HRD membuat karyawan baru
- **WHEN** HRD mengklik "Tambah Karyawan", mengisi nama, department (dropdown), jabatan, status (dropdown, default PROBATION), gaji pokok, dan tanggal gabung, lalu menyimpan
- **THEN** sistem mengirim `POST /employees` dengan field `status` yang dipilih dan menampilkan modal kredensial sekali pakai

#### Scenario: HRD membuat karyawan baru tanpa memilih status
- **WHEN** HRD membuat karyawan baru tanpa mengubah dropdown status (tetap default PROBATION)
- **THEN** sistem mengirim `POST /employees` tanpa field `status` dan karyawan dibuat dengan status `PROBATION`

#### Scenario: HRD mengedit karyawan
- **WHEN** HRD memilih aksi "Ubah" pada satu baris, mengubah field inti (nama, department, jabatan, status, gaji, tanggal gabung) pada dialog, lalu menyimpan
- **THEN** sistem mengirim `PATCH /employees/:id` hanya dengan field inti yang diubah dan daftar diperbarui

#### Scenario: HRD mengedit karyawan tanpa field pribadi di dialog
- **WHEN** HRD membuka dialog "Ubah Karyawan" dari tabel
- **THEN** dialog menampilkan 6 field inti (nama, department, jabatan, status, gaji, tanggal gabung) tanpa section "Data Pribadi"

#### Scenario: HRD mengubah status karyawan via dialog edit
- **WHEN** HRD membuka dialog edit, mengubah dropdown status ke nilai lain, dan menyimpan
- **THEN** sistem mengirim `PATCH /employees/:id` dengan field `status` baru dan status karyawan diperbarui

#### Scenario: HRD menonaktifkan karyawan
- **WHEN** HRD memilih aksi "Nonaktifkan" dan mengonfirmasi pada dialog
- **THEN** sistem mengirim `DELETE /employees/:id` dan status karyawan menjadi `RESIGNED`

#### Scenario: HRD me-reset password
- **WHEN** HRD memilih aksi "Reset Password" dan mengonfirmasi
- **THEN** sistem mengirim `POST /employees/:id/reset-password` dan menampilkan modal kredensial baru sekali pakai
