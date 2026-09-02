## MODIFIED Requirements

### Requirement: RBAC tampilan frontend — halaman Department khusus HRD
Menu "Department" di sidebar MUST hanya terlihat oleh role `HRD` (tidak lagi untuk semua role). STAFF yang membuka rute `/departments` langsung (mis. mengetik alamat) MUST diarahkan (redirect) ke halaman Dashboard oleh guard `beforeLoad` route, sehingga halaman tersebut tidak dirender untuk STAFF. Pembatasan di sisi tampilan TIDAK menggantikan otorisasi di backend (mutasi tetap dijaga `rbacGuard(["HRD"])`).

#### Scenario: Menu Department tidak tampil untuk STAFF
- **WHEN** user dengan role STAFF login dan membuka sidebar
- **THEN** item "Department" tidak muncul; item "Karyawan" tetap tampil

#### Scenario: HRD melihat menu Department
- **WHEN** user dengan role HRD login dan membuka sidebar
- **THEN** item "Department" muncul dan dapat dinavigasi

#### Scenario: STAFF diarahkan keluar dari rute department
- **WHEN** user dengan role STAFF membuka `/departments` secara langsung
- **THEN** guard `beforeLoad` mengarahkannya ke halaman Dashboard dan halaman department tidak dirender