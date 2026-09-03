## 1. Aktifkan Card Karyawan di Dashboard

- [x] 1.1 Import hook `useEmployees` dari `@/features/employees/hooks` di `client/src/routes/_app/index.tsx`
- [x] 1.2 Panggil `useEmployees()` di component `DashboardPage` (hanya untuk HRD)
- [x] 1.3 Buat `employeeValue` dengan loading state pakai `<Skeleton>` (seperti pattern `departmentValue`)
- [x] 1.4 Ganti value card "Karyawan" dari `"--"` ke `employeeValue`
- [x] 1.5 Ganti hint card "Karyawan" dari `"Modul menyusul"` ke `"Total karyawan"`

## 2. Verifikasi

- [x] 2.1 Jalankan `npm run lint --prefix client` pastikan tidak ada error
- [x] 2.2 Jalankan `npm run typecheck` pastikan tidak ada type error
