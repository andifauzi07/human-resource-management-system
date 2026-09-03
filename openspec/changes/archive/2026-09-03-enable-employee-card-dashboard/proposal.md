## Why

Dashboard HRD menampilkan 4 stat card, tetapi card "Karyawan" masih menampilkan placeholder `"--"` dengan hint "Modul menyusul". Modul employee sudah lengkap di backend (API + DB) dan frontend (hooks + types), sehingga data employee count sudah tersedia dan hanya perlu ditampilkan.

## What Changes

- Aktifkan card "Karyawan" pada dashboard HRD dengan menampilkan total jumlah karyawan dari data yang sudah ada
- Ganti hint card dari "Modul menyusul" menjadi "Total karyawan"
- Tidak ada perubahan backend — semua data sudah tersedia via `GET /api/v1/employees`
- Tidak ada perubahan untuk view STAFF (card karyawan tetap tidak ditampilkan)

## Capabilities

### New Capabilities

- `dashboard-stats`: Menampilkan data statistik real-time pada dashboard HRD berdasarkan modul yang sudah ada (employee, department)

### Modified Capabilities

<!-- Tidak ada requirement spec yang berubah -->

## Impact

- **Client code**: `client/src/routes/_app/index.tsx` — tambah import `useEmployees`, panggil hook, ganti value stat card
- **Dependencies**: Tidak ada dependency baru — hook `useEmployees` sudah ada di `features/employees/hooks.ts`
- **API**: Tidak ada perubahan API
