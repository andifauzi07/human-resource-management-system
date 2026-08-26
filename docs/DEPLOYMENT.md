# Deployment Guide — Client & Server Terpisah di Vercel

## Konsep
Repo tetap satu (`client/` + `server/`), tapi di Vercel dibuat **dua project terpisah** yang menunjuk ke repo GitHub yang sama:

| Vercel Project | Root Directory | Domain contoh |
|---|---|---|
| `hris-web` | `client` | `hris.vercel.app` |
| `hris-api` | `server` | `hris-api.vercel.app` |

Saat setup project baru di Vercel, pilih **"Root Directory"** sesuai folder masing-masing — Vercel akan build & deploy folder itu saja, seolah-olah itu repo sendiri.

---

## 1. Deploy via Vercel Git Integration + Actions untuk Migrasi ✅

Dua peran dipisah agar masing-masing berjalan di tempat yang paling andal:

| Jalur | Tanggung jawab | Pemicu |
|---|---|---|
| **Vercel Git Integration** | Build & deploy aplikasi (root directory: `server`) | push ke `main` yang menyentuh `server/**` |
| **GitHub Actions** (`deploy-server.yml`) | Migrasi database production (`PROD_DATABASE_URL`) | push yang sama |

> Catatan sejarah: deploy via CLI (`vercel pull/build/deploy --prebuilt`) sempat dipakai lalu dihapus karena `vercel build` gagal persisten di GitHub Actions runner (`spawn npm ENOENT`, CLI 59.x). Secret `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_BACKEND_PROJECT_ID` tidak lagi dibutuhkan oleh workflow (boleh dihapus, atau dibiarkan tak terpakai).
>
> Ordering: migrasi berjalan paralel dengan build Vercel. Aman karena skema per modul bersifat additive — kode baru hanya mengonsumsi tabel yang dibuat migrasinya.

> Belum ada workflow CI untuk `lint`/`typecheck`/`build` — verifikasi lokal (`npm run lint && npm run typecheck && npm run build`) adalah gerbang kualitas satu-satunya sebelum push.

---

## 2. Server sebagai Serverless Function ✅

Deploy memakai **deteksi otomatis Express** milik Vercel (zero-configuration): Vercel mengenali `src/app.ts` (lokasi entry yang diakui: `app`/`index`/`server` di root atau `src/`, dengan default export) lalu membungkus seluruh aplikasi menjadi satu Vercel Function di atas Fluid compute. `src/server.ts` hanya untuk development lokal.

```
server/
├── src/
│   ├── app.ts              # default export — terdeteksi Vercel sebagai entry produksi
│   └── server.ts           # app.listen — khusus development lokal
└── package.json
```

- **Tanpa** folder `api/`, **tanpa** `vercel.json`, **tanpa** build command custom — platform yang mengompilasi TS dan men-trace dependensi.
- `swagger.json` ikut ter-bundle otomatis karena diimpor statis di `configs/swagger.ts`.
- Swagger UI dikontrol flag `ENABLE_DOCS` — flag nonaktif → `/api/docs` merespons 404.
- Catatan cron mendatang: konfigurasi `crons` nanti ditambahkan lewat file `vercel.json` baru saat modul Cron dibuat.

---

## 3. Cron Job (Payroll/Overtime) — Ganti `node-cron` dengan Vercel Cron 🚧

`node-cron` **tidak berfungsi** di serverless (tidak ada proses yang hidup terus-menerus). Solusi: API route khusus dipanggil Vercel Cron.

```ts
// server/api/cron/calculate-overtime.ts
import { calculateDailyOvertime } from '../src/modules/overtime/overtime.service' // 🚧 modul belum ada

export default async function handler(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  await calculateDailyOvertime()
  return new Response(JSON.stringify({ success: true }))
}
```
Tambahkan di `vercel.json`:
```json
{ "crons": [ { "path": "/api/cron/calculate-overtime", "schedule": "0 18 * * *" } ] }
```
> `CRON_SECRET` **belum** ada di `src/configs/env.ts` (Auth & Cron masih rencana). Tambahkan ke schema env bila sudah digunakan.

---

## 4. CORS

Karena client & server beda domain, origin diizinkan lewat env var **`CORS_ORIGIN`** (dibaca di `src/app.ts` via `env.CORS_ORIGIN`), bukan `CLIENT_ORIGIN`.

Env var di project `hris-api` (server) di Vercel Dashboard:
```
CORS_ORIGIN=https://hrd-management-system.vercel.app
```
Origin ini juga menjadi allowlist `originGuard` untuk endpoint konsumen cookie refresh.
Preview deployment untuk server dimatikan (lihat §5a), sehingga tidak perlu pola wildcard tambahan.

---

## 5. Environment Variables — Set Terpisah per Project

| Variable | `hris-web` (client) | `hris-api` (server) |
|---|---|---|
| `VITE_API_URL` | ✅ (`https://hriss-api.vercel.app/api/v1` — wajib menyertakan `/api/v1`) | ❌ |
| `NODE_ENV` | ❌ | ✅ (`production`; Vercel juga men-set otomatis) |
| `PORT` | ❌ | ❌ (opsional, default 9000 — Vercel Functions tidak memakainya) |
| `DATABASE_URL` | ❌ | ✅ (pooled connection string Neon production) |
| `LOG_LEVEL` | ❌ | ✅ (`info`) |
| `CORS_ORIGIN` | ❌ | ✅ (`https://hrd-management-system.vercel.app`) |
| `ENABLE_DOCS` | ❌ | ✅ (`true` — Swagger publik sebagai fitur portofolio) |
| `JWT_SECRET` / `REFRESH_SECRET` | ❌ | ✅ (nilai kuat & unik, ≠ secret development) |
| `CRON_SECRET` | ❌ | 🚧 (saat Cron dibuat) |

