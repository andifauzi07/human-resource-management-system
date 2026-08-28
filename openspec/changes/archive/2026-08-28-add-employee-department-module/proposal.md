# Proposal: Add Employee + Department Module with Testing

## Overview

Menambahkan modul Employee dan Department sebagai fondasi HRIS, menghapus endpoint register, menambahkan auto-generate email/password, password reset oleh HRD, dan menambahkan testing infrastructure untuk server.

## Context

### Status Saat Ini
- Auth system (register/login/refresh/me/logout) sudah terimplementasi
- Hanya tabel `users` yang ada
- Tidak ada testing infrastructure
- Tidak ada CI workflow untuk testing

### Masalah
1. Modul lain (attendance, leave, payroll) membutuhkan `employees` table sebagai FK
2. Endpoint `/register` memungkinkan user mendaftar sendiri, padahal seharusnya HRD yang membuat akun
3. Tidak ada cara untuk reset password karyawan yang lupa password
4. Tidak ada automated testing untuk memastikan business logic benar

### Goals
1. Membuat modul Employee + Department sebagai fondasi
2. HRD membuat akun karyawan (bukan self-register)
3. Auto-generate email dan password saat create employee
4. HRD bisa reset password karyawan
5. Menambahkan testing infrastructure untuk server
6. CI/CD workflow untuk running tests on push

## Design Decisions

### 1. User-Employee Link: Option B (employee_id in users)

**Decision:** `users` table memiliki `employee_id` FK nullable

**Rationale:**
- HRD admin mungkin tidak punya employee record
- FK dari users → employees (bukan sebaliknya)
- Konsisten dengan ARCHITECTURE.md yang menyebutkan "FK `employee_id` ditunda ke modul Employee"

**Alternatives Considered:**
- Option A: `user_id` in employees → ditolak karena HRD admin tidak punya employee record

### 2. Email Auto-Generation

**Decision:** Auto-generate email dari nama karyawan

**Pattern:** `{first_name}.{last_name}@company.com`
- Lowercase semua
- Spasi diganti dot
- Single name: `john@company.com`

**Example:**
- "John Doe" → "john.doe@company.com"
- "Jane Smith" → "jane.smith@company.com"
- "Budi Santoso" → "budi.santoso@company.com"

### 3. Password Generation & Reset

**Decision:**
- Password di-generate random 12+ chars saat create employee
- Plain text password hanya ditampilkan sekali saat create response
- HRD bisa reset password → new password di-generate dan ditampilkan sekali

**Rationale:**
- Password di-hash dengan bcrypt, tidak bisa di-retrieve
- Reset password = generate new password baru
- Security: plain text hanya di response create/reset, tidak disimpan

### 4. Employee Status: Soft Delete

**Decision:** Menggunakan `status` enum ('ACTIVE', 'INACTIVE')

**Rationale:**
- Data historis harus tetap ada (attendance, leave, payroll records)
- Soft delete mempertahankan referential integrity
- Employee bisa di-deactivate tanpa menghapus data

### 5. Department Manager: Nullable FK

**Decision:** `manager_id` di departments adalah nullable FK ke employees.id

**Rationale:**
- Menghindari chicken-and-egg problem
- Department bisa ada tanpa manager
- Manager bisa di-set setelah employee dibuat

### 6. Testing Strategy: Mock DB

**Decision:** Unit tests dengan mock database, tanpa real DB

**Rationale:**
- Portfolio project, tidak perlu integration test dengan real DB
- Tests lebih cepat dan tidak membutuhkan setup DB
- Mock Drizzle ORM calls
- Coverage target: Service ≥80%, Controller ≥60%

### 7. CI Trigger: Push Any Branch + PR to Main

**Decision:** CI workflow trigger on push to any branch + PR to main

**Rationale:**
- Test dijalankan di semua branch, bukan hanya main
- PR ke main juga di-test
- Fail fast: lint → typecheck → test

## API Design

### Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTH ENDPOINTS                                │
├─────────────────────────────────────────────────────────────────┤
│  ~~POST /api/v1/auth/register~~  ← DIHAPUS                      │
│  POST   /api/v1/auth/login                                     │
│  POST   /api/v1/auth/refresh                                    │
│  GET    /api/v1/auth/me                                         │
│  POST   /api/v1/auth/logout                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EMPLOYEE ENDPOINTS                            │
├─────────────────────────────────────────────────────────────────┤
│  POST   /api/v1/employees              # create + auto user     │
│  GET    /api/v1/employees              # list all (HRD)         │
│  GET    /api/v1/employees/mine         # profil sendiri (STAFF) │
│  GET    /api/v1/employees/:id          # get one (HRD or own)   │
│  PATCH  /api/v1/employees/:id          # update (HRD)           │
│  DELETE /api/v1/employees/:id          # deactivate (HRD)       │
│  POST   /api/v1/employees/:id/reset-password  # reset pwd (HRD)│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DEPARTMENT ENDPOINTS                          │
├─────────────────────────────────────────────────────────────────┤
│  GET    /api/v1/departments            # list all               │
│  POST   /api/v1/departments            # create (HRD)           │
│  GET    /api/v1/departments/:id        # get one                │
│  PATCH  /api/v1/departments/:id        # update (HRD)           │
│  DELETE /api/v1/departments/:id        # delete (HRD)           │
└─────────────────────────────────────────────────────────────────┘
```

### Request/Response Schema

#### POST /api/v1/employees

**Request:**
```json
{
  "full_name": "John Doe",
  "department_id": "uuid",
  "position": "Software Engineer",
  "base_salary": 5000000,
  "join_date": "2026-09-01"
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

#### POST /api/v1/employees/:id/reset-password

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

### RBAC Matrix

| Action | STAFF | HRD |
|--------|-------|-----|
| View own profile | ✅ | ✅ |
| View all employees | ❌ | ✅ |
| Create employee | ❌ | ✅ |
| Update employee | ❌ | ✅ |
| Deactivate employee | ❌ | ✅ |
| Reset password | ❌ | ✅ |
| View departments | ✅ | ✅ |
| Create/edit department | ❌ | ✅ |
| Delete department | ❌ | ✅ |

## Database Schema

### departments

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  manager_id UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### employees

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id),
  full_name VARCHAR(150) NOT NULL,
  position VARCHAR(100) NOT NULL,
  base_salary DECIMAL(12,2) NOT NULL CHECK (base_salary > 0),
  join_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### users (updated)

