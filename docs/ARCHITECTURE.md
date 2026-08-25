# System Design: HRIS Portfolio Demo
### "NexaHR" — Sistem Manajemen SDM Berbasis Web

> **Catatan penting:** Nama, data, dan skenario bisnis di dokumen ini sepenuhnya fiktif, dirancang ulang dari nol untuk kebutuhan portofolio. Tidak ada kode, skema database, atau aset milik PT. Barru Barakah Properti yang digunakan. Ini murni rekonstruksi konsep berdasarkan deskripsi fitur umum sistem HRIS.

---

## 1. Ringkasan & Tujuan Portofolio

Demo ini dirancang untuk menunjukkan kemampuan fullstack Anda dalam 4 area:

| Area | Skill yang Ditunjukkan |
|---|---|
| Manajemen karyawan & cuti | CRUD kompleks, relasi data, workflow approval |
| Absensi digital + geolocation | Integrasi Geolocation API, validasi radius, real-time |
| Payroll & lembur otomatis | Business logic kalkulasi, scheduled jobs, akurasi numerik |
| RBAC | Auth & authorization, middleware, keamanan data sensitif |

**Positioning untuk portofolio:** Tulis di README/case study bahwa proyek ini adalah *"reimplementasi independen dari konsep sistem HRIS yang pernah saya kembangkan secara profesional, dibangun ulang dari nol tanpa kode maupun data asli perusahaan, untuk keperluan demonstrasi publik."* Ini penting secara etis dan legal (NDA/kepemilikan kode klien).

---

## 2. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | React (Vite) + TypeScript | Cepat, sesuai keahlian di resume |
| State/Data fetching | TanStack Query + Zustand | Sesuai stack yang sudah Anda kuasai |
| Styling | Tailwind CSS + Shadcn UI | Konsisten dengan proyek lain di resume |
| Backend | Express.js + TypeScript | Sesuai preferensi stack |
| ORM | Prisma | Migrasi schema rapi, cocok untuk showcase database design |
| Database | PostgreSQL | Sesuai pilihan Anda |
| Auth | JWT (access + refresh token) | Standar untuk RBAC |
| File/Geolocation | Browser Geolocation API + Haversine formula (server-side validation) | Tidak perlu API berbayar |
| Scheduled Jobs | node-cron | Untuk kalkulasi lembur/payroll otomatis periodik |
| Deployment | Frontend: Vercel, Backend: Railway/Render, DB: Supabase/Neon (Postgres) | Gratis untuk demo publik |

---

## 3. Arsitektur Tingkat Tinggi

```
┌─────────────────┐         HTTPS/REST        ┌──────────────────┐
│   React SPA      │ ─────────────────────────▶│   Express API     │
│  (Vite + TS)      │◀───────────────────────── │  (Layered Arch)   │
└─────────────────┘         JSON + JWT          └──────────────────┘
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    ▼                     ▼                     ▼
                             Auth Middleware      Business Logic         Prisma ORM
                             (RBAC Guard)          Services Layer             │
                                                                               ▼
                                                                        PostgreSQL DB
```

