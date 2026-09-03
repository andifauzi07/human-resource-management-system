## 1. Backend — Tambah status ke create

- [x] 1.1 Update `server/src/controllers/employee.controller.ts`: tambah `status: z.enum(["PROBATION", "ACTIVE", "ON_LEAVE", "RESIGNED"]).optional()` ke `createEmployeeSchema`
- [x] 1.2 Update `server/src/services/employee.service.ts`: tambah `status?: EmployeeStatus` ke `CreateEmployeeInput`
- [x] 1.3 Update `server/src/services/employee.service.ts` method `createEmployee`: pass `status` dari input ke insert values (kedua branch STAFF dan MANAGER) — jika tidak ada, biarkan DB default (`PROBATION`)

## 2. Backend — Tests

- [x] 2.1 Update `server/src/controllers/employee.controller.test.ts`: tambah test case create dengan field `status` pada body request
- [x] 2.2 Update `server/src/services/employee.service.test.ts`: tambah test case create employee dengan custom status (misal `ACTIVE`)

## 3. Frontend — API & Schema

- [x] 3.1 Update `client/src/features/employees/api.ts`: tambah `status?: EmployeeStatus` ke `CreateEmployeeInput`
- [x] 3.2 Update `client/src/features/employees/schema.ts`: tambah `status: statusEnum` ke `employeeFormSchema`

## 4. Frontend — Dialog

- [x] 4.1 Update `client/src/features/employees/components/employee-dialog.tsx`: tambah `status` ke interface `FormValues` (tipe `EmployeeStatus`, default `"PROBATION"`)
- [x] 4.2 Update `client/src/features/employees/components/employee-dialog.tsx`: tambah `"status"` ke array `editableFields`
- [x] 4.3 Update `client/src/features/employees/components/employee-dialog.tsx`: update initial state `useState<FormValues>` — set `status: employee?.status ?? "PROBATION"`
- [x] 4.4 Update `client/src/features/employees/components/employee-dialog.tsx`: tambah dropdown `Status` JSX (menggunakan `<Select>` dengan 4 opsi: PROBATION, ACTIVE, ON_LEAVE, RESIGNED) — posisikan setelah field jabatan
- [x] 4.5 Update `client/src/features/employees/components/employee-dialog.tsx`: update `doSubmit` create mode — kirim `status: parsed.data.status` ke `createMutation.mutateAsync`
- [x] 4.6 Update `client/src/features/employees/components/employee-dialog.tsx`: update `doSubmit` edit mode — kirim `status: parsed.data.status` ke `updateMutation.mutateAsync`

## 5. Verifikasi

- [x] 5.1 Jalankan `npm run lint:check --prefix server` dan `npm run lint --prefix client` — pastikan tidak ada error
- [x] 5.2 Jalankan `npm run typecheck` di root — pastikan lolos
- [x] 5.3 Jalankan `npm test --prefix server` — pastikan test baru lolos
- [x] 5.4 Jalankan `npm run docs --prefix server` — regen Swagger
