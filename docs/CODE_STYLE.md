# Code Style & Linting Guidelines

## Tooling
- **ESLint 10** (flat config, `eslint.config.js`/`.ts`) — konfigurasi terpisah di `client/` dan `server/`
- **Prettier** — di server terintegrasi lewat `eslint-plugin-prettier`; jalankan `npm run format:check` / `format:fix` di `server/`. Di client cukup lewat `eslint`.
- **TypeScript strict mode** — wajib aktif di semua `tsconfig.json`
- **ESM murni** (`"type": "module"` di kedua `package.json`) — perhatikan implikasi import (lihat bagian ESM di bawah)

## `tsconfig.json` — Base Compiler Options
Pastikan `client/tsconfig.json` dan `server/tsconfig.json` sama-sama memakai opsi berikut:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Catatan ESM
Karena `server/package.json` punya `"type": "module"`, hindari asumsi CommonJS:
- Import relatif di source TypeScript **tidak perlu** ekstensi `.js` selama pakai `tsc` + `tsc-alias` sesuai setup `build` script yang sudah ada (`tsc && tsc-alias`) — cukup konsisten dengan yang sudah dikonfigurasi, jangan campur gaya import.
- `__dirname`/`__filename` tidak tersedia langsung di ESM — kalau perlu, gunakan `import.meta.url` + `fileURLToPath`.
- Package pihak ketiga yang masih CommonJS-only kadang butuh `import pkg from 'pkg'; const { fn } = pkg` alih-alih named import langsung — cek dulu kalau ada error import.

## Aturan ESLint Kunci
- `no-explicit-any`: error (pakai `unknown` + type guard, bukan `any`)
- `no-unused-vars`: error
- `import/order`: import diurutkan — built-in → external → internal (`@/*`) → relative. (Alias `@/*` → `./src/*` hanya terpasang di `server/tsconfig.json`; `client/` belum punya path alias.)
- `eslint-plugin-boundaries` (opsional): mencegah `client/` mengimpor langsung dari `server/src` — komunikasi hanya lewat HTTP API. (Folder `shared/` 🚧 rencana, belum ada.)

## Konvensi Penamaan
| Jenis | Konvensi | Contoh |
|---|---|---|
| File komponen React | PascalCase | `EmployeeCard.tsx` |
| File service/util (server) | kebab-case dengan suffix jenis | `payroll.service.ts`, `payroll.schema.ts`, `payroll.repository.ts` |
| Interface/Type | PascalCase | `Employee`, `LeaveRequestDTO` |
| Zod schema | camelCase, suffix `Schema` | `createEmployeeSchema`, `updateLeaveSchema` |
| Enum | PascalCase, value UPPER_SNAKE | `enum LeaveStatus { PENDING, APPROVED }` |
| Konstanta global | UPPER_SNAKE_CASE | `MAX_LEAVE_DAYS_PER_YEAR` |
| Custom hook | prefix `use` | `useAttendanceStatus` |
| Zustand store | prefix `use`, suffix `Store` | `useAuthStore` |
| TanStack Query hook | prefix `use`, sesuai resource | `useEmployees`, `useCreateLeaveRequest` |

## Aturan Struktur Kode

### Backend (Layered)
- **Controller**: hanya urus request/response (parsing, status code) dan memanggil service — tidak boleh ada business logic
- **Schema (Zod)**: validasi input request (`body`/`query`/`params`) sebelum masuk ke controller/service — taruh di `*.schema.ts`, satu file per modul
- **Service**: seluruh business logic (kalkulasi, validasi bisnis, orchestration) tinggal di sini
- **Repository**: satu-satunya layer yang boleh mengimpor instance `db` (Drizzle) dan menjalankan query

❌ Salah (logic & akses DB bocor ke controller):
```ts
router.post('/payroll/generate', async (req, res) => {
  const overtime = hours > 8 ? (hours - 8) * rate * 1.5 : 0   // logic bocor
  const result = await db.insert(payrollTable).values({ ... }) // akses DB langsung dari controller
  res.json(result)
})
```

✅ Benar:
```ts
// payroll.schema.ts
export const generatePayrollSchema = z.object({
  body: z.object({ employeeId: z.string().uuid(), periodMonth: z.number().min(1).max(12) }),
})

// payroll.controller.ts
router.post('/payroll/generate', validate(generatePayrollSchema), async (req, res) => {
  const result = await payrollService.generate(req.body)
  res.json(result)
})

// payroll.service.ts
export async function generate(input: GeneratePayrollInput) {
  const overtime = calculateOvertime(input.hoursWorked, input.hourlyRate)
  return payrollRepository.create({ ...input, overtime })
}

// payroll.repository.ts
import db from '../../configs/db'
export async function create(data: NewPayroll) {
  return db.insert(payrollTable).values(data).returning()
}
```

### Logging
Pakai instance Pino (`src/utils/logger.ts`), **jangan** `console.log` di kode yang masuk ke `main`/PR:
```ts
import { logger } from '../../utils/logger'
logger.info({ employeeId }, 'Payroll generated successfully')
logger.error({ err }, 'Failed to calculate overtime')
```

### Frontend
> Stack frontend saat ini **baru React 19 + Vite + Tailwind CSS v4**. Zustand, TanStack Query, dan Shadcn **masih rencana** (belum di-install) — terapkan konvensi di bawah ini setelah library tersebut ditambahkan.

- Komponen presentational vs container dipisah bila komponen mulai > 150 baris
- Data fetching direncanakan lewat custom hook TanStack Query (`useEmployees()`), bukan `fetch` langsung di komponen
- State global (Zustand) hanya untuk state lintas-fitur (mis. auth session) — state lokal tetap `useState`
- Styling pakai utility class Tailwind langsung (Tailwind v4: cukup `@import "tailwindcss"` di `index.css`, tanpa `tailwind.config.ts`/`postcss.config`); hindari CSS module terpisah kecuali kasus animasi kompleks
- Komponen UI dasar direncanakan diambil dari Shadcn (`components/ui/`), bukan bikin ulang dari nol

## Format & Lint Command
```bash
npm run lint --prefix client
npm run lint:check --prefix server
npm run lint:fix --prefix server
npm run format:check --prefix server
npm run format:fix --prefix server
npm run typecheck --prefix server    # tsc --noEmit
```
Atau lewat root (lihat `docs/01-PROJECT-STRUCTURE.md`): `npm run lint`, `npm run lint:fix`, `npm run typecheck`.

## Pre-commit Hook
Hook `husky` ada di **root** (`.husky/pre-commit`), tetapi saat ini isinya `npm test` padahal script `test` belum ada — commit akan **gagal/terblokir**. Konfigurasi `lint-staged` (dan mengganti isi pre-commit ke `npx lint-staged`) **belum ditambahkan**. Lihat `docs/01-PROJECT-STRUCTURE.md` bagian "Husky & lint-staged" untuk rencananya. Waspadai saat melakukan commit.
