## 1. Server: expose join_date untuk STAFF list

- [x] 1.1 Tambahkan `join_date: employeesTable.join_date` ke `employeeListItemProjection` di `server/src/services/employee.service.ts`
- [x] 1.2 Verifikasi `EmployeeListItem` type di server (interface) mencakup `join_date`
- [x] 1.3 Jalankan `npm run lint:check --prefix server` dan `npm run typecheck --prefix server`

## 2. Client: update type & API contract

- [x] 2.1 Tambahkan `join_date: string` ke interface `EmployeeListItem` di `client/src/features/employees/types.ts`
- [x] 2.2 Verifikasi `employeesApi.list()` return type tetap `EmployeeListItem[]` (sudah otomatis)

## 3. Client: rewrite StaffEmployeeList

- [x] 3.1 Split data menjadi `managers` dan `staff` menggunakan `useMemo` di `staff-employee-list.tsx`
- [x] 3.2 Render section MANAGER di atas daftar dengan `<Badge variant="outline">MANAGER</Badge>`
- [x] 3.3 Tambah divider `<div className="border-t" />` antara section manager dan staff
- [x] 3.4 Sort daftar staff berdasarkan `join_date` ASC (terlama ke terbaru)
- [x] 3.5 Handle empty state per-grab: jika tidak ada manager tampilkan staff tanpa divider; jika tidak ada staff tampilkan empty state "Belum ada staf"; jika keduanya kosong tampilkan empty state global
- [x] 3.6 Jalankan `npm run lint --prefix client` dan `npm run typecheck --prefix client`

## 4. Verifikasi menyeluruh

- [x] 4.1 Jalankan `npm run lint && npm run typecheck && npm run build` di root
- [x] 4.2 Cek visual daftar STAFF di browser (manager di atas + divider + badge)
