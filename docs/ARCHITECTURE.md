# System Design: HRIS (Portfolio Demo)

HRIS adalah demo sistem HRIS (manajemen karyawan, cuti, absensi geolocation, payroll/lembur otomatis, RBAC). Dokumen ini mendeskripsikan desain produk & arsitektur yang **sedang dibangun** — bagian yang belum diimplementasi ditandai "🚧 rencana".

> Dokumen ini sepenuhnya fiktif, untuk keperluan portofolio. Tidak ada kode/data milik pihak lain yang digunakan.

---

## 1. Tech Stack (Sesuai yang Terpasang)

| Layer | Teknologi | Status |
|---|---|---|
| Frontend | React 19 + Vite 8 + TypeScript | aktif |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-based `@import "tailwindcss"`) | aktif |
| State / data fetching | Zustand + TanStack Query | 🚧 rencana (belum di-install) |
| UI kit | Shadcn UI | 🚧 rencana |
| Backend | Express 5 + TypeScript (ESM) | aktif |
| ORM | Drizzle ORM (`node-postgres`) + `pg` | aktif |
| Database | PostgreSQL | aktif |
| Validasi | Zod v4 | aktif |
| Logging | Pino | aktif |
| Auth | JWT: access di memori FE (zustand) + refresh di httpOnly cookie (`Secure`,`SameSite=Lax`); bcryptjs; middleware `authGuard`/`rbacGuard` | **terimplementasi** (lihat `openspec/changes/add-auth`) |
| Scheduled Jobs | Vercel Cron → API route | 🚧 rencana (pengganti `node-cron`) |
| Deployment | Client & Server = 2 project Vercel terpisah, DB = Neon/Supabase Postgres | aktif (deploy via GitHub Actions) |

---

## 2. Arsitektur Tingkat Tinggi

```
┌─────────────────┐        HTTPS / REST        ┌──────────────────┐
│   React SPA      │ ─────────────────────────▶ │   Express API     │
│  (Vite + TS)      │◀───────────────────────── │  (Layered Arch)   │
└─────────────────┘        JSON + JWT           └──────────────────┘
                                                          │
                             ┌────────────────────────────┼─────────────────────────┐
                              ▼                            ▼                         ▼
                       Auth Middleware           Business Logic            Drizzle ORM
                  (authGuard / rbacGuard)        Services Layer                │
                                                                                ▼
                                                                         PostgreSQL DB
```

### Struktur `server/src` (aktual — flat, bukan `modules/`)

```
src/
├── app.ts                      # Express app TANPA listen (export default)
├── server.ts                   # app.listen — dev lokal
├── configs/
│   ├── db.ts                   # singleton Drizzle (node-postgres), export default
│   ├── env.ts                  # dotenv-flow + validasi zod
│   └── swagger.ts              # swagger-ui + swagger-autogen
├── routes/                     # <nama>.routes.ts
├── controllers/                # <nama>.controller.ts (tipis: validasi Zod + panggil service)
├── services/                   # <nama>.service.ts (logika murni, tanpa req/res)
├── middlewares/                # error-handler.ts, not-found-handler.ts, auth.middleware.ts
├── utils/                      # logger (pino), api-error, api-response, async-handler, shutdown, auth
├── constants/status-codes.ts
└── drizzle/
    ├── index.ts                # kumpulkan schema (export *)
    ├── schemas/                # <nama>.schema.ts (definisi tabel)
    └── migrations/             # hasil drizzle-kit generate
```

> **Pola layering (terterapkan sejak Auth):** `routes/` → `controllers/` (tipis, validasi Zod) → `services/` (logika murni) + `middlewares/` (`authGuard`/`rbacGuard`). Layer Repository akan menyusul saat modul bisnis dibuat. Definisi tabel sudah di `drizzle/schemas/`.

Frontend direncanakan struktur berbasis fitur (feature-based):
```
src/
├── features/{employees,leave,attendance,payroll,auth}/
├── components/ui/        # shadcn 🚧
├── stores/               # zustand 🚧
├── hooks/                # TanStack Query 🚧
└── lib/api.ts            # wrapper fetch ke backend
```

---

## 3. Skema Database (ERD Konseptual)

Didefinisikan di `server/src/drizzle/schemas/*.schema.ts` (satu file per modul). Tabel saat ini baru `users` (seed awal); sisanya rencana:

**users** — `id` (UUID PK), `email` (varchar unique), `password_hash` (varchar, bcryptjs), `role` enum(`STAFF`,`HRD`), `created_at`.

> **Keputusan desain (2026-08-25):** kolom `employee_id` (FK → `employees.id`) **DITUNDA** ke modul Employee agar scope auth self-contained. Saat ini `users` tidak memiliki FK ke `employees`; relasi 1—1 ditambahkan saat tabel `employees` dibuat. PK seluruh tabel = `uuid` (bukan `integer` seperti stub awal yang sudah dibuang).

Rencana relasi utama:
- `employees`: `id`, `full_name`, `department_id` (FK), `position`, `base_salary`, `join_date`, `status` enum(`ACTIVE`,`INACTIVE`)
- `departments`: `id`, `name`, `manager_id` (FK → employees.id)
- `leave_requests`: `id`, `employee_id` FK, `type` enum(`ANNUAL`,`SICK`,`UNPAID`), `start_date`, `end_date`, `reason`, `status` enum(`PENDING`,`APPROVED`,`REJECTED`), `approved_by` FK
- `attendance`: `id`, `employee_id` FK, `check_in_time`, `check_out_time`, `check_in_lat`/`check_in_lng`, `distance_from_office_m`, `is_valid_location` (bool), `status` enum(`ON_TIME`,`LATE`,`ABSENT`)
- `office_locations`: `id`, `latitude`, `longitude`, `radius_meters`
- `overtime_records`: `id`, `employee_id` FK, `date`, `hours`, `hourly_rate_multiplier`, `calculated_amount`, `status`
- `payroll`: `id`, `employee_id` FK, `period_month`, `period_year`, `base_salary`, `total_overtime`, `total_deduction`, `net_salary`, `generated_at`

