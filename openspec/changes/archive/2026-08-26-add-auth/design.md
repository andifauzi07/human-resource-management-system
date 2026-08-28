## Context

Proyek HRIS (portofolio) adalah greenfield: backend Express 5 + Drizzle hanya punya `health` route dan tabel `users` stub (`name, age, email`). Belum ada migrasi yang di-apply ke database, sehingga mendesain ulang skema bebas dari hutang migrasi. Frontend masih kosong (heading "HRIS" saja), tanpa router/state/API client.

Auth dibangun pertama karena ia menjadi **template arsitektur** untuk semua modul berikutnya (pola layering + middleware + kontrak token frontend).

Constraint utama:
- Deploy **serverless Vercel** → fungsi stateless, tidak ada memori bersama antar invocation. Refresh token tidak bisa disimpan di memory server.
- `AGENTS.md`: controller tipis, wajib Zod, akses DB terpusat di `configs/db.ts`, logging via Pino.

## Goals / Non-Goals

**Goals:**
- Fondasi auth yang aman: hash password (bcryptjs), JWT access + refresh.
- Kontrak token yang ramah serverless & XSS-safe.
- Middleware `authGuard` + `rbacGuard` yang dipakai semua endpoint masa depan.
- Menetapkan pola `routes → controller → service` (+ middleware) sebagai standar repo.
- Seed akun demo STAFF & HRD untuk rekruter.

**Non-Goals:**
- Tidak membangun modul Employee/Leave/Attendance/Payroll (terpisah).
- Tidak membuat FK `users.employee_id → employees.id` sekarang (ditunda ke modul Employee).
- Tidak membuat tabel `refresh_tokens` / denylist (logout cukup hapus cookie).
- Tidak membangun UI login lengkap di sini — hanya fondasi frontend (`lib/api.ts` + interceptor) agar loop token tertutup; halaman login menyusul.

## Decisions

### D1. Strategi token = access di memori FE + refresh di httpOnly cookie
- **Pilihan**: B (access JWT disimpan di zustand frontend; refresh JWT di `Set-Cookie` httpOnly, `Secure`, `SameSite=Lax`).
- **Alternatif ditolak**:
  - A (access + refresh terpisah, refresh di DB): terlalu banyak infra (tabel token, rotasi, revoke) untuk demo.
  - C (single JWT long-lived di cookie): token awet, kurang best-practice.
- **Rationale**: XSS-safe (cookie tak terbaca JS), tidak butuh penyimpanan refresh di server (stateless, cocok Vercel), jumlah kode sedang.

### D2. PK = UUID
- `users.id` dan `employees.id` (masa depan) pakai `uuid` sesuai ARCHITECTURE.md.
- **Rationale**: konsisten dengan dokumen; URL tidak mengungkap jumlah record.

### D3. Hashing = bcryptjs
- **Alternatif ditolak**: `argon2` (native build, berisiko di build Vercel).
- **Rationale**: pure JS, tanpa native compilation, deploy mulus di Vercel.

### D4. Defer FK `employee_id`
- `users` tidak punya kolom `employee_id` sekarang; FK dibuat saat modul Employee (migrasi terpisah).
- **Rationale**: menjaga scope auth self-contained tanpa mengunci ke tabel yang belum ada.

### D5. Logout stateless
- `/logout` hanya menghapus cookie refresh. Tidak ada denylist token.
- **Rationale**: cukup untuk demo; menyederhanakan arsitektur serverless.

### D6. Secrets & CORS
- `JWT_SECRET` (sign access) dan `REFRESH_SECRET` (sign refresh) divalidasi di `configs/env.ts`.
- `CORS_ORIGIN` harus nilai spesifik (bukan `*`) karena credential/cookie dikirim lintas origin.

## Risks / Trade-offs

- [Refresh cookie dicuri via MITM jika bukan HTTPS] → Mitigasi: flag `Secure` + deploy Vercel selalu HTTPS; `SameSite=Lax` batasi CSRF.
- [Access token di memori hilang saat refresh page] → Mitigasi: interceptor otomatis `POST /refresh` (cookie terkirim) saat dapat 401, sehingga user tak perlu login ulang.
- [Logout stateless: token lama masih valid sampai expiry] → Mitigasi: access token expiry pendek (~15m); dapat ditambah denylist nanti bila perlu.
- [bcryptjs lebih lambat dari argon2] → Mitigasi: cost factor default cukup untuk demo; bukan bottleneck.

## Migration Plan

1. `db:generate` → migrasi `users` baru (belum ada migrasi prior, jadi baseline).
2. `db:migrate` di lokal & Vercel (Neon/Supabase).
3. Jalankan seed user demo.
4. Deploy serverless: pastikan env `JWT_SECRET`, `REFRESH_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production` terisi.
5. **Rollback**: drop tabel `users` (migrasi pertama, aman karena belum ada data produksi) + revert env.

## Open Questions

- Durasi pasti access/refresh token (usulan: access 15m, refresh 7d) — dapat disetel di env.
- Apakah FE butuh halaman "login sebagai demo" satu klik untuk rekruter? (UI menyusul di modul FE auth).
