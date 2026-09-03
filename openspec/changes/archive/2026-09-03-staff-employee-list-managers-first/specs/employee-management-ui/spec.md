## MODIFIED Requirements

### Requirement: Daftar STAFF read-only tanpa detail
Client SHALL menampilkan daftar anggota se-department untuk role STAFF dengan hierarki visual: posisi MANAGER ditampilkan di paling atas daftar dengan badge `variant="outline"`, dipisahkan dari daftar STAFF oleh divider garis (`border-t`). Daftar STAFF diurutkan berdasarkan `join_date` ASC (terlama ke terbaru). Jika tidak ada manager, daftar STAFF ditampilkan tanpa divider. Jika salah satu grup kosong, tampilkan empty state per-grab yang sesuai.

#### Scenario: STAFF melihat daftar dengan manager di atas
- **WHEN** halaman employee STAFF memuat daftar dan terdapat karyawan dengan position `MANAGER`
- **THEN** karyawan MANAGER ditampilkan paling atas, diikuti divider garis, diikuti daftar STAFF

#### Scenario: MANAGER ditampilkan dengan badge
- **WHEN** karyawan dengan position `MANAGER` ditampilkan dalam daftar STAFF
- **THEN** position ditampilkan sebagai `<Badge variant="outline">MANAGER</Badge>`

#### Scenario: STAFF diurutkan berdasarkan join_date
- **WHEN** daftar STAFF dirender
- **THEN** karyawan STAFF diurutkan berdasarkan `join_date` secara ASC (terlama ke terbaru)

#### Scenario: Tidak ada manager
- **WHEN** department tidak memiliki karyawan dengan position `MANAGER`
- **THEN** daftar STAFF ditampilkan tanpa divider, langsung dari karyawan pertama

#### Scenario: Tidak ada staf
- **WHEN** department memiliki manager tetapi tidak ada karyawan dengan position `STAFF`
- **THEN** daftar menampilkan manager, divider, dan empty state "Belum ada staf di department ini"

#### Scenario: Tidak ada data sama sekali
- **WHEN** department tidak memiliki karyawan sama sekali
- **THEN** tampilkan empty state global "Belum ada anggota" tanpa divider maupun section

#### Scenario: STAFF tidak memiliki aksi CRUD
- **WHEN** user dengan role STAFF berada di halaman employee
- **THEN** tidak ada tombol tambah karyawan, edit, nonaktifkan, ataupun reset password yang dirender
