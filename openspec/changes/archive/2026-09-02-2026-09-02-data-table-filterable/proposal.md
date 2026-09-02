## Why

Seluruh tabel di aplikasi (Employee untuk HRD, Department) saat ini hanya menampilkan data mentah tanpa cara mencari, memfilter, mengurutkan, ataupun membagi halaman. Karena tabel akan terus bertambah (cuti, absensi, payroll di masa depan) dan volume data karyawan/department bisa mencapai ratusan, perlu satu mekanisme pencarian/filter/sort/pagination yang konsisten dan reusable — dibangun sekarang, client-side, tanpa mengubah kontrak API.

Belajar dari implementasi: `EmployeeTable` dan `DepartmentsPage` berbagi struktur serupa (Card + Table + Skeleton + EmptyState) namun menduplikasi logika render. Ada pola yang menunggu untuk diekstrak menjadi satu `DataTable<T>` reusable.

## What Changes

- **Baru**: komponen `DataTable<T>` (presentasi) + hook `useDataListing` (logika) di `client/src/components/data-table/` — satu sumber kebenaran untuk search, filter, sort, pagination.
- **Search**: input pencarian di bagian atas komponen tabel, mencocokkan kolom teks. Diaktifkan per-tabel via konfigurasi (eksplisit, bukan toolbar global di luar tabel).
- **Filter**: dropdown di header kolom untuk kolom **kategorikal** (single-select, nilai unik di-generate otomatis dari data, kombinasi AND antar-kolom). Kolom kategorikal **TIDAK dapat di-sort**.
- **Sort**: klik header kolom untuk kolom **teks/tanggal** (asc/desc). Default urutan awal: **descending by `created_at`** (data terbaru di atas).
- **Pagination**: pemilih ukuran halaman 10 / 25 / 50.
- **Penerapan**: `EmployeeTable` (HRD) dan `DepartmentsPage` mendapat search + filter + sort + pagination. `StaffEmployeeList` (STAFF, `<ul>`) **tidak** mendapat fitur ini — daftar tetap polos karena satu department hanya berisi beberapa pegawai.
- Data tetap di-fetch penuh sekali; semua pengolahan (search/filter/sort/page) dilakukan di sisi client (in-memory). Backend **tidak berubah**; kontrak API dan Swagger tetap.

## Capabilities

### New Capabilities
- `data-table-pattern`: pattern komposit tabel data di client — `useDataListing` (logic: search, filter kategorikal single-select AND, sort teks/tanggal, pagination 10/25/50, default desc by `created_at`) + `DataTable<T>` (presentasi: search di atas tabel, filter dropdown di header kategorikal, sort klik header teks/tanggal, kolom aksi non-sortable/non-filterable).

### Modified Capabilities
- `employee-management-ui`: tabel karyawan untuk HRD kini menggunakan `DataTable<T>` — search, filter department & status, sort nama & jabatan, dan pagination; daftar STAFF tetap `<ul>` polos tanpa fitur.
- `department-management-ui`: halaman list department kini menggunakan `DataTable<T>` — search nama/manager, sort nama & tanggal dibuat, pagination; manager diperlakukan sebagai kolom teks (search + sort, bukan dropdown filter).

## Impact

**Client (`client/`)**
- Baru `components/data-table/`:
  - `use-data-listing.ts` — hook logika reusable (search/filter/sort/page, distinct values untuk filter).
  - `data-table.tsx` — komponen presentasi tabel.
  - `data-table-toolbar.tsx` / sub-komponen filter & pagination (bila dipisah).
  - `types.ts` — tipe konfigurasi kolom (`Column<T>`: `key`, `header`, `type: "text"|"date"|"category"|"action"`, `sortable`, `filterable`, `getValue`).
- `features/employees/components/employee-table.tsx` — ganti dengan `DataTable<Employee>`.
- `routes/_app/departments/index.tsx` — ganti tabel manual dengan `DataTable<DepartmentWithManager>`.
- `features/employees/components/staff-employee-list.tsx` — tidak berubah (tetap `<ul>` polos).

**Server (`server/`)**
- Tidak ada perubahan. List endpoint `GET /employees` dan `GET /departments` tetap mengembalikan seluruh data; search/filter/sort/pagination dikerjakan client-side.
- Swagger tidak perlu di-regen.

**Dokumentasi**
- Delta specs: `data-table-pattern` (baru), `employee-management-ui` & `department-management-ui` (ubah tabel pakai DataTable). Sinkronkan ke `openspec/specs/` saat apply.
- `docs/DESIGN-SYSTEM.md` — tambahkan `DataTable` sebagai pattern komposit (bila dianggap perlu).
