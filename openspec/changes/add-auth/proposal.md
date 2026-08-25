## Why

Proyek masih greenfield: hanya ada `health` route dan tabel `users` stub (`name, age, email`) yang tidak cocok dengan skema yang direncanakan. Tanpa auth, tidak ada fondasi untuk RBAC dan seluruh modul bisnis (employee, leave, attendance, payroll) akan mengambil keputusan ad-hoc. Auth dibangun pertama agar ia menetapkan pola layering (routes → controller → service → middleware) sekaligus kontrak token yang dipakai frontend.

## What Changes

- Redesain tabel `users` (hapus stub): `id` UUID PK, `email` unique, `password_hash`, `role` enum (`STAFF`, `HRD`), `created_at`. FK `employee_id → employees.id` **ditunda** ke modul Employee.
- Tambah dependency `bcryptjs` untuk hashing password (pure JS, aman di Vercel serverless).
- Implementasi `auth.service.ts` (register/login/refresh/me/logout) + `auth.controller.ts` + `auth.routes.ts` dengan validasi Zod per-endpoint.
- Implementasi `auth.middleware.ts`: `authGuard` (verifikasi JWT, isi `req.user`) dan `rbacGuard(roles)` (cek whitelist role, 403).
- Strategi token **B**: access JWT disimpan di memori frontend (zustand), refresh JWT di httpOnly cookie (`Secure`, `SameSite=Lax`). Logout = hapus cookie (stateless, tanpa denylist).
- Seed user demo STAFF dan HRD untuk keperluan portofolio.
- Regen Swagger (`npm run docs`).
- Perbarui `docs/ARCHITECTURE.md` & `docs/01-PROJECT-STRUCTURE.md` agar mencerminkan keputusan desain (token B, bcryptjs, uuid, defer FK).

## Capabilities

### New Capabilities
- `user-auth`: login/logout/refresh/me, hashing bcryptjs, strategi token access(memori)+refresh(httpOnly cookie), dan middleware `authGuard`/`rbacGuard`.

### Modified Capabilities
<!-- tidak ada capability eksisting (belum ada spec) -->

## Impact

- **DB**: migrasi pertama (`db:generate` + `db:migrate`) — belum ada migrasi yang di-apply, jadi aman mendesain ulang `users`.
- **Backend**: `server/src` mendapat layer `services/` dan `middlewares/auth.*` pertama; menetapkan template untuk modul berikutnya.
- **Frontend**: butuh `lib/api.ts` + interceptor token (diimplementasikan di modul/auth frontend terpisah, lihat tasks).
- **Config**: `CORS_ORIGIN` harus spesifik (bukan `*`) karena credential/cookie; `JWT_SECRET` & `REFRESH_SECRET` baru di-validasi di `env.ts`.
- **Deps**: `bcryptjs` (+ `@types/bcryptjs`) di `server`.