**Pola arsitektur backend:** Layered Architecture (Controller → Service → Repository) agar terlihat rapi saat kode dibaca recruiter/reviewer:

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.routes.ts
│   ├── employees/
│   │   ├── employee.controller.ts
│   │   ├── employee.service.ts
│   │   ├── employee.repository.ts
│   │   └── employee.routes.ts
│   ├── leave/
│   ├── attendance/
│   ├── payroll/
│   └── overtime/
├── middlewares/
│   ├── auth.middleware.ts       # verifikasi JWT
│   └── rbac.middleware.ts       # cek permission per role
├── jobs/
│   └── payroll-cron.ts          # kalkulasi lembur harian/bulanan
├── utils/
│   └── geolocation.ts           # haversine distance check
├── prisma/
│   └── schema.prisma
└── server.ts
```

Frontend disarankan struktur berbasis fitur (feature-based), sama seperti proyek "Warunk" di resume Anda:

```
src/
├── features/
│   ├── employees/
│   ├── leave/
│   ├── attendance/
│   ├── payroll/
│   └── auth/
├── components/ui/        # shadcn components
├── stores/                # zustand
├── hooks/                 # custom hooks + tanstack query hooks
└── lib/
```

---

## 4. Skema Database (ERD Konseptual)

### Entitas Utama

**users**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID PK | |
| email | varchar unique | |
| password_hash | varchar | |
| role | enum('STAFF','HRD','MANAGEMENT') | dipakai RBAC |
| employee_id | UUID FK → employees.id | nullable |
| created_at | timestamp | |

**employees**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID PK | |
| full_name | varchar | |
| department_id | UUID FK → departments.id | |
| position | varchar | |
| base_salary | decimal | |
| join_date | date | |
| status | enum('ACTIVE','INACTIVE') | |

**departments**
| id, name, manager_id (FK → employees.id) |

**leave_requests**
| id, employee_id FK, type enum('ANNUAL','SICK','UNPAID'), start_date, end_date, reason, status enum('PENDING','APPROVED','REJECTED'), approved_by FK → employees.id |

**attendance**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID PK | |
| employee_id | UUID FK | |
| check_in_time | timestamp | |
| check_out_time | timestamp nullable | |
| check_in_lat / check_in_lng | decimal | dari browser geolocation |
| distance_from_office_m | decimal | hasil kalkulasi haversine |
| is_valid_location | boolean | true jika dalam radius kantor (mis. 100m) |
| status | enum('ON_TIME','LATE','ABSENT') | |

**office_locations**
| id, latitude, longitude, radius_meters — dipakai untuk validasi presensi |

**overtime_records**
| id, employee_id FK, date, hours, hourly_rate_multiplier, calculated_amount, status enum('AUTO_CALCULATED','APPROVED') |

**payroll**
| id, employee_id FK, period_month, period_year, base_salary, total_overtime, total_deduction (mis. tidak masuk tanpa keterangan), net_salary, generated_at |

### Relasi Kunci
- `employees 1—N attendance`
- `employees 1—N leave_requests`
- `employees 1—N overtime_records`
- `employees 1—N payroll`
- `departments 1—N employees`
- `users 1—1 employees` (kecuali akun HRD/Management murni admin tanpa data pegawai)

---

## 5. Desain RBAC (Role-Based Access Control)

| Resource | STAFF | HRD | MANAGEMENT |
|---|---|---|---|
| Lihat profil sendiri | ✅ | ✅ | ✅ |
| Lihat data semua karyawan | ❌ | ✅ | ✅ (read-only) |
| Tambah/edit/hapus karyawan | ❌ | ✅ | ❌ |
| Ajukan cuti | ✅ (milik sendiri) | ✅ | ✅ |
| Approve/reject cuti | ❌ | ✅ | ✅ (khusus tim langsung) |
| Check-in/out presensi | ✅ | ✅ | ✅ |
| Lihat presensi semua karyawan | ❌ | ✅ | ✅ |
| Lihat slip gaji sendiri | ✅ | ✅ | ✅ |
| Lihat/generate slip gaji semua karyawan | ❌ | ✅ | ✅ (read-only, laporan agregat) |
| Kelola pengaturan lokasi kantor | ❌ | ✅ | ❌ |

**Implementasi teknis:**
- Middleware `rbac.middleware.ts` menerima array permission yang diizinkan per endpoint, contoh: `router.get('/payroll/all', authGuard, rbacGuard(['HRD','MANAGEMENT']), controller)`
- Untuk kasus "lihat data sendiri", tambahkan pengecekan `req.user.employee_id === params.employeeId` di service layer, bukan hanya di middleware — supaya logika tetap konsisten walau endpoint dipanggil lewat cara lain.

---

## 6. Spesifikasi Fitur & Logika Bisnis

### 6.1 Absensi Digital + Geolocation
1. Frontend memanggil `navigator.geolocation.getCurrentPosition()` saat user klik "Check In".
2. Kirim `{ lat, lng, timestamp }` ke backend.
3. Backend hitung jarak ke `office_locations` pakai **Haversine formula**.
4. Jika jarak ≤ radius (misal 100m) → `is_valid_location = true`, status dihitung dari jam check-in vs jam kerja standar (mis. >08.15 = LATE).
5. Jika di luar radius → tetap simpan record tapi flag `is_valid_location = false`, tampilkan warning ke user, dan beri HRD visibilitas atas anomali ini di dashboard.

> Tips demo: siapkan toggle "simulasi lokasi" di dev tools browser agar reviewer bisa uji kasus valid/invalid tanpa perlu pindah lokasi fisik.

### 6.2 Payroll & Lembur Otomatis
1. Job cron (`node-cron`) berjalan setiap akhir hari untuk menghitung `overtime_records` dari selisih `check_out_time - jam_kerja_standar`.
2. Rate lembur mengikuti aturan sederhana yang bisa dikonfigurasi (mis. 1.5x rate/jam untuk 2 jam pertama, 2x setelahnya) — cukup untuk showcase tanpa perlu 100% akurat aturan Kemnaker.
3. Job bulanan menggabungkan `base_salary + total_overtime - total_deduction` menjadi record `payroll`.
4. HRD bisa trigger manual regenerate lewat endpoint admin jika ada koreksi data.

### 6.3 Manajemen Karyawan & Cuti
- CRUD karyawan standar dengan validasi (mis. `base_salary > 0`, email unik).
- Leave request pakai state machine sederhana: `PENDING → APPROVED/REJECTED`, dengan notifikasi (bisa disimulasikan dengan in-app notification, tidak perlu email real untuk demo).
- Tampilkan sisa cuti tahunan (kalkulasi: kuota tahunan − cuti yang sudah approved).

---

## 7. Daftar Endpoint API (Ringkas)

```
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/employees              (HRD, MANAGEMENT)
POST   /api/employees              (HRD)
GET    /api/employees/:id          (self, HRD, MANAGEMENT)
PATCH  /api/employees/:id          (HRD)
DELETE /api/employees/:id          (HRD)

