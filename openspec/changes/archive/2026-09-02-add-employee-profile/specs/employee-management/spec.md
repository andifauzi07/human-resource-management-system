# Employee Management

## ADDED Requirements

### Requirement: Kolom data pribadi pada skema employees

Skema tabel `employees` SHALL menambah kolom nullable: `nik` (identifier unik, bersifat `UNIQUE`), `address`, `bank_account_number`, `bank_account_name`, dan `phone`. Kolom-kolom ini TIDAK diisi saat create; diisi melalui self-service STAFF atau edit HRD. Field inti (`full_name`, `department_id`, `position`, `base_salary`, `join_date`, `status`) tidak berubah kontraknya.

#### Scenario: Kolom pribadi tersedia di response profil

- **WHEN** HRD memanggil `GET /employees/:id` atau user memanggil `GET /employees/mine`
- **THEN** response menyertakan `nik`, `address`, `bank_account_number`, `bank_account_name`, `phone` (nilai null bila belum diisi)

### Requirement: Default tanggal bergabung saat create

Saat `POST /employees`, apabila `join_date` tidak dikirim, sistem SHALL menggunakan tanggal hari ini sebagai nilai `join_date`.

#### Scenario: Create tanpa tanggal gabung

- **WHEN** HRD membuat karyawan tanpa mengirim `join_date`
- **THEN** `join_date` disimpan sebagai tanggal hari ini

### Requirement: Self-service update profil sendiri

Sistem SHALL menyediakan endpoint `PATCH /employees/mine` yang dilindungi `authGuard` (semua role), yang memperbarui data pribadi karyawan milik user yang terautentikasi (`nik`, `address`, `bank_account_number`, `bank_account_name`, `phone`). Field inti (`position`, `base_salary`, `join_date`, `department_id`) TIDAK dapat diubah melalui endpoint ini.

#### Scenario: STAFF memperbarui data pribadi sendiri

- **WHEN** user yang terautentikasi memanggil `PATCH /employees/mine` dengan field pribadi
- **THEN** hanya field pribadi miliknya yang diperbarui, dan field inti tidak berubah

#### Scenario: Field inti ditolak pada self-service

- **WHEN** user mengirim `position`, `base_salary`, `join_date`, atau `department_id` ke `PATCH /employees/mine`
- **THEN** field tersebut ditolak/diabaikan sehingga field inti tetap di bawah otoritas HRD

### Requirement: Update profil lengkap oleh HRD

Endpoint `PATCH /employees/:id` (dilindungi `rbacGuard(["HRD"])`) SHALL diperluas agar menerima field pribadi tambahan (`nik`, `address`, `bank_account_number`, `bank_account_name`, `phone`) selain field inti yang sudah ada. Validasi `nik`/`phone` wajib saat disertakan, dan `nik` unik.

#### Scenario: HRD memperbarui field pribadi karyawan

- **WHEN** HRD memanggil `PATCH /employees/:id` dengan field pribadi dan/atau inti
- **THEN** seluruh field yang dikirim diperbarui, termasuk kolom pribadi

## MODIFIED Requirements

### Requirement: RBAC Matrix

Sistem SHALL menerapkan hak akses sebagai berikut: STAFF dapat menyunting data pribadinya sendiri melalui `PATCH /employees/mine`, sedangkan penyuntingan field inti dan juga penyuntingan karyawan lain tetap khusus HRD.

#### Scenario: STAFF mengubah data pribadi sendiri

- **WHEN** user dengan role STAFF memanggil `PATCH /employees/mine`
- **THEN** perubahan data pribadinya sendiri berhasil

#### Scenario: STAFF tidak dapat mengubah karyawan lain

- **WHEN** user dengan role STAFF mencoba memanggil `PATCH /employees/:id`
- **THEN** sistem menolak (403) karena endpoint khusus HRD

## ADDED Requirements

### Requirement: Penanganan NIK unik pada service layer

Service lapisan employee SHALL menangkap pelanggaran `UNIQUE` pada kolom `nik` dan menerjemahkannya menjadi error 409 dengan pesan yang jelas (konflik).

#### Scenario: NIK yang sudah ada ditolak

- **WHEN** simpanan berisi `nik` yang sudah dimiliki karyawan lain
- **THEN** sistem mengembalikan 409 dengan pesan bahwa NIK sudah terdaftar
