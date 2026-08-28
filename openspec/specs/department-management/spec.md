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
2. Manager ID optional (bisa di-set nanti)
3. Tidak boleh hapus department yang masih punya karyawan
4. Hard delete (menghapus record dari DB)

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
