# Design — Data Table dengan Search, Filter, Sort, Pagination

## Ringkasan Keputusan

Semua keputusan berikut sudah dikunci bersama user melalui diskusi eksplorasi:

| Aspek          | Keputusan                                              |
|----------------|--------------------------------------------------------|
| Strategi       | Client-side (dataset < 1000)                           |
| Komponen       | `useDataListing` (logic) + `DataTable` (presentasi) — dipisah untuk kejelasan |
| Search         | Input di atas komponen tabel (bukan toolbar halaman)   |
| Peran kolom    | Kategorikal → filter; teks/tanggal → sort; aksi → ignorable |
| Filter         | Dropdown header, single-select, nilai unik otomatis, kombinasi AND |
| Sort           | Klik header; kolom kategorikal TIDAK di-sort           |
| Pagination     | Ukuran 10 / 25 / 50                                    |
| Default sort   | Descending by `created_at`                             |
| State          | In-memory (tanpa persist URL)                          |
| STAFF list     | Tetap `<ul>` polos, tanpa fitur search/sort/filter     |
| Backend        | Tidak berubah; tanpa regen Swagger                     |

## Peran Kolom Berdasarkan Tipe Data

```
   TIPE DATA        PERAN DI HEADER
   ─────────────    ─────────────────────────────
   Kategorikal      FILTER (dropdown single-select di header,
   (dept, status)    nilai unik otomatis dari data, AND antar-kolom)
                    — TIDAK dapat di-sort
   Teks             SORT (klik header, A→Z / Z→A)
   (nama, jabatan)   + dicakup search
   Tanggal          SORT (default desc by created_at)
   (created, join)
   Aksi             TIDAK dapat di-sort/filter
```

## Struktur Komponen

```
   ┌──────────────────────────────────────────────────┐
   │  DataTable<T>   (presentasi)                     │
   │  ┌────────────────────────────────────────────┐  │
   │  │  [🔍 search…]                    [search]  │  │
   │  ├────────────────────────────────────────────┤  │
   │  │  Nama ▲    Jabatan   Dept [▾▾] Status [▾▾]│  │
   │  │  (sort)    (sort)    (filter)  (filter)    │  │
   │  ├────────────────────────────────────────────┤  │
   │  │  ...data (paginated)...                     │  │
   │  ├────────────────────────────────────────────┤  │
   │  │  Rows 10 ▾     1–10 of 47      [pagination]│  │
   │  └────────────────────────────────────────────┘  │
   └──────────────────────────────────────────────────┘
            ▲ memakai
        useDataListing<T>  (logic, di bawah)
```

## Konfigurasi Kolom (eksplisit per tabel)

Tiap tabel mendeklarasikan peran tiap kolom. Tidak ada heuristik otomatis untuk menebak "kategorikal" — kolom ditandai eksplisit:

```ts
type ColumnType = "text" | "date" | "category" | "action";

interface Column<T> {
  key: string;
  header: string;
  type: ColumnType;
  getValue: (row: T) => string | number | Date | null;
  sortable?: boolean;   // teks/tanggal → true; kategorikal → false
  filterable?: boolean; // kategorikal → true
  // "action" → render slot untuk dropdown aksi; non-sortable/non-filterable
}
```

- **Kategorikal** (`type: "category"`): `filterable: true`, `sortable: false`. Nilai unik dropdown dihitung dari data via `getValue`.
- **Teks** (`type: "text"`): `sortable: true`, ikut dicakup search global; tidak ada dropdown filter.
- **Tanggal** (`type: "date"`): `sortable: true`; default sort by `created_at` desc.
- **Aksi** (`type: "action"`): bukan konten data; slot custom render; non-sortable/non-filterable.

## Hook `useDataListing`

```
   useDataListing<T>(items, columns, options)
   ──────────────────────────────────────────
   • options.searchEnabled: boolean          (per-tabel)
   • options.defaultSortKey: "created_at"
   • default sort = descending

   state:      searchTerm, activeFilters (Map<key, value>),
               sortKey, sortDir, pageSize, page
   turunan:    filtered (search + filter AND)
               sorted    (sort teks/tanggal; default created desc)
               paged     (slice halaman)
               distinctValues(key)  → nilai unik untuk dropdown filter
   controls:   setSearchTerm, setFilter, setSort, setPageSize, setPage
```

- Search mencocokkan kolom bertipe teks (case-insensitive).
- Filter: `activeFilters` menyimpan satu nilai per kolom; AND antar-kolom.
- Reset halaman ke 1 ketika search/filter/sort/ukuran berubah.
- Seluruh logika murni di client; tak ada request tambahan ke backend.

## Penerapan Per Tabel

| Tabel            | Search | Filter                | Sort             | Page |
|------------------|--------|-----------------------|------------------|------|
| Employee (HRD)   | ya     | department, status    | nama, jabatan    | ya   |
| Department (HRD) | ya     | — (manager = teks)    | nama, dibuat     | ya   |
| StaffEmployeeList| —      | —                     | —                | —    |

Catatan: kolom "Manager" pada tabel department berisi nama orang → **teks**, bukan kategorikal. Karena itu ia mendapat search + sort, bukan dropdown filter.

## Non-Goal

- Server-side search/filter/sort/pagination (tidak ada ubah backend; upgrade dimungkinkan nanti tanpa rombak total karena logika terpusat di satu komponen).
- Persistensi state ke URL / query params.
- Multi-select pada filter (tetap single-select).
- Sort pada kolom kategorikal.
- Penerapan fitur pada `StaffEmployeeList` (STAFF).
- Dependency baru (TanStack Table / tabel library — tidak ditambahkan); dibangun dengan primitif `components/ui/table` yang sudah ada.