```sql
ALTER TABLE users ADD COLUMN employee_id UUID REFERENCES employees(id);
```

## File Structure

```
server/src/
├── drizzle/schemas/
│   ├── department.schema.ts      ← NEW
│   └── employee.schema.ts        ← NEW
├── routes/
│   ├── department.routes.ts      ← NEW
│   └── employee.routes.ts        ← NEW
├── controllers/
│   ├── department.controller.ts  ← NEW
│   └── employee.controller.ts    ← NEW
├── services/
│   ├── department.service.ts     ← NEW
│   └── employee.service.ts       ← NEW
├── utils/
│   └── password.ts               ← NEW
├── drizzle/index.ts              ← UPDATE
├── app.ts                        ← UPDATE
└── routes/
    └── auth.routes.ts            ← UPDATE (remove /register)

server/
├── vitest.config.ts              ← NEW

.github/workflows/
└── ci.yml                        ← NEW
```

## Testing Plan

### Test Structure

Colocated dengan source:
```
server/src/services/
├── employee.service.ts
├── employee.service.test.ts
├── department.service.ts
└── department.service.test.ts

server/src/controllers/
├── employee.controller.ts
├── employee.controller.test.ts
├── department.controller.ts
└── department.controller.test.ts
```

### Test Cases

#### employee.service.test.ts

```
createEmployee
├── should create employee + user account with generated password
├── should auto-generate email from name
├── should hash password before storing
└── should throw error if email already exists

getEmployeeById
├── should return employee when HRD
└── should return own employee when STAFF

listEmployees
├── should return all employees when HRD
└── should throw 403 when STAFF

updateEmployee
├── should update employee fields
└── should throw error if employee not found

deactivateEmployee
├── should set status to INACTIVE
└── should not delete employee record

resetPassword
├── should generate new password and return plain text
└── should hash new password before storing
```

#### department.service.test.ts

```
createDepartment
├── should create department
└── should throw error if name already exists

getDepartmentById
└── should return department with manager info

listDepartments
└── should return all departments

updateDepartment
├── should update department fields
└── should allow setting manager_id

deleteDepartment
├── should delete department if no employees
└── should throw error if department has employees
```

#### employee.controller.test.ts (Supertest)

```
POST /api/v1/employees
├── 201: creates employee + returns credentials
├── 400: invalid input
└── 403: when STAFF tries to create

GET /api/v1/employees
├── 200: returns list when HRD
└── 403: when STAFF tries to list all

GET /api/v1/employees/mine
├── 200: returns own profile
└── 401: when not authenticated

GET /api/v1/employees/:id
├── 200: returns employee when HRD
├── 200: returns own employee when STAFF
└── 403: when STAFF tries to view other

PATCH /api/v1/employees/:id
├── 200: updates employee when HRD
└── 403: when STAFF tries to update

DELETE /api/v1/employees/:id
├── 200: deactivates employee when HRD
└── 403: when STAFF tries to delete

POST /api/v1/employees/:id/reset-password
├── 200: returns new password when HRD
└── 403: when STAFF tries to reset
```

### Coverage Targets

| Layer | Target |
|-------|--------|
| Service | ≥ 80% |
| Controller | ≥ 60% |

## Implementation Phases

### Phase 1: Testing Setup
1. Install Vitest in server
2. Create vitest.config.ts
3. Add test scripts to package.json
4. Create .github/workflows/ci.yml
5. Verify: npm run test works

### Phase 2: Database Schema
6. Create department.schema.ts
7. Create employee.schema.ts
8. Update drizzle/index.ts
9. Generate + run migrations

### Phase 3: Business Logic
10. Create password.ts utility
11. Create department.service.ts + tests
12. Create employee.service.ts + tests
13. Create department.controller.ts + tests
14. Create employee.controller.ts + tests

### Phase 4: Routes + Integration
15. Create department.routes.ts
16. Create employee.routes.ts
17. Update app.ts (register routes)
18. Remove /register from auth.routes.ts
19. Update swagger docs

### Phase 5: Verification
20. Run: npm run lint
21. Run: npm run typecheck
22. Run: npm run test
23. Run: npm run build

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email collision (same name) | Medium | Append random number if duplicate |
| Password exposure in logs | High | Never log plain text password |
| Mock tests miss DB issues | Low | Acceptable for portfolio project |
| Breaking existing auth | High | Test auth flows thoroughly |

## Success Criteria

1. ✅ Employee CRUD works with auto-generated email/password
2. ✅ Department CRUD works with manager assignment
3. ✅ /register endpoint removed
4. ✅ Password reset works for HRD
5. ✅ All tests pass (≥80% service, ≥60% controller)
6. ✅ CI workflow runs on push to any branch
7. ✅ lint + typecheck + test all pass
