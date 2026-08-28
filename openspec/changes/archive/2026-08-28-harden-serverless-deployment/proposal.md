# Proposal: Harden Serverless Deployment

## Why

Server `server/` belum benar-benar berjalan sebagai serverless function di Vercel: `vercel.json` saat ini tidak memiliki `rewrites`, malah mengekspos hasil kompilasi `dist/` sebagai file statis publik. Di saat yang sama, development dan production memakai satu database Neon yang sama sehingga migrasi/seed lokal dapat menulis ke data produksi, dan audit keamanan menemukan lubang eskalasi privilese pada endpoint registrasi publik. Perbaikan ini harus dilakukan sebelum modul-modul berikutnya (cuti, absensi, payroll) dikembangkan agar siklus "selesaikan di dev → migrate → deploy" aman sejak awal.

## What Changes

- **BREAKING**: Endpoint `POST /auth/register` tidak lagi menerima field `role` dari publik — setiap registrasi baru selalu `STAFF`; penetapan `HRD` hanya lewat seed/admin.
- Cookie refresh token diubah menjadi `SameSite=None; Secure` karena FE (`hrd-management-system.vercel.app`) dan BE (`hriss-api.vercel.app`) berada lintas-situs (`*.vercel.app` masuk Public Suffix List), disertai validasi `Origin` pada endpoint yang mengonsumsi cookie sebagai mitigasi CSRF.
- Entry serverless baru `server/api/index.ts` (impor `app` tanpa `app.listen`) dan `vercel.json` ditulis ulang memakai `rewrites` — `dist/` tidak lagi dilayani sebagai output statis.
- Database development dipindah ke **Postgres lokal via Docker Compose**; database production tetap Neon tunggal. Kredensial produksi tidak pernah tersimpan di laptop (hanya GitHub Secrets dan Vercel Dashboard).
- Migrasi skema ke produksi otomatis di pipeline: step `db:migrate` (memakai secret `PROD_DATABASE_URL`) berjalan **sebelum** `vercel deploy` di `deploy-server.yml` — konvergensi skema dev→prod via jurnal migrasi git.
- Restrukturisasi file environment: `.env.development` (non-rahasia, dikomit) untuk default lokal, `.gitignore` diperketat untuk semua varian `.env*`, `.env.example` diperbarui.
- Schema env disesuaikan: `PORT` opsional (default 9000), variabel baru `ENABLE_DOCS`, error validasi env melempar exception terstruktur (tanpa `process.exit`/`console.error`).
- Swagger UI tetap publik di production sebagai fitur portofolio, dikontrol flag `ENABLE_DOCS`.
- Preview Deployment dimatikan untuk project `hris-api`.
- Pengaturan koneksi: pool `pg` dibatasi (`max` kecil) untuk kesesuaian dengan kuota koneksi Neon, dan Express `trust proxy` diaktifkan di belakang proxy Vercel.

## Capabilities

### New Capabilities

- `environment-configuration`: Kontrak variabel environment (wajib/opsional/default), strategi file `.env*` (dotenv-flow), penyediaan Postgres development lokal via Docker Compose, dan jaminan kredensial produksi terpisah dari lingkungan lokal.
- `serverless-deployment`: Perilaku deploy API sebagai Vercel serverless function — entry point, routing (`rewrites`), urutan pipeline migrasi+deploy di CI, penonaktifan preview, gating dokumentasi Swagger, dan perlindungan dasar tingkat platform.

### Modified Capabilities

- `user-auth`: Registrasi publik tidak lagi menerima `role` (selalu `STAFF`); atribut cookie refresh menjadi `SameSite=None; Secure` dengan mitigasi CSRF berupa validasi `Origin`.

## Impact

- **Kode**: `server/src/configs/env.ts`, `server/src/configs/db.ts`, `server/src/app.ts`, `server/src/controllers/auth.controller.ts`, `server/api/index.ts` (baru), `server/src/server.ts` (dev-only), `server/drizzle.config.ts`.
- **Konfigurasi**: `server/vercel.json` (ditulis ulang), `server/package.json` (script dev db), `docker-compose.yml` (baru, root atau `server/`), `.gitignore` (root & server).
- **CI/CD**: `.github/workflows/deploy-server.yml` (+ secret repo baru `PROD_DATABASE_URL`), pengaturan Vercel Dashboard (matikan Preview, set env Production, aktifkan Firewall dasar).
- **Frontend**: `client/` perlu `credentials: "include"` sudah ada di CORS; tidak ada perubahan kontrak API selain field `role` yang dihapus dari request registrasi (**BREAKING** minor).
- **Dokumentasi**: `docs/DEPLOYMENT.md`, `docs/CONTRIBUTING.md`, `AGENTS.md` (catatan gotcha husky/test tidak berubah), `docs/01-PROJECT-STRUCTURE.md` (struktur `server/api/`).
- **Database**: tidak ada perubahan skema tabel; hanya strategi lingkungan. Migration lama yang sudah apply tidak disentuh.
