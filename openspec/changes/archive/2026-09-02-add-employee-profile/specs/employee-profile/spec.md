# Employee Profile

## Capability Overview

Halaman profil karyawan: STAFF melihat & menyunting data pribadinya sendiri (self-service) melalui route `/profile`, dengan field inti (jabatan, gaji, tanggal gabung, department) bersifat read-only. Foto hanya berupa template avatar kotak dengan input upload disabled (integrasi S3 ditunda ke iterasi terpisah).

## Requirements

### Requirement: Halaman profil self-service untuk STAFF

Client MUST menyediakan halaman profil pada route `/profile` (`routes/_app/profile/`) bagi user dengan role STAFF, yang memuat data dari `GET /employees/mine` dan memungkinkan penyuntingan data pribadi melalui `PATCH /employees/mine`.

#### Scenario: STAFF membuka halaman profil

- **WHEN** user dengan role STAFF membuka `/profile`
- **THEN** halaman menampilkan data pribadinya (NIK, alamat, telepon, nama rekening, nomor rekening) beserta field inti read-only (jabatan, gaji pokok, tanggal gabung, department)

#### Scenario: STAFF menyimpan data pribadi

- **WHEN** STAFF mengubah nilai field pribadi (NIK, alamat, telepon, nomor/nama rekening) dan menyimpan
- **THEN** sistem mengirim `PATCH /employees/mine` dan profil diperbarui

### Requirement: Field inti read-only pada profil STAFF

Pada halaman profil STAFF, field `position`, `base_salary`, `join_date`, dan `department` SHALL ditampilkan dalam keadaan read-only dan TIDAK dapat disunting.

#### Scenario: Field inti tidak bisa diubah oleh STAFF

- **WHEN** user dengan role STAFF berada di halaman `/profile`
- **THEN** field jabatan, gaji, tanggal gabung, dan department tampil sebagai teks read-only tanpa kontrol edit

### Requirement: Validasi dan kewajiban field pribadi saat self-service

Pada penyuntingan profil (self-service STAFF maupun edit HRD), field `nik` dan `phone` SHALL bersifat wajib dan divalidasi (zod); field `address`, `bank_account_number`, dan `bank_account_name` bersifat opsional. NIK SHALL unik; duplikat ditolak dengan pesan kesalahan yang jelas.

#### Scenario: NIK atau telepon kosong saat menyimpan

- **WHEN** STAFF menyimpan profil dengan `nik` atau `phone` kosong
- **THEN** form menampilkan error validasi dan penyimpanan tidak dikirim

#### Scenario: NIK duplikat ditolak

- **WHEN** STAFF menyimpan `nik` yang sudah dipakai karyawan lain
- **THEN** sistem menolak simpanan (409) dan menampilkan pesan kesalahan

### Requirement: Template foto sebagai placeholder

Halaman profil SHALL menampilkan area foto sebagai avatar kotak (placeholder), dengan input/kontrol upload disajikan namun dalam keadaan disabled, sebagai template yang siap dimanfaatkan oleh integrasi upload S3 pada iterasi berikutnya.

#### Scenario: Area foto placeholder tampil

- **WHEN** user membuka halaman profil
- **THEN** area foto menampilkan avatar kotak default dan kontrol upload dalam keadaan disabled dengan label "Segera hadir"

### Requirement: Item Profil di topbar aktif untuk semua role

Item dropdown "Profil" di topbar (fungsi Topbar) SHALL aktif dan mengarahkan ke `/profile` untuk semua role yang sudah login (STAFF dan HRD), menggantikan keadaan disabled sebelumnya.

#### Scenario: Profil dapat diakses dari topbar

- **WHEN** user dengan role STAFF atau HRD klik item "Profil" di dropdown topbar
- **THEN** user diarahkan ke `/profile`
