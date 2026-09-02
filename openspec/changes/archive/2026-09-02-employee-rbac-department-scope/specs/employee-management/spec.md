## MODIFIED Requirements

### Requirement: Melihat daftar karyawan sesuai role
Sistem SHALL memberikan akses daftar karyawan sesuai peran user: HRD dapat melihat seluruh karyawan dari semua department, sementara STAFF hanya dapat melihat karyawan yang berada di department yang sama dengannya.

#### Scenario: HRD melihat semua karyawan
- **WHEN** user dengan role HRD memanggil `GET /api/v1/employees`
- **THEN** sistem mengembalikan seluruh karyawan dari semua department

#### Scenario: STAFF melihat karyawan se-department
- **WHEN** user dengan role STAFF memanggil `GET /api/v1/employees`
- **THEN** sistem mengembalikan hanya karyawan yang berada di department yang sama dengan user STAFF tersebut

### Requirement: Melihat detail karyawan sesuai role
Sistem SHALL memberikan akses detail karyawan sesuai peran user: HRD dapat melihat detail karyawan mana pun, sementara STAFF hanya dapat melihat detail karyawan yang berada di department yang sama dengannya.

#### Scenario: STAFF melihat detail karyawan se-department
- **WHEN** user dengan role STAFF memanggil `GET /api/v1/employees/:id` untuk karyawan yang berada di department yang sama
- **THEN** sistem mengembalikan detail karyawan tersebut

#### Scenario: STAFF menolak detail karyawan lain department
- **WHEN** user dengan role STAFF memanggil `GET /api/v1/employees/:id` untuk karyawan yang berada di department berbeda
- **THEN** sistem mengembalikan error 403

### Requirement: Response menyertakan objek department
Sistem SHALL menyertakan objek `department` (berisi `id` dan `name`) pada response dari `GET /api/v1/employees`, `GET /api/v1/employees/:id`, dan `GET /api/v1/employees/mine`, hasil JOIN dari tabel `departments`.

#### Scenario: List karyawan menyertakan department
- **WHEN** sistem mengembalikan daftar karyawan pada `GET /api/v1/employees`
- **THEN** setiap item karyawan menyertakan `department: { id, name }`

#### Scenario: Detail karyawan menyertakan department
- **WHEN** sistem mengembalikan detail karyawan pada `GET /api/v1/employees/:id` atau `GET /api/v1/employees/mine`
- **THEN** response menyertakan `department: { id, name }`
