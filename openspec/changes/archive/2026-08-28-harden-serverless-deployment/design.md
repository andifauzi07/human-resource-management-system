# Design — Harden Serverless Deployment

## Context

Server Express (`server/`) dideploy sebagai dua project Vercel terpisah dari repo yang sama (`hriss-api` untuk backend, `hrd-management-system` untuk frontend). Kondisi saat ini:

- `vercel.json` memakai `"functions": {"dist/server.js": ...}` tanpa `rewrites` dan `outputDirectory: dist` — trafik API tidak ter-routing ke function dan hasil kompilasi dilayani sebagai file statis publik.
- Development dan production memakai **satu database Neon yang sama**; URL produksi tertarik ke `.env.local` via `vercel env pull`, dan karena precedence dotenv-flow, script lokal (`db:seed`, `db:migrate`) menulis ke database production.
- Audit keamanan menemukan: registrasi publik menerima field `role` (eskalasi privilese ke `HRD`), cookie refresh `SameSite=Lax` tidak akan pernah terkirim lintas-situs di production, Swagger selalu publik.
- Ritme pengembangan: **per modul** dengan skema hampir selalu additive (tabel baru), sehingga sinkronisasi skema dev→prod cukup diselesaikan oleh replay jurnal migrasi Drizzle.

Kendala dari AGENTS.md: controller tipis, Zod di semua endpoint, logging Pino, tanpa dependency baru tanpa alasan, migrasi lama tidak boleh diedit.

## Goals / Non-Goals

**Goals:**

- API benar-benar dilayani sebagai Vercel serverless function dengan routing yang benar.
- Lingkungan dev (Postgres lokal via Docker) dan prod (Neon tunggal) sepenuhnya terpisah; kesalahan lokal secara struktural tidak dapat menyentuh produksi.
- Skema produksi ter-update otomatis lewat pipeline CI setiap ada migrasi baru (urutan: migrate → deploy).
- Menutup lubang otorisasi registrasi dan membuat cookie refresh berfungsi lintas-situs dengan mitigasi CSRF.
- File env yang mudah diprediksi: default non-rahasia dikomit, rahasia hanya lokal/secret.

**Non-Goals:**

- Tidak mengubah kontrak response API lain maupun struktur tabel existing.
- Tidak menambahkan rate limiting in-code (cukup perlindungan tingkat platform Vercel untuk skala demo).
- Tidak membeli/custom domain (dicatat sebagai peningkatan masa depan; lihat Decision D4).
- Tidak menyentuh cron/payroll (masih rencana), tidak mengubah aturan RBAC matriks.
- Tidak men-setup test runner (diatur TESTING.md, di luar change ini).

## Decisions

### D1. Database dev = Postgres lokal via Docker Compose (bukan branching/two-DB Neon)

| Alternatif | Alasan ditolak |
|---|---|
| Branching Neon | Tidak ada mekanisme merge antar branch — tidak membantu propagasi skema yang menjadi kebutuhan utama; menambah konsep baru |
| Dua database dalam satu project Neon | Masih menyimpan kredensial cloud dev di laptop; latensi migrate/seed; kuota |
| Satu DB + schema terpisah | Rawan salah tulis lintas schema |

Dipilih lokal karena: operasi migrate/seed instan, reset total sepele (`down -v`), kredensial produksi **tidak pernah ada di laptop** sehingga kesalahan manusia secara struktural mustahil, dan biaya nol. `docker-compose.yml` mem-pin versi mayor Postgres agar paritas dengan Neon.

### D2. Sinkronisasi skema = replay jurnal migrasi di CI

Folder `src/drizzle/migrations/` dikomit adalah sumber kebenaran tunggal; tabel jurnal internal membuat `db:migrate` idempotent terhadap DB mana pun.

