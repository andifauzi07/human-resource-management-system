# Employee Management

## MODIFIED Requirements

### Requirement: Employee status lifecycle
Field `status` karyawan SHALL mengikuti salah satu dari nilai enum: `PROBATION`, `ACTIVE`, `ON_LEAVE`, atau `RESIGNED`. HRD DAPAT menentukan status awal karyawan saat pembuatan melalui field opsional `status` pada `POST /employees`. Jika tidak disertakan, status default ke `PROBATION`. Transisi status mengikuti aturan sebagai berikut:
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

#### Scenario: Karyawan baru dengan status ditentukan
- **WHEN** HRD membuat karyawan baru dengan field `status` diisi (misal `ACTIVE`)
- **THEN** sistem membuat karyawan dengan status sesuai nilai yang diberikan

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
