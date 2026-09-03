# Department Management

## MODIFIED Requirements

### Requirement: Manager harus berasal dari department yang sama
Sistem SHALL menolak pemilihan manager yang bukan berasal dari department yang sedang dikelola. Ketika `manager_id` diberikan, sistem SHALL memvalidasi bahwa karyawan tersebut memiliki `department_id` yang sama dengan ID department yang sedang dibuat/diubah, selain validasi bahwa karyawan ada dan berstatus `ACTIVE`.

#### Scenario: Pilih manager dari department yang sama
- **WHEN** HRD memilih karyawan dari department yang sama sebagai manager
- **THEN** sistem menerima request dan meng-set `departments.manager_id` ke ID karyawan tersebut

#### Scenario: Pilih manager dari department berbeda (ditolak)
- **WHEN** HRD memilih karyawan yang `department_id`-nya berbeda dengan department yang sedang dikelola
- **THEN** sistem menolak request dengan error 400 dan pesan yang menjelaskan bahwa manager harus berasal dari department yang sama

### Requirement: Satu manager per department
Sistem SHALL memastikan bahwa setiap department hanya boleh memiliki satu manager pada satu waktu. Sistem SHALL menolak pemilihan manager baru apabila department sudah memiliki manager.

#### Scenario: Assign manager kedua pada department yang sudah punya manager
- **WHEN** HRD mencoba men-set manager baru pada department yang sudah memiliki `manager_id`
- **THEN** sistem menolak request dengan error 409 dan pesan yang menjelaskan bahwa department tersebut sudah memiliki manager

#### Scenario: Ganti manager setelah unassign
- **WHEN** HRD meng-set `manager_id` department menjadi `null` (unassign), lalu mengisi manager baru
- **THEN** sistem menerima manager yang baru tersebut

## ADDED Requirements

### Requirement: Sync position saat assign manager
Ketika HRD men-set `manager_id` pada sebuah department, sistem SHALL otomatis mengubah `position` karyawan yang dipilih menjadi `MANAGER`.

#### Scenario: Assign manager mengubah position karyawan
- **WHEN** HRD memilih karyawan sebagai manager pada sebuah department
- **THEN** sistem mengubah `position` karyawan tersebut menjadi `MANAGER`

### Requirement: Sync position saat unassign manager
Ketika HRD menghapus manager dari sebuah department (set `manager_id` menjadi `null`), sistem SHALL otomatis mengubah `position` karyawan yang sebelumnya menjadi manager dari `MANAGER` menjadi `STAFF`.

#### Scenario: Unassign manager mengubah position karyawan
- **WHEN** HRD meng-set `manager_id` department menjadi `null`
- **THEN** sistem mengubah `position` karyawan yang sebelumnya menjadi manager menjadi `STAFF`
