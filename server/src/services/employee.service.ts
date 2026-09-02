import { eq } from "drizzle-orm";
import db from "../configs/db";
import {
  employeesTable,
  type Employee
} from "../drizzle/schemas/employee.schema";
import {
  departmentsTable,
  type Department
} from "../drizzle/schemas/department.schema";
import { usersTable } from "../drizzle/schemas/user.schema";
import { ApiError } from "../utils/api-error";
import { hashPassword } from "../utils/auth";
import { generateEmail, generatePassword } from "../utils/password";

export interface CreateEmployeeInput {
  full_name: string;
  department_id: string;
  position: string;
  base_salary: number;
  join_date: string;
}

export interface UpdateEmployeeInput {
  full_name?: string;
  department_id?: string;
  position?: string;
  base_salary?: number;
  join_date?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface EmployeeCredentials {
  email: string;
  password: string;
}

export interface EmployeeWithDepartment extends Employee {
  department: Pick<Department, "id" | "name"> | null;
}

export type EmployeeListItem = Pick<Employee, "id" | "full_name" | "position">;

const withDepartmentProjection = {
  id: employeesTable.id,
  department_id: employeesTable.department_id,
  full_name: employeesTable.full_name,
  position: employeesTable.position,
  base_salary: employeesTable.base_salary,
  join_date: employeesTable.join_date,
  status: employeesTable.status,
  created_at: employeesTable.created_at,
  updated_at: employeesTable.updated_at,
  department: { id: departmentsTable.id, name: departmentsTable.name }
};

const employeeListItemProjection = {
  id: employeesTable.id,
  full_name: employeesTable.full_name,
  position: employeesTable.position
};

async function getUserDepartmentId(userId: string): Promise<string> {
  const [row] = await db
    .select({ department_id: employeesTable.department_id })
    .from(usersTable)
    .innerJoin(employeesTable, eq(employeesTable.id, usersTable.employee_id))
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!row) {
    throw ApiError.notFound("Profil karyawan tidak ditemukan");
  }

  return row.department_id;
}

export const employeeService = {
  async createEmployee(
    input: CreateEmployeeInput
  ): Promise<{ employee: Employee; credentials: EmployeeCredentials }> {
    const email = generateEmail(input.full_name);
    const plainPassword = generatePassword();
    const passwordHash = await hashPassword(plainPassword);

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser) {
      throw ApiError.conflict("Email sudah terdaftar");
    }

    // Create employee
    const [employee] = await db
      .insert(employeesTable)
      .values({
        department_id: input.department_id,
        full_name: input.full_name,
        position: input.position,
        base_salary: String(input.base_salary),
        join_date: input.join_date
      })
      .returning();

    // Create user account
    await db.insert(usersTable).values({
      employee_id: employee.id,
      email,
      password_hash: passwordHash,
      role: "STAFF"
    });

    return {
      employee,
      credentials: { email, password: plainPassword }
    };
  },

  async getEmployeeById(id: string): Promise<EmployeeWithDepartment> {
    const [employee] = await db
      .select(withDepartmentProjection)
      .from(employeesTable)
      .leftJoin(
        departmentsTable,
        eq(departmentsTable.id, employeesTable.department_id)
      )
      .where(eq(employeesTable.id, id))
      .limit(1);

    if (!employee) {
      throw ApiError.notFound("Employee tidak ditemukan");
    }

    return employee;
  },

  async getEmployeeByUserId(userId: string): Promise<EmployeeWithDepartment> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || !user.employee_id) {
      throw ApiError.notFound("Profil karyawan tidak ditemukan");
    }

    const [employee] = await db
      .select(withDepartmentProjection)
      .from(employeesTable)
      .leftJoin(
        departmentsTable,
        eq(departmentsTable.id, employeesTable.department_id)
      )
      .where(eq(employeesTable.id, user.employee_id))
      .limit(1);

    if (!employee) {
      throw ApiError.notFound("Employee tidak ditemukan");
    }

    return employee;
  },

  async listEmployees(
    userRole: string,
    userId: string
  ): Promise<EmployeeWithDepartment[] | EmployeeListItem[]> {
    if (userRole !== "HRD" && userRole !== "STAFF") {
      throw ApiError.forbidden(
        "Role Anda tidak diizinkan melihat daftar karyawan"
      );
    }

    if (userRole === "HRD") {
      return db
        .select(withDepartmentProjection)
        .from(employeesTable)
        .leftJoin(
          departmentsTable,
          eq(departmentsTable.id, employeesTable.department_id)
        );
    }

    const departmentId = await getUserDepartmentId(userId);

    return db
      .select(employeeListItemProjection)
      .from(employeesTable)
      .where(eq(employeesTable.department_id, departmentId));
  },

  async updateEmployee(
    id: string,
    input: UpdateEmployeeInput
  ): Promise<Employee> {
    const [existing] = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound("Employee tidak ditemukan");
    }

    const [updated] = await db
      .update(employeesTable)
      .set({
        ...input,
        base_salary: input.base_salary ? String(input.base_salary) : undefined,
        updated_at: new Date()
      })
      .where(eq(employeesTable.id, id))
      .returning();

    return updated;
  },

  async deactivateEmployee(id: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound("Employee tidak ditemukan");
    }

    await db.transaction(async tx => {
      await tx
        .update(employeesTable)
        .set({ status: "INACTIVE", updated_at: new Date() })
        .where(eq(employeesTable.id, id));

      await tx
        .update(departmentsTable)
        .set({ manager_id: null, updated_at: new Date() })
        .where(eq(departmentsTable.manager_id, id));
    });
  },

  async resetPassword(
    id: string
  ): Promise<{ email: string; password: string }> {
    const [employee] = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);

    if (!employee) {
      throw ApiError.notFound("Employee tidak ditemukan");
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.employee_id, id))
      .limit(1);

    if (!user) {
      throw ApiError.notFound("Akun user tidak ditemukan");
    }

    const newPlainPassword = generatePassword();
    const newPasswordHash = await hashPassword(newPlainPassword);

    await db
      .update(usersTable)
      .set({ password_hash: newPasswordHash })
      .where(eq(usersTable.id, user.id));

    return { email: user.email, password: newPlainPassword };
  }
};

export default employeeService;
