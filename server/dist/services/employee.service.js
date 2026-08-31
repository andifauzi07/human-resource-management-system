import { eq } from "drizzle-orm";
import db from "../configs/db.js";
import { employeesTable } from "../drizzle/schemas/employee.schema.js";
import { departmentsTable } from "../drizzle/schemas/department.schema.js";
import { usersTable } from "../drizzle/schemas/user.schema.js";
import { ApiError } from "../utils/api-error.js";
import { hashPassword } from "../utils/auth.js";
import { generateEmail, generatePassword } from "../utils/password.js";
export const employeeService = {
    async createEmployee(input) {
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
    async getEmployeeById(id, userRole, userId) {
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
    async getEmployeeByUserId(userId) {
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
    async listEmployees(userRole) {
        if (userRole !== "HRD") {
            throw ApiError.forbidden("Hanya HRD yang dapat melihat semua karyawan");
        }
        return db.select().from(employeesTable);
    },
    async updateEmployee(id, input) {
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
    async deactivateEmployee(id) {
        const [existing] = await db
            .select()
            .from(employeesTable)
            .where(eq(employeesTable.id, id))
            .limit(1);
        if (!existing) {
            throw ApiError.notFound("Employee tidak ditemukan");
        }
        await db.transaction(async (tx) => {
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
    async resetPassword(id) {
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
//# sourceMappingURL=employee.service.js.map