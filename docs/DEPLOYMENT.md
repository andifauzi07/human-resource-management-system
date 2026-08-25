# Deployment Guide — Client & Server Terpisah di Vercel

## Konsep
Repo tetap satu (`client/` + `server/`), tapi di Vercel dibuat **dua project terpisah** yang keduanya menunjuk ke repo GitHub yang sama:

| Vercel Project | Root Directory | Domain contoh |
|---|---|---|
| `nexahr-web` | `client` | `nexahr.vercel.app` |
| `nexahr-api` | `server` | `nexahr-api.vercel.app` |

Saat setup project baru di Vercel, pilih **"Root Directory"** sesuai folder masing-masing — Vercel akan build & deploy folder itu saja, seolah-olah itu repo sendiri.

---

## 1. Menyesuaikan `server/` agar Jalan sebagai Serverless Function

Express biasa jalan dengan `app.listen(PORT)`. Di Vercel, setiap request masuk lewat serverless function terpisah — perlu entry point khusus.

**Struktur tambahan di `server/`:**
```
server/
├── api/
│   └── index.ts          # entry point untuk Vercel
├── src/
│   ├── app.ts             # export Express app (TANPA app.listen)
│   └── server.ts          # untuk dev lokal saja (pakai app.listen)
├── vercel.json
└── package.json
```

**`server/src/app.ts`** — pisahkan definisi app dari proses listen:
```ts
import express from 'express'
import cors from 'cors'
import employeeRoutes from './modules/employees/employee.routes'
// ...import routes lain

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json())
app.use('/api/employees', employeeRoutes)
// ...routes lain

export default app
```

**`server/src/server.ts`** — dipakai HANYA untuk dev lokal:
```ts
import app from './app'

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Dev server running on :${PORT}`))
```

**`server/api/index.ts`** — entry point yang dibaca Vercel:
```ts
import app from '../src/app'

export default app
```

**`server/vercel.json`**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/api" }
  ]
}
```

**`server/package.json`** — pastikan script dev lokal tetap pakai `server.ts`:
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc"
  }
}
```

---

## 2. Cron Job (Payroll/Overtime) — Ganti `node-cron` dengan Vercel Cron

`node-cron` **tidak berfungsi** di serverless karena tidak ada proses yang hidup terus-menerus. Solusi: buat API route khusus yang dipanggil Vercel sesuai jadwal.

**`server/api/cron/calculate-overtime.ts`**:
```ts
import { calculateDailyOvertime } from '../../src/modules/overtime/overtime.service'

export default async function handler(req, res) {
  // Wajib validasi secret agar endpoint tidak bisa dipanggil sembarang orang
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  await calculateDailyOvertime()
  res.status(200).json({ success: true })
}
```

**Tambahkan di `server/vercel.json`**:
```json
{
  "crons": [
    { "path": "/api/cron/calculate-overtime", "schedule": "0 18 * * *" },
    { "path": "/api/cron/generate-payroll", "schedule": "0 0 1 * *" }
  ]
}
```
> Vercel otomatis mengirim header `Authorization: Bearer <CRON_SECRET>` bila `CRON_SECRET` diset di environment variables project. Jadwal pakai format cron standar (mis. `0 18 * * *` = tiap hari jam 18:00 UTC — sesuaikan timezone).

> Catatan plan: Vercel Cron di plan Hobby dibatasi jumlah & frekuensi eksekusi. Cek dashboard Vercel untuk limit terbaru sebelum mengandalkan jadwal yang terlalu sering.

---

## 3. CORS

Karena client dan server sekarang beda domain, tambahkan origin yang diizinkan lewat environment variable (lihat `app.ts` di atas):

**Env var di project `nexahr-api` (server) di Vercel dashboard:**
```
CLIENT_ORIGIN=https://nexahr.vercel.app
```

Untuk preview deployment (tiap PR dapat URL unik), pertimbangkan izinkan pattern `*.vercel.app` di CORS khusus environment preview, atau gunakan `process.env.VERCEL_ENV` untuk logic kondisional.

---

## 4. Environment Variables — Set Terpisah per Project

| Variable | Project `nexahr-web` (client) | Project `nexahr-api` (server) |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ (`https://nexahr-api.vercel.app`) | ❌ |
| `DATABASE_URL` | ❌ | ✅ (pooled connection string) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | ❌ | ✅ |
| `CLIENT_ORIGIN` | ❌ | ✅ |
| `CRON_SECRET` | ❌ | ✅ |

Set semua ini di **Vercel Dashboard → Project Settings → Environment Variables** masing-masing project, bukan lewat file `.env` yang di-commit.

Di `client/src/lib/api.ts`, base URL API diambil dari env:
```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
```

---

## 5. Koneksi Database & Prisma di Serverless

Serverless function bisa spawn banyak instance paralel saat traffic naik — tiap instance bikin koneksi Prisma sendiri, gampang bikin Postgres kehabisan connection slot.

**Solusi (pilih salah satu):**
- **Neon/Supabase pooled connection string** (biasanya port `6543` alih-alih `5432`) — paling simpel untuk demo portofolio.
- **Prisma Accelerate** — connection pooling + caching dari Prisma, butuh setup tambahan tapi lebih robust.

Tambahkan juga pola singleton untuk Prisma Client agar tidak instansiasi ulang tiap invocation:
```ts
// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 6. Ignored Build Step — Hindari Rebuild yang Tidak Perlu

Karena satu repo dipakai dua project Vercel, perubahan di `client/` sebenarnya tidak perlu memicu rebuild `server`, begitu juga sebaliknya.

Di **Project Settings → Git → Ignored Build Step**, isi command berikut:

**Project `nexahr-web` (root: `client`):**
```bash
git diff --quiet HEAD^ HEAD -- ./
```
(Vercel otomatis scope ke root directory yang diset, jadi command ini cukup untuk skip build jika tidak ada perubahan di `client/`)

**Project `nexahr-api` (root: `server`):**
Sama, otomatis ter-scope ke folder `server/`.

> Default behavior Vercel sebenarnya sudah cukup pintar untuk root directory-based projects — opsi ini berguna kalau ingin kontrol lebih eksplisit, misal skip build untuk perubahan yang hanya di folder `docs/`.

---

## 7. Ringkasan Perbedaan Dev Lokal vs Production

| Aspek | Dev Lokal | Production (Vercel) |
|---|---|---|
| Server entry | `src/server.ts` (`app.listen`) | `api/index.ts` (serverless) |
| Cron | `node-cron` in-process | Vercel Cron → API route |
| CORS origin | `http://localhost:5173` | `CLIENT_ORIGIN` env var |
| DB connection | Direct | Pooled connection string |
| API base URL (client) | `http://localhost:4000` | `VITE_API_BASE_URL` |

---

## 8. Checklist Sebelum Deploy Pertama Kali
- [ ] `server/src/app.ts` terpisah dari `server.ts`, tidak ada `app.listen()` di path yang dibaca Vercel
- [ ] `server/vercel.json` sudah ada rewrites + crons
- [ ] Environment variables sudah diisi lengkap di kedua project Vercel
- [ ] `DATABASE_URL` pakai pooled connection string, bukan direct
- [ ] CORS `CLIENT_ORIGIN` sudah sesuai domain client production
- [ ] `CRON_SECRET` diset dan divalidasi di setiap cron handler
- [ ] Uji endpoint cron manual dulu (`curl` dengan header Authorization) sebelum mengandalkan jadwal otomatis