POST   /api/leave                  (self)
GET    /api/leave/mine             (self)
GET    /api/leave                  (HRD, MANAGEMENT)
PATCH  /api/leave/:id/approve      (HRD, MANAGEMENT)
PATCH  /api/leave/:id/reject       (HRD, MANAGEMENT)

POST   /api/attendance/check-in    (self)
POST   /api/attendance/check-out   (self)
GET    /api/attendance/mine        (self)
GET    /api/attendance             (HRD, MANAGEMENT)

GET    /api/payroll/mine           (self)
GET    /api/payroll                (HRD, MANAGEMENT)
POST   /api/payroll/generate       (HRD)

GET    /api/office-locations       (HRD)
POST   /api/office-locations       (HRD)
```

---

## 8. Data Dummy untuk Demo

Buat seeder Prisma (`prisma/seed.ts`) yang generate:
- 1 lokasi kantor fiktif (koordinat bebas, misal Makassar)
- 3 departemen (Operasional, Keuangan, IT)
- ±15 karyawan dummy dengan `faker.js`
- Data presensi 30 hari terakhir dengan variasi status (tepat waktu, telat, lokasi invalid) agar dashboard terlihat hidup saat direview
- Beberapa leave request dengan status campuran

Gunakan library **`@faker-js/faker`** untuk generate nama, agar tidak menyerupai data karyawan asli perusahaan sebelumnya.

---

## 9. Roadmap Implementasi (Saran Urutan Kerja)

1. **Setup**: init repo, Prisma schema, migrasi awal, seeder
2. **Auth + RBAC**: login, JWT, middleware guard
3. **Modul Employee**: CRUD + halaman list/detail di frontend
4. **Modul Attendance**: geolocation check-in/out + dashboard HRD
5. **Modul Leave**: request + approval flow
6. **Modul Overtime + Payroll**: cron job + slip gaji view
7. **Polish**: dashboard summary/statistik (chart pakai Recharts), responsive UI
8. **Deploy**: Vercel (FE) + Railway (BE) + Neon/Supabase (DB)
9. **README case study**: masalah → solusi → tech decision → screenshot/GIF demo

---

## 10. Hal yang Membuat Demo Ini "Portfolio-Ready"

- Sertakan **1-2 keputusan arsitektur yang dijelaskan** di README (mis. "kenapa pakai Haversine bukan Google Maps API" → cost & simplicity).
- Rekam GIF singkat untuk tiap fitur utama (check-in geolocation, approval cuti, slip gaji auto-generate).
- Deploy live + sediakan akun demo readonly (STAFF/HRD/MANAGEMENT) agar recruiter bisa coba langsung tanpa daftar.
