## Purpose

Menampilkan data statistik real-time pada dashboard HRD berdasarkan modul yang sudah ada (employee, department).

## Requirements

### Requirement: Dashboard HRD menampilkan jumlah karyawan
Dashboard untuk pengguna dengan role HRD SHALL menampilkan card "Karyawan" yang menunjukkan total jumlah karyawan aktif dari seluruh departemen (tidak termasuk karyawan dengan status RESIGNED).

#### Scenario: HRD melihat total karyawan
- **WHEN** pengguna dengan role HRD mengakses dashboard
- **THEN** card "Karyawan" menampilkan angka total jumlah karyawan aktif (count dari `GET /api/v1/employees`, difilter tanpa status RESIGNED)

#### Scenario: Loading state
- **WHEN** data karyawan sedang dimuat
- **THEN** card "Karyawan" menampilkan skeleton placeholder (bukan angka atau error)

### Requirement: Card karyawan tidak ditampilkan untuk STAFF
Dashboard untuk pengguna dengan role STAFF SHALL TIDAK menampilkan card "Karyawan".

#### Scenario: STAFF tidak melihat card karyawan
- **WHEN** pengguna dengan role STAFF mengakses dashboard
- **THEN** dashboard hanya menampilkan card "Cuti tersisa" dan "Absensi" (tanpa card "Karyawan")

### Requirement: Hint card karyawan informatif
Card "Karyawan" SHALL menampilkan hint text "Total karyawan" sebagai deskripsi tambahan.

#### Scenario: Hint text ditampilkan
- **WHEN** card "Karyawan" berhasil dimuat
- **THEN** card menampilkan hint "Total karyawan" di bawah angka
