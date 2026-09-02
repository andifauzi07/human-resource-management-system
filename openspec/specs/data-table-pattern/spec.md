# Data Table Pattern

## Capability Overview

Pattern komposit tabel data reusable di sisi client: hook `useDataListing` (logika) dan komponen `DataTable` (presentasi) di `client/src/components/data-table/`. Pattern ini menjadi satu-satunya sumber kebenaran untuk search, filter, sort, dan pagination pada seluruh tabel aplikasi, dibangun di atas primitif `components/ui/table` tanpa dependency tabel eksternal.

## Requirements

### Requirement: Pattern `DataTable` dengan `useDataListing`

Client MUST menyediakan pattern komposit tabel data reusable di `client/src/components/data-table/` yang terdiri dari hook `useDataListing` (logika) dan komponen `DataTable` (presentasi). Pattern ini adalah satu-satunya sumber kebenaran untuk search, filter, sort, dan pagination pada seluruh tabel aplikasi. Dibangun di atas primitif `components/ui/table`; TIDAK menambah dependency tabel library eksternal.

#### Scenario: Tabel memakai pattern resmi

- **WHEN** sebuah modul menampilkan data tabular (mis. karyawan, department)
- **THEN** tabel memakai `DataTable` dengan konfigurasi kolom, bukan `<table>` manual yang menduplikasi logika search/filter/sort/page

#### Scenario: Primitif dipakai untuk struktur tabel

- **WHEN** `DataTable` merender struktur tabel
- **THEN** memakai `Table`, `TableHead`, `TableRow`, `TableCell` dari `components/ui/table`

### Requirement: Konfigurasi kolom eksplisit

Setiap kolom dalam `DataTable` MUST dideklarasikan dengan peran eksplisit melalui tipe `Column<T>` yang berisi `key`, `header`, `type` (`"text" | "date" | "category" | "action"`), `getValue`, serta flag `sortable` dan `filterable`. Peran kolom ditentukan dari tipe datanya: teks dan tanggal dapat di-sort; kategorikal dapat di-filter (dropdown); aksi tidak dapat di-sort maupun di-filter. Tidak ada heuristik otomatis yang menebak "kategorikal" dari data.

#### Scenario: Kolom teks dapat di-sort

- **WHEN** user mengklik header kolom bertipe teks (mis. nama)
- **THEN** baris diurutkan sesuai abjad (A→Z lalu Z→A)

#### Scenario: Kolom kategorikal dapat di-filter

- **WHEN** user membuka dropdown di header kolom kategorikal (mis. department, status)
- **THEN** dropdown menampilkan nilai unik dari data kolom tersebut plus opsi "(Semua)", dan memilih salah satu memfilter baris

#### Scenario: Kolom aksi tidak dapat di-sort/filter

- **WHEN** user mengklik header atau tombol filter pada kolom bertipe aksi
- **THEN** kolom aksi tidak bereaksi terhadap sort maupun filter

### Requirement: Search di bagian atas komponen tabel

`DataTable` MUST menyediakan input pencarian di bagian atas komponen untuk tabel yang mengaktifkan search (`searchEnabled`). Search mencocokkan nilai kolom bertipe teks secara case-insensitive. Search hidup di dalam komponen tabel (bukan toolbar halaman di luar tabel) dan bersifat opsional per-tabel.

#### Scenario: Mencari berdasarkan teks

- **WHEN** user mengetik kata kunci pada input search tabel
- **THEN** baris difilter sehingga hanya yang cocok pada kolom teks yang tampil

#### Scenario: Search non-aktif tersembunyi

- **WHEN** tabel dikonfigurasi tanpa search (`searchEnabled: false`)
- **THEN** input pencarian tidak dirender

### Requirement: Filter kategorikal single-select dengan kombinasi AND

Filter pada kolom kategorikal MUST berupa dropdown single-select (pilih satu nilai), dengan opsi di-generate otomatis dari nilai unik data kolom tersebut. Saat beberapa filter aktif bersamaan, baris MUST cocok dengan **semua** filter (logika AND).

#### Scenario: Memilih satu nilai filter

- **WHEN** user memilih satu nilai (mis. department "HRD") pada dropdown filter
- **THEN** hanya baris yang cocok dengan nilai tersebut yang tampil

#### Scenario: Menggabungkan beberapa filter dengan AND

- **WHEN** user mengaktifkan filter department "HRD" sekaligus filter status "INACTIVE"
- **THEN** hanya baris yang (department HRD) DAN (status INACTIVE) yang tampil

### Requirement: Sort kolom teks/tanggal dengan default descending by `created_at`

Header kolom bertipe teks dan tanggal MUST dapat di-sort dengan mengklik header (bergantian ascending/descending). Default urutan data saat tabel pertama kali dirender MUST descending oleh `created_at` (data terbaru di atas).

#### Scenario: Sort ascending/descending

- **WHEN** user mengklik berulang header kolom teks/tanggal
- **THEN** urutan bergantian antar ascending dan descending

#### Scenario: Urutan awal terbaru di atas

- **WHEN** tabel dimuat tanpa interaksi user
- **THEN** baris diurutkan descending oleh `created_at`

### Requirement: Pagination dengan ukuran 10 / 25 / 50

`DataTable` MUST membagi baris hasil ke halaman-halaman dengan pemilih ukuran halaman (10, 25, 50) dan menampilkan rentang baris yang sedang dilihat. Pagination direset ke halaman pertama saat search, filter, sort, atau ukuran halaman berubah.

#### Scenario: Mengganti ukuran halaman

- **WHEN** user memilih ukuran halaman 25 dari default 10
- **THEN** tabel menampilkan lebih banyak baris per halaman sesuai pilihan

#### Scenario: Pagination kembali ke halaman pertama saat filter berubah

- **WHEN** user berada di halaman 3 lalu mengubah filter atau search
- **THEN** tabel kembali ke halaman pertama dengan hasil yang telah disaring

### Requirement: Pengolahan dilakukan client-side

Seluruh search, filter, sort, dan pagination MUST diproses di sisi client (in-memory) terhadap data yang telah di-fetch penuh. Tidak ada permintaan tambahan ke backend untuk hal ini, dan kontrak API list tidak berubah.

#### Scenario: Data difetch penuh sekali

- **WHEN** tabel di-render dengan data hasil `GET` list
- **THEN** pengolahan search/filter/sort/page berlangsung di memori tanpa request jaringan tambahan