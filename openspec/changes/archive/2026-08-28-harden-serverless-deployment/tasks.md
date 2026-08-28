## 1. Lingkungan Development Lokal

- [x] 1.1 Buat `docker-compose.yml` (root) dengan service Postgres versi mayor yang sama dengan Neon, database `hris`, kredensial non-rahasia, port 5432, volume persisten
- [x] 1.2 Tulis ulang `server/.env.example`: tambah `ENABLE_DOCS`, hapus asumsi `PORT` wajib, beri komentar per variabel
- [x] 1.3 Buat `server/.env.development` (dikomit): `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hris`, PORT, LOG_LEVEL, CORS_ORIGIN localhost, secret dev dummy
- [x] 1.4 Perketat `.gitignore` server & root: abaikan semua `.env*` kecuali `.env.example` dan `.env.development`; hapus `server/.env.local` dari workspace

## 2. Refactor Konfigurasi Env & DB

- [x] 2.1 Ubah `server/src/configs/env.ts`: `PORT` opsional default 9000, tambah `ENABLE_DOCS` opsional, ganti `process.exit(1)`/`console.error` dengan throw error terstruktur berisi daftar variabel bermasalah
- [x] 2.2 Pastikan `drizzle.config.ts` dan script CLI tidak lagi menuntut secret auth saat menjalankan tooling
- [x] 2.3 Ubah `server/src/configs/db.ts`: set pool `max: 3` dengan komentar alasan (kuota koneksi Neon × instance serverless)

## 3. Perbaikan Keamanan Auth

- [x] 3.1 Hapus field `role` dari `registerSchema` di `auth.controller.ts`; pastikan service selalu insert role `STAFF`
- [x] 3.2 Ubah atribut cookie refresh (`setRefreshCookie`/`clearRefreshCookie`) menjadi `sameSite: "none", secure: true`
- [x] 3.3 Tambah middleware/guard validasi header `Origin` terhadap allowlist `CORS_ORIGIN` pada endpoint `/auth/refresh` dan `/auth/logout` (request tanpa Origin diteruskan; origin asing → 403)
- [x] 3.4 Set `app.set("trust proxy", 1)` di `app.ts` dengan komentar konteks proxy Vercel

## 4. Entry Serverless Vercel

- [x] 4.1 Buat `server/api/index.ts` yang mengekspor handler dari `src/app` tanpa `app.listen`
- [x] 4.2 Tulis ulang `server/vercel.json`: rewrites `/(.*)` → `/api`, hapus `outputDirectory` dan blok `functions.dist/server.js`; pastikan `swagger.json` tetap terbaca runtime (includeFiles pada `api/**` bila perlu)
- [x] 4.3 Tandai `server/src/server.ts` sebagai entry dev-only (komentar/header singkat) dan pastikan tidak diimpor jalur produksi
- [x] 4.4 Kontrol Swagger dengan `ENABLE_DOCS` di `configs/swagger.ts`: flag nonaktif → route docs 404

## 5. CI/CD — Pipeline Migrasi + Deploy

- [x] 5.1 Update `.github/workflows/deploy-server.yml`: tambah step `db:migrate` dengan env `DATABASE_URL=${{ secrets.PROD_DATABASE_URL }}` sebelum step deploy Vercel
- [x] 5.2 Dokumentasikan pembuatan secret repo `PROD_DATABASE_URL` (pooled connection string Neon production)
- [x] 5.3 Catat langkah manual Vercel Dashboard: matikan Preview Deployment untuk `hris-api`, set `ENABLE_DOCS=true` (Production), verifikasi `DATABASE_URL` Production pooled, aktifkan Firewall dasar — masukkan ke checklist `docs/DEPLOYMENT.md`

## 6. Verifikasi Lokal End-to-End

- [x] 6.1 `docker compose up -d && npm run install:all && npm run db:migrate --prefix server && npm run db:seed --prefix server` — environment dev siap dari nol tanpa file rahasia
- [x] 6.2 Smoke test lokal: register (dengan attempt body `role: "HRD"` → hasil STAFF), login, refresh, me, logout, RBAC hrd-area; refresh bekerja antar origin localhost FE/BE
- [x] 6.3 Jalankan gerbang kualitas root: `npm run lint && npm run typecheck && npm run build`

## 7. Verifikasi Produksi Pasca-Rilis

- [x] 7.1 Push ke main → pantau workflow: migrasi sukses lalu deploy sukses; uji skenario migrasi gagal membatalkan deploy (bisa disimulasikan di branch)
- [x] 7.2 Smoke test production `hriss-api.vercel.app`: `/api/v1/auth/login` dari `hrd-management-system.vercel.app`, refresh token terkirim lintas-situs (cookie `SameSite=None`), docs tampil, path aset `dist/` tidak publik
- [x] 7.3 Audit: grep repository memastikan tidak ada kredensial produksi terkomit; perbarui `docs/DEPLOYMENT.md`, `docs/CONTRIBUTING.md`, dan `docs/01-PROJECT-STRUCTURE.md` sesuai kondisi baru
