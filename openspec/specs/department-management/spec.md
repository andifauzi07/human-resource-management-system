# Department Management

## Capability Overview

Kelola data departemen HRIS: CRUD department, assignment manager, dan validasi hapus (tidak boleh ada karyawan).

## Endpoints

| Method | Endpoint | Authorization | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/departments` | HRD | Buat department baru |
| GET | `/api/v1/departments` | All | Lihat semua department |
| GET | `/api/v1/departments/:id` | All | Lihat detail department |
| PATCH | `/api/v1/departments/:id` | HRD | Update department |
| DELETE | `/api/v1/departments/:id` | HRD | Hapus department |

## Business Rules

1. Name harus unik
2. Manager ID optional (boleh kosong dan boleh di-set/diubah kapan saja). Apabila `manager_id` diisi, sistem MUST menolak request bila: (a) karyawan dengan ID tersebut tidak ada, atau (b) status karyawan bukan `ACTIVE`. Penolakan mengembalikan 400 dengan pesan yang menjelaskan alasannya.
3. Tidak boleh hapus department yang masih punya karyawan
4. Hard delete (menghapus record dari DB)
5. Seluruh respons department (`POST`, `GET`, `GET/:id`, `PATCH`) MUST menyertakan field `manager_name` (`full_name` dari karyawan manager via join; `null` bila tidak ada manager) di samping `manager_id`.

## RBAC Matrix

| Action | STAFF | HRD |
|--------|-------|-----|
| View departments | ✅ | ✅ |
| Create department | ❌ | ✅ |
| Update department | ❌ | ✅ |
| Delete department | ❌ | ✅ |

## Error Responses

- 400: Invalid input, department masih punya karyawan
- 404: Department tidak ditemukan