- **Amandemen (pasca-implementasi):** step deploy CLI (`vercel pull/build/deploy`) dihapus dari `deploy-server.yml` setelah `vercel build` gagal persisten di runner GitHub (`spawn npm ENOENT`, CLI 59.x, dua pola invocation berbeda). Deploy kini ditangani **Vercel Git Integration** (build di infra Vercel), dan workflow CI **hanya migrasi** — nama job disesuaikan.
- Konsekuensi ordering: migrasi berjalan **paralel** dengan build Vercel (bukan strictly sebelum deploy). Risiko jendela waktu diterima karena migrasi per modul bersifat additive (kode baru hanya membaca tabel baru yang dibuat migrasinya; jendela ketidaksesuaian hitungan detik–menit pada traffic solo). Keputusan sadar ini melonggarkan prinsip AGENTS.md "CI hanya deploy".
- Postgres punya *transactional DDL*: migrasi gagal rollback bersih dan terlihat merah di Actions — sinyal untuk hotfix, deploy tetap berjalan.

### D3. Entry serverless: `server/api/index.ts` + rewrites penuh

Pola target:

```
server/
├── api/
│   └── index.ts        # export default app (handler; @vercel/node membungkus Express app)
├── src/
│   ├── app.ts          # tetap: export default app, tanpa listen
│   └── server.ts       # dev-only: app.listen + graceful shutdown
└── vercel.json         # { "rewrites": [{ "source": "/(.*)", "destination": "/api" }] }
```

`outputDirectory` dan blok `functions.dist/server.js` dihapus sehingga `dist/` tidak lagi dilayani statis (menutup kebocoran kode terkompilasi). `includeFiles` untuk `swagger.json` dievaluasi ulang: jika docs dibaca dari runtime path, gunakan opsi include pada `api/**`. `main` di package.json tetap `dist/server.js` untuk start lokal produksi-simulasi.

### D4. Cookie refresh: `SameSite=None; Secure` + validasi `Origin`

`hrd-management-system.vercel.app` → `hriss-api.vercel.app` adalah lintas-situs karena `vercel.app` berada di Public Suffix List. Konsekuensi: `SameSite=Lax` menahan cookie pada fetch lintas-situs → `/auth/refresh` selalu 401 di production (berfungsi normal di localhost, jadi gagal hanya terlihat pasca-deploy).

- Mitigasi CSRF wajib karena `None` membolehkan pengiriman lintas-situs: endpoint konsumen cookie (`/refresh`, `/logout`) memvalidasi header `Origin` terhadap allowlist `CORS_ORIGIN`; request tanpa `Origin` (curl) diteruskan. Permintaan form-classic juga sudah terblokir karena parser JSON menolak content-type lain.
- Alternatif custom domain satu induk (`app.x.com`/`api.x.com`, Lax tetap aman) ditunda — catat sebagai peningkatan masa depan; jika suatu saat dibeli, atribut cukup dikembalikan ke `Lax` lewat satu konstanta.

### D5. Registrasi publik tanpa `role`

Hapus `role` dari `registerSchema` (Zod) sehingga nilai itu tak pernah sampai service; service selalu insert `STAFF`. Penetapan `HRD` hanya via `db:seed` (dan kelak alur admin). Perubahan **breaking** minor untuk kontrak request register.

### D6. Refactor `env.ts` dan layering file `.env*`

- `PORT` opsional default 9000 (Vercel Functions tidak menyediakan `PORT`); tambah `ENABLE_DOCS` (opsional, default `true` development; production ditentukan di dashboard).
- Kegagalan validasi: `throw` error terstruktur berisi daftar variabel bermasalah — tanpa `process.exit(1)`/`console.error` (Lambda melaporkan penyebab lebih jelas; konsisten aturan Pino).
- File: `.env.example` (template, komit), `.env.development` (default lokal non-rahasia, **dikomit** — isi `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hris`), rahasia pribadi hanya `.env.development.local` (gitignored). `.gitignore` server & root diperketat: abaikan semua `.env*` kecuali dua file di atas. `.env.local` existing dihapus dari workspace.
- `drizzle.config.ts` dan tooling CLI tidak lagi menuntut secret auth (baca env minimal via jalur yang sama).

### D7. Runtime tuning serverless

- Pool `pg`: `max: 3` (default 10 × banyak instance cold-start dapat menghabiskan slot koneksi Neon free tier). URL produksi tetap pooled connection string dari Neon.
- `app.set("trust proxy", 1)` — di belakang proxy Vercel agar `req.ip` mencerminkan klien (prasyarat logging IP/firewall yang akurat).
- Morgan dipertahankan sementara untuk HTTP log (stdout terekam Vercel); migrasi penuh ke `pino-http` bukan cakupan change ini.

