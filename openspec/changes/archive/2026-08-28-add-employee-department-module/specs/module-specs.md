# Specs: Employee + Department Module

## Capability: Employee Management

### Spec: Create Employee

**Endpoint:** `POST /api/v1/employees`

**Authorization:** HRD only

**Request Body:**
```json
{
  "full_name": "string (required, 1-150 chars)",
  "department_id": "uuid (required, must exist)",
  "position": "string (required, 1-100 chars)",
  "base_salary": "number (required, > 0)",
  "join_date": "string (required, YYYY-MM-DD format)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Employee berhasil dibuat",
  "data": {
    "employee": {
      "id": "uuid",
      "full_name": "John Doe",
      "department_id": "uuid",
      "position": "Software Engineer",
      "base_salary": 5000000,
      "join_date": "2026-09-01",
      "status": "ACTIVE",
      "created_at": "2026-08-28T..."
    },
    "credentials": {
      "email": "john.doe@company.com",
      "password": "Abc123!@#xyz"
    }
  }
}
```

**Business Rules:**
1. Email auto-generated dari full_name
2. Password auto-generated (12+ chars)
3. User account dibuat otomatis dengan role STAFF
4. Hash password sebelum simpan ke DB
5. Plain text password HANYA di response ini

**Error Responses:**
- 400: Invalid input (missing fields, negative salary, invalid date)
- 409: Email sudah terdaftar (jika ada duplikasi nama)

---

### Spec: List Employees

**Endpoint:** `GET /api/v1/employees`

**Authorization:** HRD only

**Response (200):**
```json
{
  "success": true,
  "message": "Daftar employee",
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "department": { "id": "uuid", "name": "Engineering" },
      "position": "Software Engineer",
      "base_salary": 5000000,
      "join_date": "2026-09-01",
      "status": "ACTIVE"
    }
  ]
}
```

**Business Rules:**
1. Hanya HRD yang bisa melihat semua employee
2. STAFF akan dapat 403

---

### Spec: Get Employee Profile (Mine)

**Endpoint:** `GET /api/v1/employees/mine`

**Authorization:** All authenticated users

**Response (200):**
```json
{
  "success": true,
  "message": "Profil employee",
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "department": { "id": "uuid", "name": "Engineering" },
    "position": "Software Engineer",
    "base_salary": 5000000,
    "join_date": "2026-09-01",
    "status": "ACTIVE"
  }
}
```

**Business Rules:**
1. STAFF hanya bisa melihat profil sendiri
2. HRD bisa melihat profil sendiri
3. Menggunakan `req.user.sub` untuk mendapatkan employee

---

### Spec: Get Employee by ID

**Endpoint:** `GET /api/v1/employees/:id`

**Authorization:** HRD (any), STAFF (own only)

**Response (200):**
```json
{
  "success": true,
  "message": "Detail employee",
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "department": { "id": "uuid", "name": "Engineering" },
    "position": "Software Engineer",
    "base_salary": 5000000,
    "join_date": "2026-09-01",
    "status": "ACTIVE",
    "created_at": "2026-08-28T..."
  }
}
```

**Business Rules:**
1. HRD bisa melihat semua employee
2. STAFF hanya bisa melihat diri sendiri
3. Cek `req.user.sub === employee.user_id` untuk STAFF

---

### Spec: Update Employee

**Endpoint:** `PATCH /api/v1/employees/:id`

**Authorization:** HRD only

**Request Body:**
```json
{
  "full_name": "string (optional)",
  "department_id": "uuid (optional)",
  "position": "string (optional)",
  "base_salary": "number (optional, > 0)",
  "join_date": "string (optional)",
  "status": "ACTIVE|INACTIVE (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Employee berhasil diupdate",
  "data": { ...updated employee }
}
```

**Business Rules:**
1. Hanya HRD yang bisa update
2. Update `updated_at` timestamp
3. Partial update (hanya field yang dikirim)

---

### Spec: Deactivate Employee