Relasi: `employees 1—N attendance/leave_requests/overtime_records/payroll`, `departments 1—N employees`, `users 1—1 employees` (kecuali admin HRD tanpa data pegawai).

---

## 4. Desain RBAC (terimplementasi sejak Auth)

**Strategi token (desain terkunci):** akses JWT disimpan di memori frontend (zustand) dan dikirim via header `Authorization: Bearer`; refresh JWT **hanya** di httpOnly cookie (`Secure`, `SameSite=Lax`) — tidak terbaca JavaScript (XSS-safe) dan tidak butuh penyimpanan di server (cocok Vercel serverless). Logout cukup menghapus cookie (stateless). Detail di `openspec/changes/add-auth`.

| Resource | STAFF | HRD |
|---|---|---|
| Lihat profil sendiri | ✅ | ✅ |
| Lihat semua karyawan | ❌ | ✅ |
| Tambah/edit/hapus karyawan | ❌ | ✅ |
| Ajukan cuti | ✅ (milik sendiri) | ✅ |
| Approve/reject cuti | ❌ | ✅ |
| Check-in/out presensi | ✅ | ✅ |
| Lihat presensi semua karyawan | ❌ | ✅ |
| Lihat slip gaji sendiri | ✅ | ✅ |
| Lihat/generate slip gaji semua | ❌ | ✅ |
| Kelola lokasi kantor | ❌ | ✅ |

**Implementasi teknis:**
- Middleware `auth.middleware.ts`: `authGuard` (verifikasi access JWT → `req.user = { sub, role }`) + `rbacGuard(roles)` (403 bila `req.user.role` tidak di whitelist). Contoh: `router.get('/payroll/all', authGuard, rbacGuard(['HRD']), controller)`.
- Kasus "lihat data sendiri" dicek juga di **service layer** (`req.user.sub === resource.userId`), bukan hanya middleware.

---

## 5. Spesifikasi Fitur & Logika Bisnis

### 5.1 Absensi + Geolocation 🚧
1. Frontend `navigator.geolocation.getCurrentPosition()` saat "Check In".
2. Kirim `{ lat, lng, timestamp }` ke backend.
3. Backend hitung jarak ke `office_locations` via **Haversine**.
4. Jarak ≤ radius (mis. 100m) → `is_valid_location = true`; status dari jam vs standar (mis. >08.15 = LATE).
5. Luar radius → simpan tapi `is_valid_location = false` + warning.

### 5.2 Payroll & Lembur Otomatis 🚧
- Cron harian (Vercel Cron → API route) hitung `overtime_records` dari `check_out_time − jam_kerja_standar`.
- Rate: 1.5x/jam untuk 2 jam pertama, 2x setelahnya.
- Job bulanan: `base_salary + total_overtime − total_deduction` → record `payroll`.

### 5.3 Karyawan & Cuti 🚧
- CRUD karyawan + validasi (`base_salary > 0`, email unik).
- Leave request state machine: `PENDING → APPROVED/REJECTED`.

---

## 6. Daftar Endpoint API (Rencana)

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me          (authGuard)
POST   /api/v1/auth/logout      (authGuard)
POST   /api/employees
GET    /api/employees
GET    /api/employees/:id
PATCH  /api/employees/:id
DELETE /api/employees/:id
POST   /api/leave
GET    /api/leave/mine
GET    /api/leave
PATCH  /api/leave/:id/approve
PATCH  /api/leave/:id/reject
POST   /api/attendance/check-in
POST   /api/attendance/check-out
GET    /api/attendance/mine
GET    /api/attendance
GET    /api/payroll/mine
GET    /api/payroll
POST   /api/payroll/generate
GET    /api/office-locations
POST   /api/office-locations
```
Saat ini sudah ada `GET /api/v1/health` dan seluruh endpoint `POST /api/v1/auth/*` (register/login/refresh/me/logout) — lihat `routes/auth.routes.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts`, `middlewares/auth.middleware.ts`. Endpoint bisnis sisanya masih rencana.

---

## 7. Roadmap Implementasi (Saran Urutan)

1. **Setup DB**: Drizzle schema lengkap + migrasi + seeder (`drizzle/schemas/`, `db:generate`, `db:migrate`).
2. **Auth + RBAC**: **terimplementasi** (lihat `openspec/changes/add-auth`). Keputusan: token access di memori FE (zustand) + refresh di httpOnly cookie; bcryptjs; PK `uuid`; FK `users.employee_id` ditunda ke modul Employee. Auth menetapkan pola layering `routes → controller → service → middleware` untuk modul berikutnya.
3. **Modul Employee**: CRUD + halaman frontend (di sini FK `employee_id` ke `users` dibuat).
4. **Modul Attendance**: geolocation check-in/out.
5. **Modul Leave**: request + approval.
6. **Modul Overtime + Payroll** 🚧: Vercel Cron API route.
7. **Polish**: dashboard statistik, UI responsive.
8. **Deploy**: Vercel (FE) + Vercel serverless (BE) + Neon/Supabase (DB).

---

## 8. Supaya "Portfolio-Ready"

- Jelaskan 1–2 keputusan arsitektur di README (mis. "Haversine bukan Google Maps API" → cost & simplicity).
- Rekam GIF singkat per fitur utama.
- Deploy live + sediakan akun demo (STAFF/HRD) agar recruiter bisa coba langsung.
