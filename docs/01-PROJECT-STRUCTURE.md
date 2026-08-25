# Struktur Proyek — NexaHR (Monolitik, Satu Repo)

## Pendekatan
Satu repository, dua folder utama yang jelas terpisah: `client` (React 19 + Vite) dan `server` (Express 5 + Drizzle ORM). Bukan monorepo dengan workspace tooling — masing-masing folder adalah proyek Node ESM (`"type": "module"`) dengan `package.json` sendiri.

## Struktur Folder

```
nexahr/
├── client/                      # React 19 + Vite + TS — frontend
│   ├── src/
│   │   ├── features/
│   │   │   ├── employees/
│   │   │   ├── leave/
│   │   │   ├── attendance/
│   │   │   ├── payroll/
│   │   │   └── auth/
│   │   ├── components/ui/        # komponen shadcn
│   │   ├── stores/                 # Zustand (state lintas-fitur, mis. auth session)
│   │   ├── hooks/                  # custom hooks + TanStack Query
│   │   └── lib/
│   │       └── api.ts            # wrapper fetch ke backend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── eslint.config.js          # flat config (ESLint 10)
│   └── tsconfig.json
│
├── server/                       # Express 5 + TS (ESM) — backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   ├── leave/
│   │   │   ├── attendance/
│   │   │   ├── payroll/
│   │   │   └── overtime/
│   │   │       ├── overtime.controller.ts
│   │   │       ├── overtime.service.ts
│   │   │       ├── overtime.repository.ts
│   │   │       ├── overtime.routes.ts
│   │   │       └── overtime.schema.ts     # Zod schema validasi input
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   └── error.middleware.ts        # error handler terpusat
│   │   ├── db/
│   │   │   ├── schema.ts                  # definisi tabel Drizzle
│   │   │   ├── index.ts                   # instance db (drizzle + pg Pool)
│   │   │   └── seed.ts                    # seeding manual via tsx
│   │   ├── jobs/
│   │   │   └── payroll-cron.ts
│   │   ├── utils/
│   │   │   ├── geolocation.ts
│   │   │   └── logger.ts                  # instance Pino
│   │   ├── config/
│   │   │   └── env.ts                     # load + validasi env (dotenv-flow + zod)
│   │   ├── app.ts                         # Express app: helmet, cors, cookie-parser, routes — TANPA listen
│   │   └── server.ts                       # app.listen — entry point dev & production
│   ├── drizzle/
│   │   └── migrations/                     # hasil `db:generate`, jangan diedit manual
│   ├── drizzle.config.ts
│   ├── swagger.config.ts                   # generator dokumentasi API
│   ├── .env.development
│   ├── .env.production
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                       # Tipe TS yang dipakai bareng client & server
│   └── types/
│       ├── employee.types.ts
│       ├── attendance.types.ts
│       ├── payroll.types.ts
│       └── rbac.types.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   ├── TESTING.md
│   ├── CODE_STYLE.md
│   ├── AGENTS.md
│   ├── DEPLOYMENT.md
│   └── GIT_WORKFLOW.md
│
├── .husky/                       # git hooks — HARUS di root, bukan di dalam server/
│   └── pre-commit
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── package.json                  # root — orkestrasi + husky + lint-staged lintas folder
└── README.md
```

## Stack Client (Rencana)
`client/package.json` saat ini baru berisi React + Vite + TS dasar (belum ada Tailwind/Zustand/TanStack Query di `dependencies`), tapi struktur folder di atas sudah disiapkan untuk stack tujuan berikut — sesuai yang dipakai di proyek lain pada resume Anda:

| Kebutuhan | Library | Ditaruh di |
|---|---|---|
| Styling | Tailwind CSS | konfigurasi via `tailwind.config.ts`, dipakai langsung di komponen |
| UI Kit | Shadcn UI | `components/ui/` |
| State lintas-fitur | Zustand | `stores/` |
| Data fetching & caching | TanStack Query | custom hooks di `hooks/`, mis. `useEmployees()`, `useAttendance()` |

Tambahkan saat mulai coding fitur pertama:
```bash
npm install --prefix client zustand @tanstack/react-query
npm install --prefix client -D tailwindcss postcss autoprefixer
npx --prefix client tailwindcss init -p
```
Shadcn UI diinstal per-komponen lewat CLI-nya sendiri (`npx shadcn@latest add button`, dst) saat komponen itu dibutuhkan — bukan sekaligus di awal.

## Kenapa Ada Folder `shared/`?
Karena `server/package.json` sudah punya `tsc-alias`, path alias TypeScript (`@/*`) di-resolve otomatis saat build backend. Manfaatkan pola yang sama untuk folder `shared/`:

**`server/tsconfig.json`**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"]
    }
  }
}
```

**`client/tsconfig.json`** (Vite tidak otomatis baca `paths` tsconfig — tambahkan juga alias di `vite.config.ts`):
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
})
```

## `package.json` Root — Orkestrasi
Script server dan client **tidak seragam** (server pakai `lint:check`/`lint:fix`, client pakai `lint`) — root menjembatani ini:

```json
{
  "name": "nexahr",
  "private": true,
  "scripts": {
    "install:all": "npm install && npm install --prefix client && npm install --prefix server",
    "dev": "concurrently -n CLIENT,SERVER -c blue,green \"npm run dev --prefix client\" \"npm run dev --prefix server\"",
    "lint": "npm run lint --prefix client && npm run lint:check --prefix server",
    "lint:fix": "npm run lint --prefix client -- --fix && npm run lint:fix --prefix server",
    "format": "npm run format:check --prefix server",
    "format:fix": "npm run format:fix --prefix server",
    "typecheck": "tsc -b --noEmit client && npm run typecheck --prefix server",
    "build": "npm run build --prefix client && npm run build --prefix server",
    "prepare": "husky"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "husky": "^9.1.7",
    "lint-staged": "^17.3.0"
  }
}
```

> **Catatan penting:** saat ini belum ada script `test` di `client` maupun `server` — package.json keduanya belum menyertakan test runner. Lihat `docs/TESTING.md` untuk rencana penambahannya.

## Husky & lint-staged — Harus di Root
`server/package.json` saat ini sudah punya config `lint-staged`, tapi git hook (`.husky/`) **wajib diinisialisasi di root repo**, karena hook bekerja terhadap `.git` di level repo, bukan per-folder. Pindahkan konfigurasi:

**Root `package.json`** — tambahkan:
```json
{
  "lint-staged": {
    "server/src/**/*.ts": [
      "npm run lint:fix --prefix server --",
      "npm run format:fix --prefix server --"
    ],
    "client/src/**/*.{ts,tsx}": [
      "npm run lint --prefix client -- --fix"
    ]
  }
}
```
```bash
npx husky init          # dijalankan sekali di ROOT repo, bukan di dalam server/
```
Isi `.husky/pre-commit`:
```bash
npx lint-staged
```
