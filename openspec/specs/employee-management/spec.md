# Employee Management

## Capability Overview

Kelola data karyawan HRIS: CRUD employee, auto-generate email/password, soft delete, dan password reset oleh HRD.

## Endpoints

| Method | Endpoint | Authorization | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/employees` | HRD | Buat karyawan + auto user account |
| GET | `/api/v1/employees` | HRD (all), STAFF (same dept) | Lihat daftar karyawan |
| GET | `/api/v1/employees/mine` | All | Lihat profil sendiri |
| GET | `/api/v1/employees/:id` | HRD (any), STAFF (same dept) | Lihat detail karyawan |
| PATCH | `/api/v1/employees/:id` | HRD | Update karyawan |
| DELETE | `/api/v1/employees/:id` | HRD | Nonaktifkan karyawan (soft delete) |
| POST | `/api/v1/employees/:id/reset-password` | HRD | Reset password karyawan |

## Business Rules

1. Email auto-generated dari `full_name` → `john.doe@company.com`
2. Password auto-generated (12+ chars), plain text hanya di response create/reset
3. User account dibuat otomatis dengan role STAFF saat create employee
4. STAFF hanya bisa melihat profil karyawan di department yang sama
5. Soft delete: status `ACTIVE` → `INACTIVE`, data tetap ada
6. Saat soft delete (`DELETE /employees/:id`), `departments.manager_id` yang menunjuk karyawan tersebut di-set `null` di seluruh department (menjaga aturan "manager wajib berstatus ACTIVE"). Data karyawan tidak berubah selain status.
7. Response `GET /employees`, `GET /employees/:id`, dan `GET /employees/mine` menyertakan objek `department: { id, name }` hasil JOIN dari tabel `departments`.

## RBAC Matrix

| Action | STAFF | HRD |
|--------|-------|-----|
| View own profile | ✅ | ✅ |
| View employees (same dept) | ✅ | ✅ |
| View all employees (any dept) | ❌ | ✅ |
| Create employee | ❌ | ✅ |
| Update employee | ❌ | ✅ |
| Deactivate employee | ❌ | ✅ |
| Reset password | ❌ | ✅ |

## Error Responses

- 400: Invalid input (missing fields, negative salary, invalid date)
- 403: STAFF tries to access employee in different department
- 409: Email sudah terdaftar (nama duplikasi)
