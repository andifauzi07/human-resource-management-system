import { eq } from "drizzle-orm";
import db from "../configs/db";
import {
  employeesTable,
  type Employee
} from "../drizzle/schemas/employee.schema";
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

  async getEmployeeById(
    id: string,
    userRole: string,
    userId: string
  ): Promise<Employee> {
    const [employee] = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);

    if (!employee) {
      throw ApiError.notFound("Employee tidak ditemukan");
    }

    // STAFF can only view their own employee record
    if (userRole === "STAFF") {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user || user.employee_id !== employee.id) {
        throw ApiError.forbidden("Tidak diizinkan melihat data karyawan lain");
      }
    }

    return employee;
  },

  async getEmployeeByUserId(userId: string): Promise<Employee> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || !user.employee_id) {
      throw ApiError.notFound("Profil karyawan tidak ditemukan");
    }

    const [employee] = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, user.employee_id))
      .limit(1);

    if (!employee) {
      throw ApiError.notFound("Employee tidak ditemukan");
    }

    return employee;
  },

  async listEmployees(userRole: string): Promise<Employee[]> {
    if (userRole !== "HRD") {
      throw ApiError.forbidden("Hanya HRD yang dapat melihat semua karyawan");
    }

    return db.select().from(employeesTable);
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

    await db
      .update(employeesTable)
      .set({ status: "INACTIVE", updated_at: new Date() })
      .where(eq(employeesTable.id, id));
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