Set di **Vercel Dashboard → Project Settings → Environment Variables** masing-masing project.
Development lokal TIDAK memakai kredensial produksi sama sekali — default ada di
`server/.env.development` (dikomit, non-rahasia), rahasia pribadi di
`server/.env.development.local` (gitignored).

### Secret tambahan di GitHub (repo)

| Secret | Nilai |
|---|---|
| `PROD_DATABASE_URL` | Pooled connection string database Neon **production** — dipakai step migrasi CI sebelum deploy |

---

## 5a. Database: Development Lokal vs Production

```
LAPTOP                                    CLOUD
Postgres lokal (docker-compose.yml)       Neon production (satu DB)
  ▲ dev/migrate/seed                        ▲ DATABASE_URL (Vercel Prod env)
  └── jurnal migrations/ (git) ═══════════► db:migrate via GitHub Actions,
                                              SEBELUM vercel deploy
```

- **Dev**: `docker compose up -d` di root repo (Postgres versi mayor disamakan dengan Neon), lalu `npm run db:migrate --prefix server && npm run db:seed --prefix server`. Reset total: `docker compose down -v`.
- **Prod**: skema dikonvergensikan lewat replay jurnal migrasi yang sama. Step `Run Database Migrations (Production)` di `deploy-server.yml` berjalan **sebelum** `vercel deploy`; migrasi idempotent dan gagal-migrasi membatalkan deploy.
- Migrasi bersifat additive per modul (tabel baru) sehingga urutan migrate→deploy aman untuk kode lama.
- Kredensial produksi HANYA hidup di GitHub Secrets dan Vercel Dashboard — tidak pernah di file lokal.
- **Preview Deployment untuk `hris-api` DIMATIKAN** (Project Settings → Git) — tidak ada environment preview, pengujian pra-push dilakukan lokal.

### Checklist manual Vercel Dashboard (sekali setup)

- [ ] Project `hris-api`: matikan **Preview Deployment** (Settings → Git)
- [ ] Set `ENABLE_DOCS=true` pada environment Production (atau biarkan default)
- [ ] Verifikasi `DATABASE_URL` Production = pooled connection string Neon
- [ ] Aktifkan **Vercel Firewall** dasar (proteksi rate tingkat platform)
- [ ] Tambahkan secret repo GitHub `PROD_DATABASE_URL`

---

## 6. Koneksi Database (Drizzle + pg) di Serverless

Serverless function bisa spawn banyak instance paralel saat traffic naik — tiap instance membuka koneksi `pg` sendiri, gampang bikin Postgres kehabisan connection slot.

**Solusi:** pakai **pooled connection string** dari Neon/Supabase (biasanya port `6543` alih-alih `5432`). Drizzle instance sudah singleton di `src/configs/db.ts` (`drizzle(env.DATABASE_URL)`), jadi cukup pastikan `DATABASE_URL` yang di-set di Vercel adalah versi pooled.

---

## 7. Ignored Build Step — Hindari Rebuild yang Tidak Perlu

Karena satu repo dipakai dua project Vercel, perubahan di `client/` sebaiknya tidak memicu rebuild `server`, begitu juga sebaliknya. Di **Project Settings → Git → Ignored Build Step**:

**Project `hris-web` (root: `client`):**
```bash
git diff --quiet HEAD^ HEAD -- ./
```
**Project `hris-api` (root: `server`):** sama, otomatis ter-scope ke folder `server/`.

---

## 8. Ringkasan Dev Lokal vs Production

| Aspek | Dev Lokal | Production (Vercel) |
|---|---|---|
| Server entry | `src/server.ts` (`app.listen`) | auto-detect `src/app.ts` (zero-config) ✅ |
| Database | Postgres lokal (Docker Compose) | Neon production |
| DB connection | Direct (`localhost:5432`) | Pooled connection string |
| Migrasi skema | Manual lokal (`db:migrate`) | Otomatis di CI, sebelum deploy ✅ |
| CORS origin | `http://localhost:5173` | `CORS_ORIGIN` env var |
| Swagger docs | Aktif (`ENABLE_DOCS=true` default) | Flag `ENABLE_DOCS` (portfolio: aktif) |
| Preview deploy | — | Dimatikan untuk `hris-api` |
| API base URL (client) | fallback `http://localhost:9000/api/v1` | `VITE_API_URL` ✅ (termasuk `/api/v1`) |

---

## 9. Checklist Sebelum Deploy
- [x] Deteksi otomatis Express (`src/app.ts` default export) — tanpa `api/` & `vercel.json` ✅
- [x] Migrasi produksi otomatis via CI sebelum deploy ✅
- [ ] Environment variables lengkap di kedua project Vercel (termasuk `ENABLE_DOCS`)
- [ ] Secret repo GitHub `PROD_DATABASE_URL` dibuat (pooled connection string)
- [ ] `CORS_ORIGIN` production = domain client (`https://hrd-management-system.vercel.app`)
- [ ] Preview Deployment `hris-api` dimatikan + Firewall dasar aktif
- [ ] `CRON_SECRET` divalidasi di setiap cron handler (saat Cron dibuat)
- [ ] Uji endpoint cron manual (`curl` + header Authorization) sebelum mengandalkan jadwal otomatis
