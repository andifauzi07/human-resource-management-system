# Struktur Proyek — HRIS

## Pendekatan
Satu repository, dua folder terpisah: `client/` (React 19 + Vite) dan `server/` (Express 5 + Drizzle ORM). Bukan monorepo dengan workspace tooling — masing-masing folder adalah proyek Node ESM (`"type": "module"`) dengan `package.json` sendiri. Keduanya di-deploy sebagai **dua project Vercel terpisah** (root directory `client/` dan `server/`) dari repo yang sama.

## Struktur Folder Aktual

```
hris/
├── client/                      # React 19 + Vite + TS (ESM) — frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css            # Tailwind CSS v4 via `@import "tailwindcss"`
│   │   └── assets/
│   ├── vite.config.ts           # plugin: @vitejs/plugin-react, @tailwindcss/vite
│   ├── eslint.config.js         # flat config (ESLint 10)
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   └── package.json
│
├── server/                      # Express 5 + TS (ESM) — backend
│   ├── src/
│   │   ├── app.ts               # Express app (TANPA listen) — export default
│   │   ├── server.ts            # app.listen — entry DEVELOPMENT LOKAL saja (prod: api/index.ts)
│   │   ├── configs/
│   │   │   ├── db.ts            # instance Drizzle (node-postgres), export default
│   │   │   ├── env.ts           # load + validasi env (dotenv-flow + zod)
│   │   │   └── swagger.ts       # setup swagger-ui + swagger-autogen
│   │   ├── routes/              # <nama>.routes.ts (flat — bukan modules/)
│   │   ├── controllers/         # <nama>.controller.ts (tipis, validasi Zod)
│   │   ├── services/            # <nama>.service.ts (logika murni, tanpa req/res)
│   │   ├── middlewares/         # error-handler.ts, not-found-handler.ts, auth.middleware.ts
│   │   ├── utils/               # logger (pino), api-error, api-response, async-handler, shutdown, auth.ts
│   │   ├── types/               # express.d.ts (augmentasi Request.user)
│   │   ├── constants/           # status-codes.ts
│   │   └── drizzle/
│   │       ├── index.ts         # kumpulkan semua schema (export *)
│   │       ├── schemas/         # <nama>.schema.ts (definisi tabel Drizzle)
│   │       └── migrations/      # hasil `db:generate` — JANGAN edit manual
│   ├── drizzle.config.ts        # config drizzle-kit (out: src/drizzle/migrations)
│   ├── swagger.config.ts        # generator dokumentasi API (swagger-autogen)
│   ├── .env.example             # template env (lihat CONTRIBUTING.md)
│   └── package.json
│
├── docs/                        # dokumentasi (file ini, ARCHITECTURE, CODE_STYLE, dst)
├── .husky/                      # git hooks — HARUS di root, bukan di dalam server/
│   └── pre-commit
├── .github/workflows/           # deploy-client.yml, deploy-server.yml (deploy only)
├── package.json                 # root — orkestrasi + husky
└── package-lock.json
```

## Stack & Status Implementasi

| Bagian | Tool | Status |
|---|---|---|
| Frontend framework | React 19 + Vite 8 + TypeScript (ESM) | aktif |
| Styling | Tailwind CSS v4 (plugin `@tailwindcss/vite`, CSS-based) | aktif |
| State / data fetching (Zustand, TanStack Query) | Zustand | aktif (auth store: `src/store/auth.store.ts`, API client: `src/lib/api.ts`) |
| UI kit (Shadcn) | — | rencana |
| Backend | Express 5 + TypeScript (ESM) | aktif |
| ORM | Drizzle ORM (`node-postgres`) + `pg` | aktif |
| Validasi input | Zod v4 | aktif |
| Logging | Pino | aktif |
| Dokumentasi API | swagger-autogen + swagger-ui-express | aktif |
| Auth / RBAC (JWT, middleware guard) | bcryptjs + jsonwebtoken | **terimplementasi** (`routes/auth.routes.ts`, `services/auth.service.ts`, `middlewares/auth.middleware.ts`) |
| Modul bisnis (employee/leave/attendance/payroll) | — | masih scaffold (`health` saja) |

## Catatan Penting (supaya tidak salah asumsi)

- **`shared/` dan alias `@shared/*` BELUM ADA.** Tipe lintas frontend-backend belum disepakati; jangan asumsikan ada sampai dibuat.
- Pola **`modules/<modul>/` + `*.repository.ts`** adalah **arsitektur target**, bukan struktur saat ini. Kode sekarang pakai folder flat `routes/` + `controllers/`. Saat menambah fitur, cocokkan dengan struktur yang ADA.
- **Serverless entry** sudah ada: `server/api/index.ts` + `server/vercel.json` (rewrites `/(.*)` → `/api`). `src/server.ts` hanya untuk dev lokal. Detail deploy di `DEPLOYMENT.md`.
- DB instance bersifat **singleton** di `configs/db.ts` (`export default db`). Impor dari sana; jangan membuat koneksi `pg` baru di tempat lain.

## `package.json` Root — Orkestrasi

Script server dan client tidak seragam (server pakai `lint:check`/`lint:fix`, client pakai `lint`) — root menjembatani ini:

```json
{
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
  }
}
```

Gunakan wrapper root (`npm run lint`, `npm run typecheck`, `npm run build`) supaya client & server tervalidasi bersama.

## Husky & lint-staged

`.husky/pre-commit` saat ini berisi `npm test`, **padahal script `test` belum ada** → setiap commit akan gagal/terblokir. Rencana: ganti isi pre-commit menjadi `npx lint-staged` dan tambahkan config `lint-staged` di **root** `package.json` (hook bekerja di level repo, bukan per-folder). Belum dikonfigurasi — waspadai saat melakukan commit.
