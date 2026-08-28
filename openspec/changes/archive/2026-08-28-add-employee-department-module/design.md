# Design: Employee + Department Module

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────┘

     Routes              Controller           Service            DB
        │                    │                   │                │
        │  HTTP Request      │                   │                │
        │ ─────────────────▶ │                   │                │
        │                    │  Zod Validation   │                │
        │                    │ ──────────────▶   │                │
        │                    │                   │  Business Logic│
        │                    │                   │ ─────────────▶ │
        │                    │                   │                │
        │                    │                   │   Drizzle ORM  │
        │                    │                   │ ◀───────────── │
        │                    │  Service Result   │                │
        │                    │ ◀──────────────   │                │
        │  HTTP Response     │                   │                │
        │ ◀──────────────    │                   │                │
        │                    │                   │                │
```

## Component Design

### 1. Schema Layer (Drizzle)

#### department.schema.ts

```typescript
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const departmentsTable = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull().unique(),
  manager_id: uuid("manager_id"), // nullable, FK ke employees
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export type Department = typeof departmentsTable.$inferSelect;
export type NewDepartment = typeof departmentsTable.$inferInsert;
```

#### employee.schema.ts

```typescript
import { pgEnum, pgTable, timestamp, uuid, varchar, decimal, date } from "drizzle-orm/pg-core";

export const employeeStatusEnum = pgEnum("employee_status", ["ACTIVE", "INACTIVE"]);

export const employeesTable = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  department_id: uuid("department_id").notNull().references(() => departmentsTable.id),
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

### 2. Service Layer

#### employee.service.ts

```typescript
// Key Functions:
// - createEmployee(input) → { employee, credentials }
// - getEmployeeById(id, userRole, userId) → Employee
// - listEmployees(userRole) → Employee[]
// - updateEmployee(id, input) → Employee
// - deactivateEmployee(id) → void
// - resetPassword(id) → { email, password }

// Helper Functions:
// - generateEmail(name) → string
// - generatePassword() → string
```

#### department.service.ts

```typescript
// Key Functions:
// - createDepartment(input) → Department
// - getDepartmentById(id) → Department
// - listDepartments() → Department[]
// - updateDepartment(id, input) → Department
// - deleteDepartment(id) → void
```

### 3. Controller Layer

Controller遵循 thin controller pattern:
- Validasi input dengan Zod
- Panggil service layer
- Return response dengan ApiResponse

### 4. Route Layer

Route menggunakan middleware pattern:
```typescript
router.post("/", authGuard, rbacGuard(["HRD"]), controller.create);
router.get("/", authGuard, controller.list);
router.get("/mine", authGuard, controller.getMine);
router.get("/:id", authGuard, controller.getById);
router.patch("/:id", authGuard, rbacGuard(["HRD"]), controller.update);
router.delete("/:id", authGuard, rbacGuard(["HRD"]), controller.delete);
router.post("/:id/reset-password", authGuard, rbacGuard(["HRD"]), controller.resetPassword);
```

## Email Generation Algorithm

```typescript
function generateEmail(fullName: string): string {
  // 1. Lowercase
  // 2. Trim whitespace
  // 3. Split by space
  // 4. Join with dot
  // 5. Remove special characters except dot
  // 6. Append @company.com

  const normalized = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')  // remove special chars
    .replace(/\s+/g, '.');      // space to dot

  return `${normalized}@company.com`;
}

// Examples:
// "John Doe" → "john.doe@company.com"
// "Jane Smith" → "jane.smith@company.com"
// "Budi Santoso" → "budi.santoso@company.com"
// "John" → "john@company.com"
```

## Password Generation Algorithm

```typescript
function generatePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each:
  // - lowercase
  // - uppercase
  // - number
  // - special char

  // Then fill rest randomly
  return password;
}

// Example output: "aB3$kL9!mN2@"
```

## Error Handling

```typescript
// Service Layer throws ApiError
throw ApiError.badRequest("Email sudah terdaftar");
throw ApiError.notFound("Employee tidak ditemukan");
throw ApiError.forbidden("Tidak diizinkan");

// Controller Layer catches and returns ApiResponse
try {
  const result = await service.createEmployee(input);
  return ApiResponse.created(res, "Employee berhasil dibuat", result);
} catch (error) {
  if (error instanceof ApiError) {
    return error.send(res);
  }
  throw error;
}
```

## Security Considerations

1. **Password Storage**: Always bcrypt hash before storing
2. **Password Display**: Plain text only in create/reset response, never logged
3. **RBAC**: Check role in both middleware AND service layer
4. **Input Validation**: Zod schema for all inputs
5. **SQL Injection**: Drizzle ORM parameterized queries

## Testing Strategy

### Mocking Pattern

```typescript
// Mock database
vi.mock('../configs/db', () => ({
  default: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock password utils
vi.mock('../utils/password', () => ({
  generatePassword: vi.fn().mockReturnValue('TestPass123!'),
  hashPassword: vi.fn().mockResolvedValue('hashed_password')
}));
```

### Test Data Factories

```typescript
function createMockEmployee(overrides?) {
  return {
    id: 'uuid',
    department_id: 'dept-uuid',
    full_name: 'John Doe',
    position: 'Engineer',
    base_salary: 5000000,
    join_date: '2026-09-01',
    status: 'ACTIVE',
    created_at: new Date(),
    ...overrides
  };
}
```
