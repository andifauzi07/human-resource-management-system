# Employee Management

## Capability Overview

Kelola data karyawan HRIS: CRUD employee, auto-generate email/password, soft delete, dan password reset oleh HRD.

## Endpoints

| Method | Endpoint | Authorization | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/employees` | HRD | Buat karyawan + auto user account |
| GET | `/api/v1/employees` | HRD | Lihat semua karyawan |
| GET | `/api/v1/employees/mine` | All | Lihat profil sendiri |
| GET | `/api/v1/employees/:id` | HRD (any), STAFF (own) | Lihat detail karyawan |
| PATCH | `/api/v1/employees/:id` | HRD | Update karyawan |
| DELETE | `/api/v1/employees/:id` | HRD | Nonaktifkan karyawan (soft delete) |
| POST | `/api/v1/employees/:id/reset-password` | HRD | Reset password karyawan |

## Business Rules

1. Email auto-generated dari `full_name` → `john.doe@company.com`
2. Password auto-generated (12+ chars), plain text hanya di response create/reset
3. User account dibuat otomatis dengan role STAFF saat create employee
4. STAFF hanya bisa melihat profil sendiri
5. Soft delete: status `ACTIVE` → `INACTIVE`, data tetap ada

## RBAC Matrix

| Action | STAFF | HRD |
|--------|-------|-----|
| View own profile | ✅ | ✅ |
| View all employees | ❌ | ✅ |
| Create employee | ❌ | ✅ |
| Update employee | ❌ | ✅ |
| Deactivate employee | ❌ | ✅ |
| Reset password | ❌ | ✅ |

## Error Responses

- 400: Invalid input (missing fields, negative salary, invalid date)
- 403: STAFF tries to access other employee data
- 409: Email sudah terdaftar (nama duplikasi)
