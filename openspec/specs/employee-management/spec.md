# Employee Management

## Capability Overview

Kelola data karyawan HRIS: CRUD employee, auto-generate email/password, soft delete, dan password reset oleh HRD. Hak akses employee dibagi per role: HRD melihat semua karyawan dengan seluruh field, STAFF hanya melihat daftar (nama + jabatan) anggota se-department.

## Endpoints

| Method | Endpoint | Authorization | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/employees` | HRD | Buat karyawan + auto user account |
| GET | `/api/v1/employees` | HRD (all, field penuh), STAFF (same dept, `{ id, full_name, position }` saja) | Lihat daftar karyawan |
| GET | `/api/v1/employees/mine` | All | Lihat profil sendiri (field penuh + department, termasuk field pribadi) |
| PATCH | `/api/v1/employees/mine` | All | Update data pribadi sendiri (self-service; field inti ditolak) |
| GET | `/api/v1/employees/:id` | HRD | Lihat detail karyawan |
| PATCH | `/api/v1/employees/:id` | HRD | Update karyawan (field inti + field pribadi) |
| DELETE | `/api/v1/employees/:id` | HRD | Nonaktifkan karyawan (soft delete) |
| POST | `/api/v1/employees/:id/reset-password` | HRD | Reset password karyawan |

## Business Rules

1. Email auto-generated dari `full_name` → `john.doe@company.com`
2. Password auto-generated (12+ chars), plain text hanya di response create/reset
3. User account dibuat otomatis dengan role STAFF saat create employee
4. STAFF hanya dapat melihat daftar karyawan di department yang sama, dan hanya menerima field `id`, `full_name`, `position` (tanpa `base_salary`, `status`, `join_date`, maupun objek `department`)
5. Field `position` SHALL diimplementasikan sebagai enum dengan nilai `STAFF` dan `MANAGER` di level database, bukan free-text varchar. Nilai default saat pembuatan karyawan adalah `STAFF`.
6. Field `status` karyawan SHALL mengikuti salah satu dari nilai enum: `PROBATION`, `ACTIVE`, `ON_LEAVE`, atau `RESIGNED`. Nilai default saat pembuatan karyawan adalah `PROBATION`. Sistem SHALL menolak transisi `ACTIVE` → `PROBATION` karena status probation hanya boleh terjadi satu kali seumur hidup karyawan.
7. Saat soft delete (`DELETE /employees/:id`), status karyawan diubah menjadi `RESIGNED` dan `departments.manager_id` yang menunjuk ke karyawan tersebut di-set `null` di seluruh department. Sistem SHALL menolak deactivation untuk karyawan yang berstatus `MANAGER` (HRD harus mengganti manager department terlebih dahulu).
8. `GET /employees/:id` khusus HRD; STAFF mengakses profilnya sendiri hanya melalui `GET /employees/mine`
9. Objek `department: { id, name }` hasil JOIN disertakan pada response HRD untuk `GET /employees` dan `GET /employees/:id`, serta pada `GET /employees/mine` untuk semua role. Response list STAFF (`GET /employees`) TIDAK menyertakannya.
10. Kolom pribadi pada `employees` (`nik`, `address`, `bank_account_number`, `bank_account_name`, `phone`) bersifat nullable dan tidak diisi saat create; diisi melalui self-service STAFF (`PATCH /employees/mine`) atau edit HRD (`PATCH /employees/:id`). `nik` bersifat `UNIQUE`.
11. Pada `PATCH /employees/:id` maupun `PATCH /employees/mine`, saat `nik`/`phone` disertakan, keduanya wajib valid (`nik` unik, `phone` format valid) — namun keduanya tidak diwajibkan saat `POST /employees`.
12. Saat `POST /employees` tanpa `join_date`, sistem memakai tanggal hari ini sebagai nilai `join_date`.
13. `PATCH /employees/mine` hanya memperbarui field pribadi; field inti (`position`, `base_salary`, `join_date`, `department_id`) ditolak/diabaikan karena hanya HRD yang berwenang.
14. Pelanggaran `UNIQUE` pada `nik` (di endpoint mana pun) diterjemahkan service layer menjadi error 409 dengan pesan bahwa NIK sudah terdaftar.

## Requirements

### Requirement: Position sebagai enum
Field `position` karyawan SHALL diimplementasikan sebagai enum dengan nilai `STAFF` dan `MANAGER` di level database, bukan free-text varchar.

#### Scenario: Position valid
- **WHEN** HRD membuat atau mengubah karyawan dengan `position` berisi `STAFF` atau `MANAGER`
- **THEN** sistem menerima nilai tersebut

#### Scenario: Position tidak valid
- **WHEN** HRD membuat atau mengubah karyawan dengan `position` berisi nilai selain `STAFF`/`MANAGER`
- **THEN** sistem menolak request dengan error 400

### Requirement: Employee status lifecycle
Field `status` karyawan SHALL mengikuti salah satu dari nilai enum: `PROBATION`, `ACTIVE`, `ON_LEAVE`, atau `RESIGNED`. Nilai default saat pembuatan karyawan adalah `PROBATION`. Transisi status mengikuti aturan sebagai berikut:
- `PROBATION` → `ACTIVE` (otomatis setelah 3 bulan dari `join_date`, dihitung saat query)
- `PROBATION` → `RESIGNED`
- `ACTIVE` → `ON_LEAVE`
- `ACTIVE` → `RESIGNED`
- `ON_LEAVE` → `ACTIVE`
- `ON_LEAVE` → `RESIGNED`

Sistem SHALL menolak transisi `ACTIVE` → `PROBATION` karena status probation hanya boleh terjadi satu kali seumur hidup karyawan.

#### Scenario: Karyawan baru default PROBATION
- **WHEN** HRD membuat karyawan baru tanpa menentukan status
- **THEN** sistem men-set status karyawan ke `PROBATION`

#### Scenario: Auto-transisi PROBATION ke ACTIVE setelah 3 bulan
- **WHEN** sistem mengambil data karyawan yang berstatus `PROBATION` dan `join_date` sudah lebih dari 90 hari (3 bulan) dari tanggal hari ini
- **THEN** sistem secara otomatis mengubah status karyawan menjadi `ACTIVE` pada saat query tersebut

#### Scenario: Transisi PROBATION ke ACTIVE secara manual
- **WHEN** HRD mengubah status karyawan dari `PROBATION` menjadi `ACTIVE` dan karyawan belum melewati masa 3 bulan
- **THEN** sistem mengizinkan perubahan tersebut

#### Scenario: Menolak transisi ACTIVE kembali ke PROBATION
- **WHEN** HRD mengubah status karyawan yang berstatus `ACTIVE`, `ON_LEAVE`, atau `RESIGNED` menjadi `PROBATION`
- **THEN** sistem menolak request dengan error 400 dan pesan yang menjelaskan bahwa status probation hanya dapat terjadi satu kali

#### Scenario: Karyawan probation cuti
- **WHEN** karyawan yang berstatus `PROBATION` mencoba mengajukan cuti
- **THEN** sistem menolak pengajuan cuti dengan pesan bahwa karyawan probation belum boleh mengajukan cuti sebelum 3 bulan

#### Scenario: Transisi valid karyawan aktif cuti
- **WHEN** HRD atau sistem mengubah status karyawan dari `ACTIVE` menjadi `ON_LEAVE`
- **THEN** sistem mengubah status karyawan menjadi `ON_LEAVE`

### Requirement: Soft delete dan deactivation guard
Soft delete (`DELETE /employees/:id`) SHALL mengubah status karyawan menjadi `RESIGNED` dan men-set `departments.manager_id` yang menunjuk ke karyawan tersebut menjadi `null` di seluruh department. Sistem SHALL menolak deactivation untuk karyawan yang berstatus `MANAGER`.

#### Scenario: Deactivate karyawan STAFF (soft delete)
- **WHEN** HRD men-deactivate karyawan yang berstatus `STAFF` (bukan MANAGER)
- **THEN** sistem mengubah status karyawan menjadi `RESIGNED`

#### Scenario: Deactivate karyawan MANAGER (ditolak)
- **WHEN** HRD mencoba men-deactivate karyawan yang berstatus `MANAGER` atau menjadi manager di suatu department
- **THEN** sistem menolak request dengan error yang menjelaskan bahwa karyawan tersebut masih menjadi manager dan HRD perlu mengganti manager department terlebih dahulu

### Requirement: Auto-transition PROBATION saat query
Sistem SHALL menghitung transisi `PROBATION` → `ACTIVE` pada saat query (baik list maupun detail karyawan), berdasarkan `join_date` yang sudah lebih dari 90 hari dari hari ini.

#### Scenario: List karyawan memicu auto-transition
- **WHEN** sistem mengambil daftar karyawan dan ada karyawan berstatus `PROBATION` yang `join_date`-nya sudah melewati 90 hari
- **THEN** sistem mengubah status karyawan tersebut menjadi `ACTIVE` selama proses query

#### Scenario: Detail karyawan memicu auto-transition
- **WHEN** sistem mengambil detail karyawan yang berstatus `PROBATION` dan `join_date`-nya sudah melewati 90 hari
- **THEN** sistem mengubah status karyawan tersebut menjadi `ACTIVE` sebelum mengembalikan data

## RBAC Matrix

| Action | STAFF | HRD |
|--------|-------|-----|
| View own profile (`/employees/mine`) | ✅ | ✅ |
| Update own profile (`PATCH /employees/mine`, data pribadi) | ✅ | ✅ |
| View employees same dept (minimal fields) | ✅ | ✅ |
| View all employees any dept (full fields) | ❌ | ✅ |
| View employee detail by id | ❌ | ✅ |
| Create employee | ❌ | ✅ |
| Update employee (field inti atau karyawan lain) | ❌ | ✅ |
| Deactivate employee | ❌ | ✅ |
| Reset password | ❌ | ✅ |

## Error Responses

- 400: Invalid input (missing fields, negative salary, invalid date, `nik`/`phone` tidak valid, transisi status tidak valid)
- 403: STAFF tries to access employee in different department, `GET /employees/:id` oleh STAFF, atau `PATCH /employees/:id` oleh STAFF
- 404: Employee tidak ditemukan, profil karyawan tidak ditemukan (mine)
- 409: Email sudah terdaftar (nama duplikasi), atau NIK sudah terdaftar (`nik` duplikat), atau karyawan masih menjadi manager