## ADDED Requirements

### Requirement: Halaman list department memakai `DataTable`

Halaman `/departments` MUST menampilkan daftar department dengan pattern `DataTable`: kolom nama (teks, sortable, ikut search), manager (teks, sortable, ikut search — nama orang, bukan dropdown filter), dan tanggal dibuat (date, sortable). Search aktif, pagination aktif, dan urutan default descending oleh `created_at`.

#### Scenario: Mencari department
- **WHEN** user mengetik di input search tabel department
- **THEN** hasil difilter berdasarkan nama atau manager secara case-insensitive

#### Scenario: Mengurutkan nama department
- **WHEN** user mengklik header kolom nama
- **THEN** baris diurutkan sesuai abjad naik/turun

#### Scenario: Mengurutkan berdasarkan tanggal dibuat
- **WHEN** user mengklik header kolom "Dibuat"
- **THEN** baris diurutkan berdasarkan tanggal terbaru/terlama

#### Scenario: Membagi halaman department
- **WHEN** jumlah department melebihi ukuran halaman
- **THEN** hasil dibagi ke beberapa halaman dengan pemilih ukuran 10/25/50

#### Scenario: Kolom manager tidak memiliki dropdown filter
- **WHEN** user melihat header kolom manager
- **THEN** kolom manager dapat di-sort dan ikut search, namun TIDAK menampilkan dropdown filter (karena bernilai teks bebas)
