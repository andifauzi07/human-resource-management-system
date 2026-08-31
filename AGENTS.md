# AGENTS.md — Panduan untuk AI Coding Agent

Dibaca sebelum mengubah repo ini. Tujuannya: agent menghasilkan kode konsisten tanpa manusia menjelaskan ulang konteks tiap sesi.

## Konteks Proyek

ini adalah demo HRIS (karyawan, cuti, absensi, payroll/lembur, RBAC). Satu repo, **dua package terpisah** (bukan monorepo tooling):

- `client/` — React 19 + Vite + TypeScript, ESM (`"type": "module"`)
- `server/` — Express 5 + Drizzle ORM + pg + Zod + Pino + Swagger, ESM

Keduanya di-deploy sebagai **dua project Vercel terpisah** dari repo yang sama (`client/` dan `server/` sebagai root directory masing-masing).

> **Penting:** `docs/` memisahkan dengan jelas bagian yang **sudah diimplementasi** vs yang masih **rencana** (ditandai 🚧). Bila ragu, percayai kode aktual di `server/src` / `client/src` daripada bagian rencana. Fakta terverifikasi: ORM = Drizzle/pg (bukan Prisma), struktur server flat (`routes/`+`controllers/`+`configs/db.ts`), migrasi di `server/src/drizzle/migrations/`, port `9000`, env = `NODE_ENV`/`PORT`/`DATABASE_URL`/`LOG_LEVEL`/`CORS_ORIGIN`.

## Perintah Developer

Gunakan wrapper root agar kedua package ikut tervalidasi:

- `npm run install:all` — install root + client + server
- `npm run dev` — jalankan client & server bersama (concurrently)
- `npm run lint` / `npm run typecheck` / `npm run build` — menjalankan **client & server**. Pakai ini, bukan cuma `--prefix server`, supaya typecheck client tidak kelewat.
- Per-package bila perlu: `npm run lint --prefix client` (eslint), `npm run lint:check --prefix server`, `npm run db:generate|db:migrate|db:studio --prefix server`, `npm run docs --prefix server` (regen Swagger).
- `npm run dev --prefix server` otomatis set `NODE_ENV=development` (via cross-env).

## Arsitektur Aktual `server/src` (ikuti struktur yang ADA)

Struktur saat ini **flat**, bukan `modules/`:

- `app.ts` — satu-satunya entry: Express app (default export) + bootstrap `listen` ter-guard `!process.env.VERCEL` (lokal/dev saja; di serverless Vercel tidak bind port).
- `routes/`, `controllers/`, `middlewares/` (baru `error-handler`, `not-found-handler`), `configs/` (`db.ts`, `env.ts`, `swagger.ts`), `utils/` (`logger.ts`, `api-error.ts`, `api-response.ts`, `async-handler.ts`, `shutdown.ts`), `constants/status-codes.ts`.
- DB instance = `configs/db.ts` (Drizzle + pg Pool). Definisi tabel ada di `drizzle/schemas/*.schema.ts`. Migration di `src/drizzle/migrations/`.

> Saat menambah fitur: **cocokkan dengan struktur flat yang ada**. Jangan membuat folder `modules/` atau `repository/` kecuali diminta migrasi — docs menyebut pola itu sebagai target, bukan keadaan sekarang.

## Aturan Wajib

1. **Controller tipis:** validasi + panggil service + kirim response. Kalkulasi (payroll, lembur, geolocation) masuk ke service.
2. **Setiap endpoint wajib Zod schema** untuk body/query/params; jangan percaya `req.body` mentah.
3. **Akses db terpusat.** Saat ini lewat `configs/db.ts`. Bila nanti ada layer repository, db hanya boleh di repository — jangan sebar instance `db` ke service/controller.
4. **Jangan edit migration** di `server/src/drizzle/migrations/` yang sudah di-apply. Ubah `drizzle/schemas/*.schema.ts` lalu:
   ```bash
   npm run db:generate --prefix server
   npm run db:migrate --prefix server
   ```
5. **Logging pakai Pino** (`utils/logger.ts`), bukan `console.log`.
6. **Backend serverless (Vercel):** jangan pakai `node-cron` atau proses long-running. Cron → API route dipicu Vercel Cron (validasi `CRON_SECRET`).
7. **RBAC:** middleware tolak role yang jelas tidak berhak, tapi cek "boleh lihat data sendiri" juga di service layer (bandingkan `req.user` dengan resource). _(Auth/RBAC middleware belum ada — buat saat diperlukan.)_
8. **Tambah/ubah endpoint → regen Swagger:** `npm run docs --prefix server`.
9. **Jangan tambah dependency tanpa alasan**; cek dulu apa yang sudah tersedia.

## Verifikasi Sebelum Menyatakan Selesai

Jalankan di root (pastikan lolos):

```bash
npm run lint && npm run typecheck && npm run build
```

- **CI (GitHub Actions) hanya deploy** — tidak menjalankan lint/typecheck/build. Checklist lokal adalah satu-satunya gerbang kualitas.
- **Test runner terpasang di `server/`** (Vitest). Jalankan via `npm test --prefix server`. `client/` belum punya test runner — jangan asumsikan `npm test --prefix client` ada. Lihat `docs/TESTING.md`.

## Gotchas

- **Husky pre-commit saat ini berisi `npm test`, padahal tidak ada script `test`** → setiap commit akan gagal/terblokir. Rencana (`docs/01-PROJECT-STRUCTURE`) seharusnya `npx lint-staged` + config `lint-staged` di root (belum ditambahkan). Waspadai saat melakukan commit.
- **Env server** di-load via `dotenv-flow` + validasi Zod di `configs/env.ts`. Butuh file `.env` (development/production) dengan minimal `NODE_ENV`, `PORT`, `DATABASE_URL`, `LOG_LEVEL`, `CORS_ORIGIN` sebelum server jalan. (`JWT_SECRET`/`CRON_SECRET` belum divalidasi karena Auth & Cron masih rencana.)
- Dokumentasi & komunikasi repo menggunakan **Bahasa Indonesia** — jaga konsistensi.

## Jangan Lakukan Tanpa Konfirmasi Eksplisit

- Hapus/ubah struktur tabel yang sudah berisi data (termasuk edit migration lama).
- Ubah kontrak API (nama field response, status code) yang sudah dipakai frontend.
- Ubah aturan RBAC / matriks permission (`docs/ARCHITECTURE.md`).
- Ganti library inti (Drizzle, Express, dsb.).
- Pindahkan config `husky`/`lint-staged` ke dalam `server/` — harus tetap di root.
- Buat `package-lock.json` manual di `client/` atau `server/` — tiap folder punya lockfile sendiri; install di folder yang benar (`--prefix client`/`--prefix server`).
