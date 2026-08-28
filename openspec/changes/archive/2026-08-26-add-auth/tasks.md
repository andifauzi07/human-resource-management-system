## 1. Schema & Database

- [x] 1.1 Redesain `server/src/drizzle/schemas/user.schema.ts`: hapus stub, buat `usersTable` dengan `id` uuid PK, `email` unique notNull, `password_hash` varchar notNull, `role` enum(`STAFF`,`HRD`) notNull default `STAFF`, `created_at` timestamp defaultNow. (TANPA `employee_id` — ditunda.)
- [x] 1.2 Jalankan `npm run db:generate --prefix server` lalu `npm run db:migrate --prefix server` (migrasi pertama/baseline).
- [x] 1.3 Tambah seeder user demo STAFF & HRD (password di-hash bcryptjs) — bisa via script `server/src/drizzle/seed.ts` atau `db:seed`.

## 2. Config & Dependencies

- [x] 2.1 Tambah `bcryptjs` + `@types/bcryptjs` ke `server/package.json` (`npm install`).
- [x] 2.2 Tambah validasi `JWT_SECRET`, `REFRESH_SECRET`, `CORS_ORIGIN` spesifik di `server/src/configs/env.ts` (Zod).
- [x] 2.3 Pastikan `helmet`/`cors` sudah mengizinkan credential & origin spesifik (sesuaikan `app.ts`).

## 3. Auth Utilities & Service

- [x] 3.1 Buat `server/src/utils/auth.ts`: `hashPassword`, `verifyPassword` (bcryptjs), `signAccessToken`, `signRefreshToken`, `verifyRefreshToken` (JWT, secret dari env).
- [x] 3.2 Buat `server/src/services/auth.service.ts`: `register`, `login`, `refresh`, `me`, `logout` (logika murni, tanpa akses req/res).
- [x] 3.3 Buat `server/src/controllers/auth.controller.ts` dengan validasi Zod per body (login/register).

## 4. Routes & Middleware

- [x] 4.1 Buat `server/src/routes/auth.routes.ts`: `POST /login`, `POST /refresh`, `GET /me`, `POST /logout` (guard pada `/me`).
- [x] 4.2 Buat `server/src/middlewares/auth.middleware.ts`: `authGuard` (verifikasi access token → `req.user`) dan `rbacGuard(roles)` (403 bila role tak diizinkan).
- [x] 4.3 Daftarkan `auth.routes` di `app.ts`.

## 5. Frontend Foundation (loop token)

- [x] 5.1 Buat `client/src/lib/api.ts`: wrapper fetch dengan header `Authorization` dari akses token di memori.
- [x] 5.2 Buat interceptor/helper: bila response 401 → `POST /api/auth/refresh` (cookie otomatis) → ulang request; simpan access token di zustand store.
- [x] 5.3 Set `withCredentials`/credential pada request agar cookie refresh terkirim lintas origin.

## 6. Docs, Swagger & Verify

- [x] 6.1 Regen Swagger: `npm run docs --prefix server`.
- [x] 6.2 Perbarui `docs/ARCHITECTURE.md` (skema `users`, strategi token B, bcryptjs, defer FK, RBAC) & `docs/01-PROJECT-STRUCTURE.md` (status auth, layering service).
- [x] 6.3 Jalankan `npm run lint && npm run typecheck && npm run build` di root → lolos.
- [x] 6.4 Smoke test: login demo → dapat access token → `/me` → `/refresh` → `/logout`.

## 7. Testing (Vitest — unit murni, tanpa DB)

- [x] 7.1 Pasang Vitest di server: `npm install -D vitest --prefix server`; tambah script `test` (`vitest run`) & `test:watch` (`vitest`) di `server/package.json` (sesuai `docs/TESTING.md`).
- [x] 7.2 Tambah `server/vitest.config.ts` dengan `test.env` berisi `JWT_SECRET`, `REFRESH_SECRET` (≥16 char), `DATABASE_URL` (dummy url valid, mis. `postgres://test:test@localhost:5432/test`), `CORS_ORIGIN`, `NODE_ENV=test` — agar `configs/env.ts` lolos validasi tanpa `.env` asli (diperlukan karena `utils/auth.ts` mengimpor `env`).
- [x] 7.3 `server/src/utils/auth.test.ts`: `hashPassword` menghasilkan hash bcrypt (bukan plaintext) & `verifyPassword` cocok; `verifyPassword` password salah → `false`; `signAccessToken`+`verifyAccessToken` roundtrip (`sub`+`role`); `signRefreshToken`+`verifyRefreshToken` roundtrip (`sub`); token dengan secret salah → throw; token kedaluwarsa → throw.
- [x] 7.4 `server/src/middlewares/auth.middleware.test.ts`: `authGuard` → 401 bila header `Authorization` kosong/bukan `Bearer `/token invalid, dan set `req.user` lalu `next()` bila token valid; `rbacGuard(roles)` → 401 bila `req.user` kosong, 403 bila `role` tak diizinkan, `next()` bila diizinkan.
- [x] 7.5 Jalankan `npm run test --prefix server` → hijau; pastikan `npm run lint && npm run typecheck` di root tetap lolos.

### Catatan strategi (belum dikerjakan di scope ini)

- DB di-mock (`vi.mock("../configs/db")`) bila suatu saat `auth.service.ts` ingin di-unit-test; untuk sekarang scope unit murni tidak menyentuh `db`.
- Bila kelak mau integration test (supertest register→login→me→refresh→logout), butuh test Postgres (Neon branch / Docker) karena skema pakai `pgEnum`.
