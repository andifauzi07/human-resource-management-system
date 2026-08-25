# Deployment Guide — Client & Server Terpisah di Vercel

## Konsep
Repo tetap satu (`client/` + `server/`), tapi di Vercel dibuat **dua project terpisah** yang menunjuk ke repo GitHub yang sama:

| Vercel Project | Root Directory | Domain contoh |
|---|---|---|
| `hris-web` | `client` | `hris.vercel.app` |
| `hris-api` | `server` | `hris-api.vercel.app` |

Saat setup project baru di Vercel, pilih **"Root Directory"** sesuai folder masing-masing — Vercel akan build & deploy folder itu saja, seolah-olah itu repo sendiri.

---

## 1. Deploy Otomatis via GitHub Actions (Sudah Ada)

`.github/workflows/deploy-client.yml` & `deploy-server.yml` menangani deploy — bukan `vercel` CLI manual:

- Trigger: `push` ke `main`, dengan `paths` filter (`client/**` / `server/**`) agar hanya project yang berubah yang di-deploy.
- Langkah: `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`.
- Node version di CI: **20**.
- Butuh secret repo: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_FRONTEND_PROJECT_ID` / `VERCEL_BACKEND_PROJECT_ID`.

> Belum ada workflow CI untuk `lint`/`typecheck`/`build` — verifikasi lokal (`npm run lint && npm run typecheck && npm run build`) adalah gerbang kualitas satu-satunya sebelum push.

---

## 2. Menyesuaikan `server/` agar Jalan sebagai Serverless Function 🚧

Express biasa jalan dengan `app.listen(PORT)` (`server/src/server.ts`). Di Vercel, tiap request masuk lewat serverless function — butuh entry point khusus. **Ini belum di-setup** (belum ada `server/api/index.ts` maupun `vercel.json`).

Rencana struktur tambahan di `server/`:
```
server/
├── api/
│   └── index.ts          # entry serverless Vercel (import app dari src/app)
├── vercel.json           # rewrites + crons
└── package.json
```
- `src/app.ts` sudah benar dipisah dari `listen` (export default app, tanpa `app.listen`) — syarat mutlak agar bisa diimpor Vercel.
- `server.ts` tetap untuk dev lokal saja.
- `vercel.json` (rencana):
  ```json
  { "rewrites": [ { "source": "/(.*)", "destination": "/api" } ] }
  ```

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
CORS_ORIGIN=https://hris.vercel.app
```
Untuk preview deployment (tiap PR dapat URL unik), izinkan pattern `*.vercel.app` atau pakai `process.env.VERCEL_ENV` untuk logic kondisional.

---

## 5. Environment Variables — Set Terpisah per Project

| Variable | `hris-web` (client) | `hris-api` (server) |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ (`https://hris-api.vercel.app`) | ❌ |
| `NODE_ENV` | ❌ | ✅ (`production`) |
| `PORT` | ❌ | ✅ (`9000`) |
| `DATABASE_URL` | ❌ | ✅ (pooled connection string) |
| `LOG_LEVEL` | ❌ | ✅ (`info`) |
| `CORS_ORIGIN` | ❌ | ✅ |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | ❌ | 🚧 (saat Auth dibuat) |
| `CRON_SECRET` | ❌ | 🚧 (saat Cron dibuat) |

Set di **Vercel Dashboard → Project Settings → Environment Variables** masing-masing project.
Di `client`, base URL API direncanakan diambil dari `import.meta.env.VITE_API_BASE_URL` (belum dipakai karena frontend masih scaffold).

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
| Server entry | `src/server.ts` (`app.listen`) | `api/index.ts` 🚧 (serverless) |
| Cron | `node-cron` in-process 🚧 | Vercel Cron → API route 🚧 |
| CORS origin | `http://localhost:5173` | `CORS_ORIGIN` env var |
| DB connection | Direct | Pooled connection string |
| API base URL (client) | `http://localhost:9000` | `VITE_API_BASE_URL` 🚧 |

---

## 9. Checklist Sebelum Deploy Pertama Kali
- [ ] `server/src/app.ts` terpisah dari `server.ts` (sudah — tidak ada `app.listen` di app.ts)
- [ ] `server/vercel.json` 🚧 (rewrites + crons) — belum dibuat
- [ ] `server/api/index.ts` 🚧 — belum dibuat
- [ ] Environment variables lengkap di kedua project Vercel
- [ ] `DATABASE_URL` pakai pooled connection string (port `6543`), bukan direct
- [ ] `CORS_ORIGIN` sudah sesuai domain client production
- [ ] `CRON_SECRET` divalidasi di setiap cron handler (saat Cron dibuat)
- [ ] Uji endpoint cron manual (`curl` + header Authorization) sebelum mengandalkan jadwal otomatis
