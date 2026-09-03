## MODIFIED Requirements

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
