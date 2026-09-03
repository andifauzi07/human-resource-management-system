## Why

Saat ini HRD tidak bisa menentukan status karyawan saat pertama kali membuatnya — status selalu default `PROBATION`. Dalam beberapa kasus (misalnya transfer dari perusahaan lain yang sudah melewati masa percobaan), HRD perlu langsung menetapkan status `ACTIVE` atau lainnya. HRD juga perlu mengubah status karyawan yang sudah ada melalui dialog edit, namun field status saat ini tidak ditampilkan di dialog edit.

## What Changes

- **Backend `POST /employees`**: Tambah field opsional `status` pada `createEmployeeSchema` (Zod) dan `CreateEmployeeInput` (service). Jika disertakan, gunakan nilai tersebut sebagai status awal karyawan (bukan selalu `PROBATION`). Jika tidak, tetap default `PROBATION`.
- **Backend `createEmployee` service**: Pass `status` dari input ke insert values jika disertakan.
- **Frontend `employee-dialog.tsx`**: Tambah dropdown `Status` pada dialog create DAN edit (6 field inti: nama, department, jabatan, status, gaji, tanggal gabung). Default `PROBATION` saat create, current status saat edit.
- **Frontend `employeeFormSchema`**: Tambah field `status` (opsional) ke schema create.
- **Frontend `api.ts`**: Tambah `status` ke `CreateEmployeeInput`.

## Capabilities

### New Capabilities

_(tidak ada)_

### Modified Capabilities

- `employee-management`: Penambahan field `status` opsional pada `POST /employees` — HRD dapat menentukan status awal karyawan saat pembuatan (default tetap `PROBATION` bila tidak disertakan).
- `employee-management-ui`: Dialog create DAN edit karyawan menampilkan dropdown `Status` (6 field inti + status = 6 field total). Dialog edit tetap TIDAK menampilkan field pribadi (nik, telepon, alamat, rekening).

## Impact

- **Backend controller** (`server/src/controllers/employee.controller.ts`): `createEmployeeSchema` ditambah field `status` opsional.
- **Backend service** (`server/src/services/employee.service.ts`): `CreateEmployeeInput` ditambah `status?`; `createEmployee` method pass status ke insert values.
- **Backend tests**: Tambah test case create dengan custom status.
- **Frontend API** (`client/src/features/employees/api.ts`): `CreateEmployeeInput` ditambah `status?`.
- **Frontend schema** (`client/src/features/employees/schema.ts`): `employeeFormSchema` ditambah `status: statusEnum`.
- **Frontend dialog** (`client/src/features/employees/components/employee-dialog.tsx`): `FormValues` ditambah `status`; dropdown JSX ditambah; `doSubmit` kirim `status` untuk create & edit.
- **Frontend types**: Tidak berubah (`EmployeeStatus` sudah ada).
- **Tidak ada migrasi DB**: Field `status` sudah ada di schema, hanya perlu menerima nilai dari input.
- **Tidak mengubah state machine transisi**: Tetap berlaku aturan transisi yang sudah ada.
- **Tidak mengubah auto-transition**: Hanya berjalan kalau status = PROBATION, jadi tidak terganggu jika HRD langsung set ACTIVE.
