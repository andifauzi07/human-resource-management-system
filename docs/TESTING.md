# Testing Guidelines — NexaHR

## Status Saat Ini
`client/package.json` dan `server/package.json` **belum menyertakan test runner** — belum ada Vitest, Jest, atau library testing lain terpasang. Dokumen ini adalah target/rencana pengujian begitu test runner ditambahkan, bukan sesuatu yang sudah aktif dijalankan lewat CI hari ini.

## Rencana Penambahan
```bash
# Server
npm install -D vitest supertest @types/supertest --prefix server

# Client
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom --prefix client
```
Tambahkan script di masing-masing `package.json`:
```json
{ "scripts": { "test": "vitest run", "test:watch": "vitest" } }
```
Setelah ini ditambahkan, `npm run test` (root, lihat `docs/01-PROJECT-STRUCTURE.md`) dan checklist di `docs/CONTRIBUTING.md` perlu diaktifkan kembali.

## Filosofi
Test bukan formalitas — tujuannya memastikan business logic sensitif (kalkulasi payroll, validasi geolocation, RBAC) tidak rusak diam-diam. Prioritaskan test pada:
1. Business logic (service layer) — **wajib**
2. Validasi input (Zod schema) — **wajib** untuk aturan kompleks (bukan sekadar required/optional)
3. API contract (controller/integration) — **wajib untuk endpoint kritikal**
4. Komponen UI kompleks — **disarankan**, bukan wajib untuk semua komponen

## Tooling (Rencana)
| Layer | Tool |
|---|---|
| Unit test (BE & FE) | Vitest |
| Integration test API | Vitest + Supertest |
| Component test | React Testing Library |
| Coverage | Vitest coverage (v8) |

## Struktur File
Test **colocated** dengan source, bukan folder `__tests__` terpisah:
```
server/src/modules/payroll/
├── payroll.service.ts
├── payroll.service.test.ts
├── payroll.schema.ts
├── payroll.controller.ts
└── payroll.controller.test.ts
```

## Konvensi Penamaan
```ts
describe('PayrollService', () => {
  describe('calculateOvertime', () => {
    it('should apply 1.5x rate for first 2 overtime hours', () => {})
    it('should apply 2x rate after 2 overtime hours', () => {})
    it('should return 0 when no overtime recorded', () => {})
  })
})
```
Pola: `should [expected behavior] when/for [condition]`.

## Area yang WAJIB Ditest (Setelah Test Runner Ada)

### Backend
- `payroll.service.ts` — kalkulasi gaji, overtime, deduction (edge case: gaji 0, lembur negatif, pembulatan)
- `attendance.service.ts` — validasi Haversine (dalam radius / luar radius / tepat di batas radius)
- `*.schema.ts` (Zod) — reject payload yang tidak valid, terutama enum status dan tipe angka/tanggal
- `rbac.middleware.ts` — setiap kombinasi role × endpoint harus punya test (akses ditolak & diizinkan)
- `leave.service.ts` — state transition (`PENDING → APPROVED/REJECTED`, tidak boleh approve dua kali)
- `auth.service.ts` — JWT expiry, refresh token flow, password hashing

### Frontend
- Form validation di halaman leave request & employee form
- Komponen yang menampilkan data sensitif (payroll, RBAC-gated UI) — pastikan role yang salah tidak melihat elemen tersebut
- Custom hook TanStack Query — mocking response sukses/gagal

## Contoh Integration Test (Supertest, Express 5)
```ts
import request from 'supertest'
import app from '../../app'  // app.ts, export Express app tanpa listen()

describe('POST /api/leave/:id/approve', () => {
  it('should return 403 when role is not authorized to approve', async () => {
    const res = await request(app)
      .post('/api/leave/123/approve')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(403)
  })
})
```

## Coverage Target
- Service layer (business logic): **≥ 80%**
- Controller/routes: **≥ 60%** (fokus pada happy path + auth guard)
- UI components: tidak dipatok angka — fokus pada komponen dengan logic, bukan presentational murni

## Menjalankan Test (Setelah Ditambahkan)
```bash
npm run test --prefix server
npm run test --prefix client
npm run test --prefix server -- --coverage
```

## Kapan Boleh Skip Test
Komponen UI murni presentational (tanpa logic, tanpa conditional rendering berbasis role) tidak wajib ditest. Tapi tulis catatan singkat di PR kenapa di-skip agar reviewer paham ini keputusan sadar, bukan lupa.
