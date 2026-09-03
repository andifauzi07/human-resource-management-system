# Employee Position Sync

## ADDED Requirements

### Requirement: Position values constrained to enum
Sistem SHALL memastikan bahwa field `position` pada karyawan hanya dapat berisi salah satu dari nilai enum `STAFF` atau `MANAGER`, dan field tersebut ditentukan sebagai `pgEnum` di level database (bukan free-text varchar).

#### Scenario: Create employee with valid position
- **WHEN** HRD membuat karyawan baru dengan `position` berisi `STAFF` atau `MANAGER`
- **THEN** sistem membuat karyawan dengan `position` sesuai nilai yang diberikan, default ke `STAFF` bila tidak disertakan

#### Scenario: Create employee with invalid position
- **WHEN** HRD membuat karyawan baru dengan `position` berisi nilai selain `STAFF`/`MANAGER`
- **THEN** sistem menolak request dengan error 400 dan pesan yang menjelaskan nilai `position` tidak valid

#### Scenario: Update position to invalid value
- **WHEN** HRD mengubah `position` karyawan ke nilai selain `STAFF`/`MANAGER`
- **THEN** sistem menolak request dengan error 400

### Requirement: Position MANAGER sync ke department manager
Ketika `position` karyawan diubah menjadi `MANAGER`, sistem SHALL otomatis meng-set `departments.manager_id` ke ID karyawan tersebut untuk department tempat karyawan itu berada, apabila department tersebut belum memiliki manager.

#### Scenario: Promote employee to manager (department tanpa manager)
- **WHEN** HRD mengubah `position` karyawan X menjadi `MANAGER` dan department dari karyawan X belum memiliki manager
- **THEN** sistem meng-set `departments.manager_id` karyawan X menjadi ID karyawan X

#### Scenario: Promote employee to manager (department sudah punya manager)
- **WHEN** HRD mengubah `position` karyawan X menjadi `MANAGER` namun department dari karyawan X sudah memiliki manager
- **THEN** sistem menolak request dengan error 409 dan pesan yang menjelaskan department tersebut sudah memiliki manager

### Requirement: Position STAFF berhenti sebagai manager
Ketika `position` karyawan yang berstatus MANAGER diubah menjadi `STAFF`, sistem SHALL otomatis meng-set `departments.manager_id` yang menunjuk ke karyawan tersebut menjadi `null`, sehingga karyawan tidak lagi menjadi manager department manapun.

#### Scenario: Demote manager to staff
- **WHEN** HRD mengubah `position` karyawan X (yang merupakan manager department) menjadi `STAFF`
- **THEN** sistem mengubah `position` karyawan X menjadi `STAFF` dan meng-set `departments.manager_id` yang menunjuk X menjadi `null`

#### Scenario: Confirmation dialog untuk demote manager
- **WHEN** HRD mengubah `position` karyawan yang berstatus MANAGER menjadi `STAFF`
- **THEN** sistem menampilkan dialog konfirmasi yang menjelaskan bahwa mengubah posisi ke STAFF akan menghapus karyawan tersebut dari posisi manager department

### Requirement: Manager harus berasal dari department yang sama
Sistem SHALL menolak pemilihan manager yang bukan berasal dari department yang sama dengan department yang dikelola.

#### Scenario: Pilih manager dari department berbeda
- **WHEN** HRD memilih karyawan dari department lain sebagai manager untuk suatu department
- **THEN** sistem menolak request dengan pesan yang menjelaskan bahwa manager harus berasal dari department yang sama

### Requirement: Karyawan manager tidak bisa dipindah department
Sistem SHALL menolak pemindahan department untuk karyawan yang berstatus MANAGER, hingga karyawan tersebut tidak lagi menjadi manager.

#### Scenario: Pindah department karyawan yang berstatus MANAGER
- **WHEN** HRD memindahkan karyawan X (yang merupakan manager department A) ke department B
- **THEN** sistem menolak request dengan pesan yang menjelaskan bahwa karyawan X adalah manager department A dan HRD harus mengubah manager department A terlebih dahulu

### Requirement: Karyawan manager tidak bisa dideactivate
Sistem SHALL menolak deactivation untuk karyawan yang berstatus MANAGER, hingga karyawan tersebut tidak lagi menjadi manager.

#### Scenario: Deactivate employee yang berstatus MANAGER
- **WHEN** HRD mencoba menonaktifkan karyawan X yang berstatus MANAGER
- **THEN** sistem menolak request dengan pesan yang menjelaskan bahwa karyawan X adalah manager dan HRD harus mengganti manager department terlebih dahulu

### Requirement: Sync position saat unassign manager dari department
Ketika manager dihapus dari sebuah department (di-set ke `null`), sistem SHALL otomatis mengubah `position` karyawan yang sebelumnya menjadi manager dari `MANAGER` menjadi `STAFF`.

#### Scenario: Hapus manager dari department
- **WHEN** HRD set `manager_id` department menjadi `null`
- **THEN** sistem mengubah `position` karyawan yang sebelumnya menjadi manager menjadi `STAFF`

### Requirement: Sync position saat assign manager lewat department
Ketika HRD memilih manager untuk sebuah department, sistem SHALL meng-set `position` karyawan tersebut menjadi `MANAGER` secara otomatis.

#### Scenario: Assign manager lewat department dialog
- **WHEN** HRD memilih karyawan sebagai manager pada sebuah department
- **THEN** sistem men-set `departments.manager_id` ke ID karyawan tersebut dan mengubah `position` karyawan tersebut menjadi `MANAGER`

### Requirement: Validasi 1 manager per department
Sistem SHALL memastikan bahwa setiap department hanya boleh memiliki tepat satu manager pada satu waktu. Ketika sebuah department sudah memiliki manager, pemilihan manager baru harus ditolak hingga manager existing dihapus terlebih dahulu.

#### Scenario: Assign manager kedua pada department yang sudah punya manager
- **WHEN** HRD mencoba men-set manager baru pada department yang sudah memiliki manager
- **THEN** sistem menolak request dengan error 409 dan pesan yang menjelaskan bahwa department sudah memiliki manager

### Requirement: Employee hanya bisa menjadi manager satu department
Sistem SHALL memastikan bahwa seorang karyawan hanya dapat menjadi manager di satu department pada satu waktu.

#### Scenario: Employee menjadi manager di dua department
- **WHEN** sistem menghitung bahwa seorang karyawan sudah menjadi manager pada satu department, lalu HRD mencoba menjadikannya manager di department lain
- **THEN** sistem menolak request karena karyawan tersebut sudah menjadi manager di department lain

## Endpoints

| Method | Endpoint | Authorization | Description |
|--------|----------|---------------|-------------|
| PATCH | `/api/v1/employees/:id` | HRD | Update employee termasuk `position` (memicu sync manager) |
| PATCH | `/api/v1/departments/:id` | HRD | Update department termasuk `manager_id` (memicu sync position) |
