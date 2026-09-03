# Employee Management

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Position sebagai enum
Field `position` karyawan SHALL diimplementasikan sebagai enum dengan nilai `STAFF` dan `MANAGER` di level database, bukan free-text varchar.

#### Scenario: Position valid
- **WHEN** HRD membuat atau mengubah karyawan dengan `position` berisi `STAFF` atau `MANAGER`
- **THEN** sistem menerima nilai tersebut

#### Scenario: Position tidak valid
- **WHEN** HRD membuat atau mengubah karyawan dengan `position` berisi nilai selain `STAFF`/`MANAGER`
- **THEN** sistem menolak request dengan error 400

### Requirement: Auto-transition PROBATION saat query
Sistem SHALL menghitung transisi `PROBATION` → `ACTIVE` pada saat query (baik list maupun detail karyawan), berdasarkan `join_date` yang sudah lebih dari 90 hari dari hari ini.

#### Scenario: List karyawan memicu auto-transition
- **WHEN** sistem mengambil daftar karyawan dan ada karyawan berstatus `PROBATION` yang `join_date`-nya sudah melewati 90 hari
- **THEN** sistem mengubah status karyawan tersebut menjadi `ACTIVE` selama proses query

#### Scenario: Detail karyawan memicu auto-transition
- **WHEN** sistem mengambil detail karyawan yang berstatus `PROBATION` dan `join_date`-nya sudah melewati 90 hari
- **THEN** sistem mengubah status karyawan tersebut menjadi `ACTIVE` sebelum mengembalikan data
