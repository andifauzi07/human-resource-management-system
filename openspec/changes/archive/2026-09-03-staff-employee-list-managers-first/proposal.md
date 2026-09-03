## Why

Tampilan daftar karyawan untuk role STAFF saat ini adalah flat list tanpa hierarki visual — manager dan staff ditampilkan secara campur aduk tanpa pembeda. Hal ini membuat STAFF kesulitan mengidentifikasi siapa manager department mereka secara sekilas. Manager perlu ditonjolkan di bagian atas daftar dengan pemisah visual yang jelas.

## What Changes

- **Server**: Tambahkan field `join_date` ke `employeeListItemProjection` di endpoint `GET /employees` untuk role STAFF, sehingga data join_date tersedia di client untuk sorting.
- **Client types**: Tambahkan `join_date: string` ke type `EmployeeListItem`.
- **Client component**: Rewrite `StaffEmployeeList` untuk:
  - Memisahkan data menjadi dua grup: manager dan staff
  - Menampilkan manager di atas daftar dengan badge `variant="outline"`
  - Menambahkan divider antara grup manager dan staff
  - Mengurutkan staff berdasarkan `join_date` ASC (terlama ke terbaru)
  - Menampilkan empty state per-grab jika salah satu grup kosong
  - Jika tidak ada manager, tampilkan daftar staff tanpa divider

## Capabilities

### Modified Capabilities

- `employee-management`: Field `join_date` ditambahkan ke projection STAFF list (business rule #4 berubah)
- `employee-management-ui`: Tampilan daftar STAFF berubah — manager di atas dengan divider, badge position, sorting by join_date

## Impact

- `server/src/services/employee.service.ts`: ubah `employeeListItemProjection` (tambah `join_date`)
- `client/src/features/employees/types.ts`: tambah `join_date` ke `EmployeeListItem`
- `client/src/features/employees/components/staff-employee-list.tsx`: rewrite render logic
