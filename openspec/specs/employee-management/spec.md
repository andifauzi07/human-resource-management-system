# Employee Management

## Capability Overview

Kelola data karyawan HRIS: CRUD employee, auto-generate email/password, soft delete, dan password reset oleh HRD. Hak akses employee dibagi per role: HRD melihat semua karyawan dengan seluruh field, STAFF hanya melihat daftar (nama + jabatan) anggota se-department.

## Endpoints

| Method | Endpoint | Authorization | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/employees` | HRD | Buat karyawan + auto user account |
| GET | `/api/v1/employees` | HRD (all, field penuh), STAFF (same dept, `{ id, full_name, position }` saja) | Lihat daftar karyawan |
| GET | `/api/v1/employees/mine` | All | Lihat profil sendiri (field penuh + department) |
| GET | `/api/v1/employees/:id` | HRD | Lihat detail karyawan |
| PATCH | `/api/v1/employees/:id` | HRD | Update karyawan |
| DELETE | `/api/v1/employees/:id` | HRD | Nonaktifkan karyawan (soft delete) |
| POST | `/api/v1/employees/:id/reset-password` | HRD | Reset password karyawan |

## Business Rules

1. Email auto-generated dari `full_name` → `john.doe@company.com`
2. Password auto-generated (12+ chars), plain text hanya di response create/reset
3. User account dibuat otomatis dengan role STAFF saat create employee
4. STAFF hanya dapat melihat daftar karyawan di department yang sama, dan hanya menerima field `id`, `full_name`, `position` (tanpa `base_salary`, `status`, `join_date`, maupun objek `department`)
5. Soft delete: status `ACTIVE` → `INACTIVE`, data tetap ada
6. Saat soft delete (`DELETE /employees/:id`), `departments.manager_id` yang menunjuk karyawan tersebut di-set `null` di seluruh department (menjaga aturan "manager wajib berstatus ACTIVE"). Data karyawan tidak berubah selain status.
7. `GET /employees/:id` khusus HRD; STAFF mengakses profilnya sendiri hanya melalui `GET /employees/mine`
8. Objek `department: { id, name }` hasil JOIN disertakan pada response HRD untuk `GET /employees` dan `GET /employees/:id`, serta pada `GET /employees/mine` untuk semua role. Response list STAFF (`GET /employees`) TIDAK menyertakannya.

## RBAC Matrix

| Action | STAFF | HRD |
|--------|-------|-----|
| View own profile (`/employees/mine`) | ✅ | ✅ |
| View employees same dept (minimal fields) | ✅ | ✅ |
| View all employees any dept (full fields) | ❌ | ✅ |
| View employee detail by id | ❌ | ✅ |
| Create employee | ❌ | ✅ |
| Update employee | ❌ | ✅ |
| Deactivate employee | ❌ | ✅ |
| Reset password | ❌ | ✅ |

## Error Responses

- 400: Invalid input (missing fields, negative salary, invalid date)
- 403: STAFF tries to access employee in different department, atau `GET /employees/:id` oleh STAFF
- 404: Employee tidak ditemukan, profil karyawan tidak ditemukan (mine)
- 409: Email sudah terdaftar (nama duplikasi)