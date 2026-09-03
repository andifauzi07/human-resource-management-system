## Context

Dashboard HRD saat ini menampilkan 4 stat card: Karyawan, Cuti, Absensi, Department. Tiga card pertama masih placeholder (`"--"`), hanya Department yang menampilkan data real dari `useDepartments()`. Modul employee sudah lengkap — backend memiliki `GET /api/v1/employees` dan frontend memiliki hook `useEmployees()` yang mengembalikan list karyawan (HRD melihat semua, STAFF melihat departemen saja).

## Goals / Non-Goals

**Goals:**
- Tampilkan total jumlah karyawan pada card "Karyawan" di dashboard HRD
- Gunakan data existing tanpa endpoint baru
- Loading state konsisten dengan pattern department (Skeleton)

**Non-Goals:**
- Breakdown status karyawan (active, probation, dll)
- Endpoint dashboard stats terpusat
- Perubahan untuk view STAFF
- Modul cuti atau absensi di dashboard

## Decisions

### 1. Pakai hook `useEmployees` existing, bukan buat endpoint baru

**Pilihan:** Fetch data via `useEmployees()` → hitung `.length` di frontend

**Alternatif:** Buat `GET /api/v1/dashboard/stats` yang return aggregate counts

**Alasan:** 
- Employee count adalah satu-satunya data yang dibutuhkan saat ini
- `useEmployees()` sudah handle auth, RBAC (HRD lihat semua), dan caching React Query
- Membuat endpoint baru hanya untuk satu count adalah over-engineering
- Nanti ketika modul cuti/absensi ditambah, bisa refactor ke dashboard stats endpoint

### 2. Loading pattern sama seperti department

**Pilihan:** Pakai `<Skeleton>` saat loading, seperti department card

**Alasan:** Konsistensi UI — user sudah familiar dengan pattern ini di dashboard

### 3. Hint card: "Total karyawan"

**Pilihan:** Ganti "Modul menyusul" → "Total karyawan"

**Alasan:** Lebih informatif dan sesuai dengan data yang ditampilkan

## Risks / Trade-offs

- **[Fetch semua employee untuk count]** → Untuk demo/portfolio project dengan data terbatas, ini acceptable. Jika scale besar, pertimbangkan endpoint aggregate.
- **[React Query refetch]** → `useEmployees()` punya default staleTime, count akan update otomatis. Tidak ada issue.
