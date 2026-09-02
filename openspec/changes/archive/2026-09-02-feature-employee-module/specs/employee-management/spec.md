## MODIFIED Requirements

### Requirement: Melihat daftar karyawan sesuai role
Sistem SHALL memberikan akses daftar karyawan sesuai peran user: HRD dapat melihat seluruh karyawan dari semua department beserta seluruh field, sementara STAFF hanya dapat melihat karyawan yang berada di department yang sama dengannya dan HANYA menerima field `id`, `full_name`, dan `position` (tanpa `base_salary`, `status`, `join_date`, atau objek `department`).

#### Scenario: HRD melihat semua karyawan
- **WHEN** user dengan role HRD memanggil `GET /api/v1/employees`
- **THEN** sistem mengembalikan seluruh karyawan dari semua department beserta seluruh field employee dan objek `department: { id, name }`

#### Scenario: STAFF melihat karyawan se-department dengan proyeksi ringkas
- **WHEN** user dengan role STAFF memanggil `GET /api/v1/employees`
- **THEN** sistem mengembalikan hanya karyawan yang berada di department yang sama, dan setiap item hanya berisi `id`, `full_name`, dan `position`

#### Scenario: STAFF tidak menerima data sensitif
- **WHEN** user dengan role STAFF memanggil `GET /api/v1/employees`
- **THEN** response tidak mengandung field `base_salary`, `status`, `join_date`, maupun objek `department`

### Requirement: Melihat detail karyawan sesuai role
Sistem SHALL membatasi `GET /api/v1/employees/:id` hanya untuk role HRD. STAFF tidak dapat mengakses detail karyawan lain dan hanya dapat melihat profilnya sendiri melalui `GET /api/v1/employees/mine`.

#### Scenario: HRD melihat detail karyawan
- **WHEN** user dengan role HRD memanggil `GET /api/v1/employees/:id`
- **THEN** sistem mengembalikan detail karyawan beserta objek `department: { id, name }`

#### Scenario: STAFF ditolak melihat detail karyawan
- **WHEN** user dengan role STAFF memanggil `GET /api/v1/employees/:id` untuk karyawan mana pun
- **THEN** sistem mengembalikan error 403

### Requirement: Response menyertakan objek department
Sistem SHALL menyertakan objek `department` (berisi `id` dan `name`) hasil JOIN dari tabel `departments` pada response HRD untuk `GET /api/v1/employees` dan `GET /api/v1/employees/:id`, serta pada `GET /api/v1/employees/mine` untuk semua role. Response list STAFF (`GET /api/v1/employees`) TIDAK menyertakan objek `department`.

#### Scenario: List karyawan HRD menyertakan department
- **WHEN** sistem mengembalikan daftar karyawan pada `GET /api/v1/employees` kepada user HRD
- **THEN** setiap item karyawan menyertakan `department: { id, name }`

#### Scenario: Profil sendiri menyertakan department
- **WHEN** sistem mengembalikan profil pada `GET /api/v1/employees/mine`
- **THEN** response menyertakan `department: { id, name }` untuk semua role

## ADDED Requirements

### Requirement: Profil sendiri tersedia untuk semua role
Sistem SHALL mengizinkan semua role mengakses `GET /api/v1/employees/mine` dan mengembalikan profil lengkap karyawan milik user yang terautentikasi, termasuk objek `department`.

#### Scenario: STAFF mengakses profil sendiri
- **WHEN** user dengan role STAFF yang memiliki `employee_id` memanggil `GET /api/v1/employees/mine`
- **THEN** sistem mengembalikan profil lengkap karyawan miliknya beserta `department: { id, name }`

#### Scenario: User tanpa profil karyawan
- **WHEN** user tanpa `employee_id` memanggil `GET /api/v1/employees/mine`
- **THEN** sistem mengembalikan error 404 dengan pesan profile tidak ditemukan