**Endpoint:** `DELETE /api/v1/employees/:id`

**Authorization:** HRD only

**Response (200):**
```json
{
  "success": true,
  "message": "Employee berhasil dinonaktifkan"
}
```

**Business Rules:**
1. Hanya HRD yang bisa deactivate
2. Set `status = INACTIVE` (soft delete)
3. Tidak menghapus record dari DB

---

### Spec: Reset Password

**Endpoint:** `POST /api/v1/employees/:id/reset-password`

**Authorization:** HRD only

**Response (200):**
```json
{
  "success": true,
  "message": "Password berhasil di-reset",
  "data": {
    "email": "john.doe@company.com",
    "password": "NewPass456!@#"
  }
}
```

**Business Rules:**
1. Hanya HRD yang bisa reset password
2. Generate password baru (12+ chars)
3. Hash password baru sebelum simpan
4. Plain text password HANYA di response ini

---

## Capability: Department Management

### Spec: Create Department

**Endpoint:** `POST /api/v1/departments`

**Authorization:** HRD only

**Request Body:**
```json
{
  "name": "string (required, 1-100 chars, unique)",
  "manager_id": "uuid (optional, must be valid employee)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Department berhasil dibuat",
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "manager_id": null,
    "created_at": "2026-08-28T..."
  }
}
```

**Business Rules:**
1. Hanya HRD yang bisa create
2. Name harus unik
3. Manager ID optional (bisa di-set nanti)

---

### Spec: List Departments

**Endpoint:** `GET /api/v1/departments`

**Authorization:** All authenticated users

**Response (200):**
```json
{
  "success": true,
  "message": "Daftar department",
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "manager": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "employee_count": 5
    }
  ]
}
```

**Business Rules:**
1. Semua authenticated user bisa melihat departments
2. Include manager info jika ada
3. Include employee count

---

### Spec: Get Department by ID

**Endpoint:** `GET /api/v1/departments/:id`

**Authorization:** All authenticated users

**Response (200):**
```json
{
  "success": true,
  "message": "Detail department",
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "manager": {
      "id": "uuid",
      "full_name": "John Doe"
    },
    "employees": [
      { "id": "uuid", "full_name": "Jane Smith", "position": "Engineer" }
    ],
    "created_at": "2026-08-28T..."
  }
}
```

---

### Spec: Update Department

**Endpoint:** `PATCH /api/v1/departments/:id`

**Authorization:** HRD only

**Request Body:**
```json
{
  "name": "string (optional)",
  "manager_id": "uuid (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Department berhasil diupdate",
  "data": { ...updated department }
}
```

**Business Rules:**
1. Hanya HRD yang bisa update
2. Manager haruslah employee yang active
3. Update `updated_at` timestamp

---

### Spec: Delete Department

**Endpoint:** `DELETE /api/v1/departments/:id`

**Authorization:** HRD only

**Response (200):**
```json
{
  "success": true,
  "message": "Department berhasil dihapus"
}
```

**Business Rules:**
1. Hanya HRD yang bisa delete
2. Tidak boleh delete department yang punya employees
3. Hard delete (menghapus record dari DB)

---

## Capability: Auth Updates

### Spec: Remove Register Endpoint

**Endpoint:** `POST /api/v1/auth/register` ← DIHAPUS

**Rationale:**
- Pendaftaran hanya dilakukan oleh HRD melalui create employee
- Menghindari eskalasi privilege (user register sendiri)
- Konsisten dengan flow HRD-managed

---

## Capability: Testing Infrastructure

### Spec: Vitest Setup

**Package:** vitest

**Config:** `server/vitest.config.ts`

**Scripts:**
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

---

### Spec: CI Workflow

**File:** `.github/workflows/ci.yml`

**Trigger:** Push to any branch + PR to main

**Jobs:**
1. lint (eslint)
2. typecheck (tsc)
3. test-server (vitest)

**No real DB required** (all tests use mocks)
