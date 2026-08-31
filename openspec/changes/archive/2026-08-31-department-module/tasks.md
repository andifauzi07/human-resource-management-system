# Zaman Tugas — department-module

## 1. Backend: Validasi manager & join nama

- [x] 1.1 Tambahkan helper validasi manager di `services/department.service.ts` (query ke `employees`: ada & `status = "ACTIVE"`; salah satunya gagal → `ApiError.badRequest`)
- [x] 1.2 Terapkan validasi pada `createDepartment` dan `updateDepartment` (hanya saat `manager_id` diisi)
- [x] 1.3 Ubah `listDepartments` dan `getDepartmentById` memakai `leftJoin` ke `employees` → proyeksi menambahkan `manager_name` (null jika tanpa manager)
- [x] 1.4 Pastikan `createDepartment`/`updateDepartment` mengembalikan respons dengan `manager_name` konsisten
- [x] 1.5 Perbarui `services/department.service.test.ts`: kasus manager ada/ACTIVE (sukses), manager tidak ada (400), manager INACTIVE (400), dan `manager_name` pada list/detail

## 2. Backend: Pembersihan manager saat deaktivasi

- [x] 2.1 Ubah `deleteEmployee`/`deactivateEmployee` di `services/employee.service.ts` agar dalam satu transaksi mem-`UPDATE departments SET manager_id = NULL` untuk semua manager_id karyawan tersebut
- [x] 2.2 Perbarui `services/employee.service.test.ts`: manager dideaktivasi → `manager_id` department di-null-kan; non-manager → tidak ada perubahan

## 3. Backend: Dokumentasi & spesifikasi

- [x] 3.1 Regenerasi Swagger: `npm run docs --prefix server`
- [x] 3.2 Jalankan `openspec validate department-module` dan perbaiki bila ada temuan format
- [x] 3.3 Benahi catatan usang di `AGENTS.md` ("test runner belum terpasang") karena Vitest dan `npm test --prefix server` sudah ada

## 4. Frontend: Fondasi TanStack Query

- [x] 4.1 Pasang dependency `@tanstack/react-query` di `client/`
- [x] 4.2 Buat `QueryClientProvider` membungkus seluruh app (root route) dengan satu `QueryClient`
- [x] 4.3 Buat `features/departments/api.ts`: `departmentsApi` (list, create, update, remove) memakai `apiFetch`

## 5. Frontend: UI modul department

- [x] 5.1 Buat hooks di `features/departments/hooks.ts`: `useDepartments`, `useCreateDepartment`, `useUpdateDepartment`, `useDeleteDepartment` (+ invalidate `["departments"]` setelah mutasi)
- [x] 5.2 Ubah `features/shell/navigation.tsx`: item "Department" tidak lagi `roles: ["HRD"]` (terlihat semua role)
- [x] 5.3 Buat halaman list `routes/_app/departments/index.tsx`: tabel (nama, manager, dibuat) + loading skeleton + state error; aksi hanya untuk role HRD (`useAuthStore`)
- [x] 5.4 Buat komponen dialog create/edit (`-components/department-dialog.tsx`): field nama (wajib) + manager (dropdown karyawan `ACTIVE` via `useQuery` employees, fetch saat dialog dibuka), validasi Zod, toast via sonner
- [x] 5.5 Buat dialog konfirmasi hapus: menjelaskan konsekuensi, ukur error 400 "masih memiliki karyawan"

## 6. Verifikasi

- [x] 6.1 Jalankan `npm test --prefix server` dan pastikan seluruh unit test hijau
- [x] 6.2 Jalankan `npm run lint && npm run typecheck && npm run build` di root — semua lolos
- [x] 6.3 Uji manual `npm run dev`: login STAFF (list read-only, menu terlihat) dan HRD (dialog create/edit/delete berfungsi, respons `manager_name` tampil)