### D8. Swagger: publik sebagai fitur portofolio, dikontrol `ENABLE_DOCS`

Keputusan produk sadar: dokumentasi terbuka memudahkan rekruter mencoba API. Flag env memberi kill-switch tanpa deploy ulang kode. Ketika off → route docs merespons 404.

### D9. Preview deployment dimatikan untuk `hris-api`

Kerja solo + uji lokal sebelum push menghapus kebutuhan environment preview dan database staging. Diatur di Vercel Dashboard (Settings → Git), bukan kode.

### D10. Perlindungan tingkat platform

Aktifkan Vercel Firewall/WAF dasar (rate protection bawaan) pada `hris-api` — tanpa dependency baru (sesuai aturan AGENTS.md #9). Rate limiting presisi in-code (Upstash Redis) ditunda sampai ada indikasi kebutuhan nyata.

## Risks / Trade-offs

- [Migrasi otomatis di CI menjalankan DDL ke produksi tanpa mata manusia] → Migrasi per-modul additive berisiko rendah; transactional DDL membatalkan deploy saat gagal; disiplin AGENTS.md #4 (migrasi ter-apply immutable) dipertahankan; rehearse migrasi besar secara manual ke salinan lokal bila perlu.
- [`SameSite=None` memperluas permukaan CSRF] → Ditutup dengan validasi `Origin` + parser JSON ketat; cookie tetap `HttpOnly; Secure`.
- [Paritas lokal ≠ Neon (ekstensi, versi)] → Pin versi mayor Postgres di Compose sama dengan Neon; fitur geolokasi dihitung di service layer (bukan ekstensi DB) sesuai arsitektur.
- [`.env.development` terkomit bisa salah isu kredensial] → Hanya berisi kredensial dummy lokal; `.gitignore` menutup semua varian lain; audit grep host produksi masuk checklist tasks.
- [Docs publik membocorkan permukaan API] → Diterima sebagai trade-off portofolio; kill-switch `ENABLE_DOCS`.
- [Preview mati = bug hanya terlihat setelah merge ke main] → Gerbang lokal (`lint && typecheck && build`) + smoke test manual terhadap deployment production setelah rilis.
- [Cookie flag berubah perilaku untuk klien existing] → Semua origin yang sah harus tercantum di `CORS_ORIGIN` production; frontend sudah mengirim `credentials: "include"`.

## Migration Plan

1. **Repo/config**: docker-compose, `.env*` restructure, `.gitignore`, refactor `env.ts`/`db.ts` (pool max), entry `api/index.ts`, `vercel.json` baru, perbaikan auth (role, cookie, Origin guard, trust proxy).
2. **Verifikasi lokal**: `docker compose up -d` → `db:migrate && db:seed` → `npm run dev` → smoke test login/refresh/logout/me + RBAC; pastikan refresh bekerja lintas port localhost.
3. **Vercel Dashboard**: hapus var env usangan (mis. `PORT` jika mau), set `ENABLE_DOCS=true`, pastikan `DATABASE_URL` Production menunjuk Neon pooled; matikan Preview Deployment untuk `hris-api`; aktifkan Firewall dasar.
4. **GitHub**: tambahkan secret `PROD_DATABASE_URL` (pooled, user produksi); update `deploy-server.yml` (step migrate sebelum deploy).
5. **Rilis**: push → pantau workflow (migrate sukses → deploy sukses) → smoke test production: login FE, refresh setelah 15 menit, akses `/api/docs`, cek tidak ada aset dist publik.
6. **Rollback**: revert commit + redeploy versi sebelumnya via Vercel; migrasi yang sudah apply tidak di-rollback (additive → kode lama tetap kompatibel).

## Open Questions

- Versi mayor Postgres di Neon saat ini (untuk pin image Compose) — dicek di dashboard Neon saat implementasi.
- Apakah `swagger.json` perlu `includeFiles` eksplisit pada fungsi `api/**`, atau dibaca via import bundel — diputuskan saat implementasi D3.
