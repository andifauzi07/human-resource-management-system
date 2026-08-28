# Tasks: Employee + Department Module

## Overview

Total: 23 tasks across 5 phases

---

## Phase 1: Testing Setup (5 tasks)

### Task 1.1: Install Vitest Dependencies
**Description:** Install vitest and related packages in server
**Command:** `npm install -D vitest supertest @types/supertest --prefix server`
**Files:** `server/package.json`
**Verification:** `npm run test --prefix server` shows vitest help

---

### Task 1.2: Create Vitest Config
**Description:** Create vitest.config.ts for server
**File:** `server/vitest.config.ts`
**Content:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts']
    }
  }
});
```

---

### Task 1.3: Add Test Scripts
**Description:** Add test scripts to server and root package.json
**Files:** `server/package.json`, `root package.json`
**Changes:**
```json
// server/package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}

// root package.json
{
  "scripts": {
    "test": "npm run test --prefix server"
  }
}
```

---

### Task 1.4: Create CI Workflow
**Description:** Create GitHub Actions CI workflow
**File:** `.github/workflows/ci.yml`
**Content:**
```yaml
name: CI

on:
  push:
    branches: ['*']
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  test-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test --prefix server
```

---

### Task 1.5: Verify Testing Setup
**Description:** Run tests to verify setup works
**Command:** `npm run test --prefix server`
**Expected:** Vitest runs and shows "No test files found" (expected)

---

## Phase 2: Database Schema (4 tasks)

### Task 2.1: Create Department Schema
**Description:** Create Drizzle schema for departments table
**File:** `server/src/drizzle/schemas/department.schema.ts`
**Content:**
```typescript
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const departmentsTable = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull().unique(),
  manager_id: uuid("manager_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export type Department = typeof departmentsTable.$inferSelect;
export type NewDepartment = typeof departmentsTable.$inferInsert;
```

---

### Task 2.2: Create Employee Schema
**Description:** Create Drizzle schema for employees table
**File:** `server/src/drizzle/schemas/employee.schema.ts`
**Content:**
```typescript
import { pgEnum, pgTable, timestamp, uuid, varchar, decimal, date } from "drizzle-orm/pg-core";
import { departmentsTable } from "./department.schema";

export const employeeStatusEnum = pgEnum("employee_status", ["ACTIVE", "INACTIVE"]);

export const employeesTable = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  department_id: uuid("department_id")
    .notNull()
    .references(() => departmentsTable.id),
  full_name: varchar({ length: 150 }).notNull(),
  position: varchar({ length: 100 }).notNull(),
  base_salary: decimal("base_salary", { precision: 12, scale: 2 }).notNull(),
  join_date: date("join_date").notNull(),
  status: employeeStatusEnum().notNull().default("ACTIVE"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export type Employee = typeof employeesTable.$inferSelect;
export type NewEmployee = typeof employeesTable.$inferInsert;
```

---

### Task 2.3: Update User Schema (Add employee_id)
**Description:** Add employee_id FK to users table
**File:** `server/src/drizzle/schemas/user.schema.ts`
**Changes:** Add `employee_id` column
```typescript
import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { employeesTable } from "./employee.schema";

export const userRoleEnum = pgEnum("user_role", ["STAFF", "HRD"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  employee_id: uuid("employee_id").references(() => employeesTable.id),
  email: varchar({ length: 255 }).notNull().unique(),
  password_hash: varchar({ length: 255 }).notNull(),
  role: userRoleEnum().notNull().default("STAFF"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
```

---

### Task 2.4: Update Drizzle Index
**Description:** Export new schemas from drizzle/index.ts
**File:** `server/src/drizzle/index.ts`
**Changes:** Add exports for department and employee schemas

---

## Phase 3: Business Logic (5 tasks)

### Task 3.1: Create Password Utility
**Description:** Create utility for generating random passwords
**File:** `server/src/utils/password.ts`
**Functions:**
- `generatePassword(length?: number): string` - Generate random password
- `generateEmail(fullName: string): string` - Generate email from name

---

### Task 3.2: Create Department Service + Tests
**Description:** Create department service with CRUD operations
**Files:**
- `server/src/services/department.service.ts`
- `server/src/services/department.service.test.ts`

**Functions:**
- `createDepartment(input)` - Create new department
- `getDepartmentById(id)` - Get department by ID
- `listDepartments()` - List all departments
- `updateDepartment(id, input)` - Update department
- `deleteDepartment(id)` - Delete department (check for employees)

**Tests:** Unit tests with mocked DB

---

### Task 3.3: Create Employee Service + Tests
**Description:** Create employee service with CRUD + password operations
**Files:**
- `server/src/services/employee.service.ts`
- `server/src/services/employee.service.test.ts`

**Functions:**
- `createEmployee(input)` - Create employee + user account
- `getEmployeeById(id, userRole, userId)` - Get employee (RBAC)
- `listEmployees(userRole)` - List all (HRD only)
- `updateEmployee(id, input)` - Update employee
- `deactivateEmployee(id)` - Soft delete
- `resetPassword(id)` - Generate new password

**Tests:** Unit tests with mocked DB

---

### Task 3.4: Create Department Controller + Tests
**Description:** Create department controller with validation
**Files:**
- `server/src/controllers/department.controller.ts`
- `server/src/controllers/department.controller.test.ts`

**Zod Schemas:**
- `createDepartmentSchema` - Validate create input
- `updateDepartmentSchema` - Validate update input

**Tests:** Unit tests with mocked service

---

### Task 3.5: Create Employee Controller + Tests
**Description:** Create employee controller with validation
**Files:**
- `server/src/controllers/employee.controller.ts`
- `server/src/controllers/employee.controller.test.ts`

**Zod Schemas:**
- `createEmployeeSchema` - Validate create input
- `updateEmployeeSchema` - Validate update input

**Tests:** Unit tests with mocked service

---

## Phase 4: Routes + Integration (5 tasks)

### Task 4.1: Create Department Routes
**Description:** Create department routes with RBAC middleware
**File:** `server/src/routes/department.routes.ts`

**Routes:**
```typescript
router.get("/", authGuard, controller.list);
router.post("/", authGuard, rbacGuard(["HRD"]), controller.create);
router.get("/:id", authGuard, controller.getById);
router.patch("/:id", authGuard, rbacGuard(["HRD"]), controller.update);
router.delete("/:id", authGuard, rbacGuard(["HRD"]), controller.delete);
```

---

### Task 4.2: Create Employee Routes
**Description:** Create employee routes with RBAC middleware
**File:** `server/src/routes/employee.routes.ts`

**Routes:**
```typescript
router.post("/", authGuard, rbacGuard(["HRD"]), controller.create);
router.get("/", authGuard, rbacGuard(["HRD"]), controller.list);
router.get("/mine", authGuard, controller.getMine);
router.get("/:id", authGuard, controller.getById);
router.patch("/:id", authGuard, rbacGuard(["HRD"]), controller.update);
router.delete("/:id", authGuard, rbacGuard(["HRD"]), controller.delete);
router.post("/:id/reset-password", authGuard, rbacGuard(["HRD"]), controller.resetPassword);
```

---

### Task 4.3: Update App.ts (Register Routes)
**Description:** Register new routes in app.ts
**File:** `server/src/app.ts`
**Changes:**
```typescript
import departmentRoutes from "./routes/department.routes";
import employeeRoutes from "./routes/employee.routes";

// Add routes
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/employees", employeeRoutes);
```

---

### Task 4.4: Remove Register Endpoint
**Description:** Remove /register from auth routes
**File:** `server/src/routes/auth.routes.ts`
**Changes:** Remove `router.post("/register", register);`

---

### Task 4.5: Update Swagger Docs
**Description:** Regenerate Swagger documentation
**Command:** `npm run docs --prefix server`

---

## Phase 5: Verification (4 tasks)

### Task 5.1: Run Lint
**Description:** Run eslint to check code style
**Command:** `npm run lint --prefix server`
**Expected:** No errors

---

### Task 5.2: Run Typecheck
**Description:** Run TypeScript type checking
**Command:** `npm run typecheck --prefix server`
**Expected:** No errors

---

### Task 5.3: Run Tests
**Description:** Run all tests
**Command:** `npm run test --prefix server`
**Expected:** All tests pass

---

### Task 5.4: Run Build
**Description:** Build the server
**Command:** `npm run build --prefix server`
**Expected:** Build succeeds

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| 1. Testing Setup | 5 | ✅ Complete |
| 2. Database Schema | 4 | ✅ Complete |
| 3. Business Logic | 5 | ✅ Complete |
| 4. Routes + Integration | 5 | ✅ Complete |
| 5. Verification | 4 | ✅ Complete |
| **Total** | **23** | **✅ Complete** |
