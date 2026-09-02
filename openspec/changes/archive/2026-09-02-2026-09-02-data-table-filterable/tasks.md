# Tasks — Data Table dengan Search, Filter, Sort, Pagination

## 1. Hook logic `useDataListing`

- [x] 1.1 Buat `client/src/components/data-table/use-data-listing.ts` — state: `searchTerm`, `activeFilters` (Map), `sortKey`, `sortDir`, `pageSize`, `page`
- [x] 1.2 Implementasikan filtering: filter per kolom kategorikal (single-select) dengan kombinasi **AND** antar-kolom
- [x] 1.3 Implementasikan search global pada kolom bertipe **teks** (case-insensitive)
- [x] 1.4 Implementasikan sorting pada kolom **teks/tanggal** (asc/desc), default **desc by `created_at`**
- [x] 1.5 Implementasikan pagination dengan ukuran halaman (default 10) dan slice data
- [x] 1.6 Hitung `distinctValues(key)` untuk nilai unik dropdown filter, hasil di-memo
- [x] 1.7 Reset `page` ke 1 saat search/filter/sort/`pageSize` berubah
- [x] 1.8 Tipe `Column<T>` & `ColumnType` di `client/src/components/data-table/types.ts`

## 2. Komponen presentasi `DataTable`

- [x] 2.1 Buat `client/src/components/data-table/data-table.tsx` memakai primitif `components/ui/table`
- [x] 2.2 Toolbar search di bagian atas tabel (hanya bila `searchEnabled`)
- [x] 2.3 Header kolom: sort indicator (▲/▼) untuk kolom sortable; dropdown filter untuk kolom kategorikal
- [x] 2.4 Dropdown filter single-select, opsi = `distinctValues` + "(Semua)"
- [x] 2.5 Slot untuk kolom tipe `"action"` (custom render per baris, non-sortable/non-filterable)
- [x] 2.6 Kontrol pagination (pemilih ukuran 10/25/50 + info rentang baris)
- [x] 2.7 Integrasikan dengan state loading / error / empty (`Skeleton`, `EmptyState`) mengikuti pola tabel yang ada

## 3. Terapkan pada Employee (HRD)

- [x] 3.1 Ubah `features/employees/components/employee-table.tsx` memakai `DataTable<Employee>`
- [x] 3.2 Kolom: nama (text, sort, search), jabatan (text, sort, search), department (category, filter), status (category, filter), aksi (action)
- [x] 3.3 Aktifkan search + pagination; default sort desc by `created_at`

## 4. Terapkan pada Department (HRD)

- [x] 4.1 Ubah `routes/_app/departments/index.tsx` memakai `DataTable<DepartmentWithManager>`
- [x] 4.2 Kolom: nama (text, sort, search), manager (text, sort, search — BUKAN dropdown), dibuat (date, sort), aksi (action)
- [x] 4.3 Format tanggal untuk kolom "dibuat" (id-ID)
- [x] 4.4 Aktifkan search + pagination; default sort desc by `created_at`

## 5. Verifikasi & spesifikasi

- [x] 5.1 Jalankan verifikasi root: `npm run lint && npm run typecheck && npm run build`
- [x] 5.2 Jalankan test server: `npm test --prefix server` (pastikan tak ada regresi walau server tak diubah)
- [x] 5.3 Sinkronkan delta specs ke `openspec/specs/` (`data-table-pattern` baru; `employee-management-ui`, `department-management-ui` diperbarui)
- [x] 5.4 Update `docs/DESIGN-SYSTEM.md` — tambahkan `DataTable` sebagai pattern komposit (bila dianggap perlu)
