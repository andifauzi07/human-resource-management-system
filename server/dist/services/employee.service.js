import { eq } from "drizzle-orm";
import db from "../configs/db.js";
import { employeesTable } from "../drizzle/schemas/employee.schema.js";
import { departmentsTable } from "../drizzle/schemas/department.schema.js";
import { usersTable } from "../drizzle/schemas/user.schema.js";
import { ApiError } from "../utils/api-error.js";
import { hashPassword } from "../utils/auth.js";
import { generateEmail, generatePassword } from "../utils/password.js";
const VALID_STATUS_TRANSITIONS = {
    PROBATION: ["ACTIVE", "RESIGNED"],
    ACTIVE: ["ON_LEAVE", "RESIGNED"],
    ON_LEAVE: ["ACTIVE", "RESIGNED"],
    RESIGNED: []
};
function isProbationExpired(joinDate) {
    const joined = new Date(joinDate);
    const now = new Date();
    const diffMs = now.getTime() - joined.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 90;
}
function applyAutoTransition(emp) {
    if (emp.status === "PROBATION" && isProbationExpired(emp.join_date)) {
        return { ...emp, status: "ACTIVE" };
    }
    return emp;
}
const withDepartmentProjection = {
    id: employeesTable.id,
    department_id: employeesTable.department_id,
    full_name: employeesTable.full_name,
    position: employeesTable.position,
    base_salary: employeesTable.base_salary,
    join_date: employeesTable.join_date,
    nik: employeesTable.nik,
    address: employeesTable.address,
    bank_account_number: employeesTable.bank_account_number,
    bank_account_name: employeesTable.bank_account_name,
    phone: employeesTable.phone,
    status: employeesTable.status,
    created_at: employeesTable.created_at,
    updated_at: employeesTable.updated_at,
    department: { id: departmentsTable.id, name: departmentsTable.name }
};
const employeeListItemProjection = {
    id: employeesTable.id,
    full_name: employeesTable.full_name,
    position: employeesTable.position,
    join_date: employeesTable.join_date
};
async function getUserDepartmentId(userId) {
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
async function getEmployeeIdByUserId(userId) {
    const [row] = await db
        .select({ employee_id: employeesTable.id })
        .from(usersTable)
        .innerJoin(employeesTable, eq(employeesTable.id, usersTable.employee_id))
        .where(eq(usersTable.id, userId))
        .limit(1);
    if (!row) {
        throw ApiError.notFound("Profil karyawan tidak ditemukan");
    }
    return row.employee_id;
}
async function autoTransitionAndPersist(employeeId, currentStatus, joinDate) {
    if (currentStatus === "PROBATION" && isProbationExpired(joinDate)) {
        await db
            .update(employeesTable)
            .set({ status: "ACTIVE", updated_at: new Date() })
            .where(eq(employeesTable.id, employeeId));
        return "ACTIVE";
    }
    return currentStatus;
}
function isUniqueViolation(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505");
}
export const employeeService = {
    async createEmployee(input) {
        const email = generateEmail(input.full_name);
        const plainPassword = generatePassword();
        const passwordHash = await hashPassword(plainPassword);
        const [existingUser] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);
        if (existingUser) {
            throw ApiError.conflict("Email sudah terdaftar");
        }
        const join_date = input.join_date ?? new Date().toISOString().slice(0, 10);
        const position = input.position ?? "STAFF";
        const status = input.status ?? "PROBATION";
        const employee = await db.transaction(async (tx) => {
            let createdEmployee;
            if (position === "MANAGER") {
                const [dept] = await tx
                    .select()
                    .from(departmentsTable)
                    .where(eq(departmentsTable.id, input.department_id))
                    .limit(1);
                if (!dept) {
                    throw ApiError.notFound("Department tidak ditemukan");
                }
                if (dept.manager_id) {
                    throw ApiError.conflict("Department sudah memiliki manager. Silakan unassign manager terlebih dahulu.");
                }
                const [created] = await tx
                    .insert(employeesTable)
                    .values({
                    department_id: input.department_id,
                    full_name: input.full_name,
                    position: "MANAGER",
                    base_salary: String(input.base_salary),
                    join_date,
                    status
                })
                    .returning();
                await tx
                    .update(departmentsTable)
                    .set({ manager_id: created.id, updated_at: new Date() })
                    .where(eq(departmentsTable.id, input.department_id));
                createdEmployee = created;
            }
            else {
                const [created] = await tx
                    .insert(employeesTable)
                    .values({
                    department_id: input.department_id,
                    full_name: input.full_name,
                    position: "STAFF",
                    base_salary: String(input.base_salary),
                    join_date,
                    status
                })
                    .returning();
                createdEmployee = created;
            }
            await tx.insert(usersTable).values({
                employee_id: createdEmployee.id,
                email,
                password_hash: passwordHash,
                role: "STAFF"
            });
            return createdEmployee;
        });
        return {
            employee,
            credentials: { email, password: plainPassword }
        };
    },
    async getEmployeeById(id) {
        const [employee] = await db
            .select(withDepartmentProjection)
            .from(employeesTable)
            .leftJoin(departmentsTable, eq(departmentsTable.id, employeesTable.department_id))
            .where(eq(employeesTable.id, id))
            .limit(1);
        if (!employee) {
            throw ApiError.notFound("Employee tidak ditemukan");
        }
        const finalStatus = await autoTransitionAndPersist(employee.id, employee.status, employee.join_date);
        return { ...employee, status: finalStatus };
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
            .select(withDepartmentProjection)
            .from(employeesTable)
            .leftJoin(departmentsTable, eq(departmentsTable.id, employeesTable.department_id))
            .where(eq(employeesTable.id, user.employee_id))
            .limit(1);
        if (!employee) {
            throw ApiError.notFound("Employee tidak ditemukan");
        }
        const finalStatus = await autoTransitionAndPersist(employee.id, employee.status, employee.join_date);
        return { ...employee, status: finalStatus };
    },
    async listEmployees(userRole, userId) {
        if (userRole !== "HRD" && userRole !== "STAFF") {
            throw ApiError.forbidden("Role Anda tidak diizinkan melihat daftar karyawan");
        }
        if (userRole === "HRD") {
            const rows = await db
                .select(withDepartmentProjection)
                .from(employeesTable)
                .leftJoin(departmentsTable, eq(departmentsTable.id, employeesTable.department_id));
            const results = [];
            for (const row of rows) {
                const finalStatus = await autoTransitionAndPersist(row.id, row.status, row.join_date);
                results.push({ ...row, status: finalStatus });
            }
            return results;
        }
        const departmentId = await getUserDepartmentId(userId);
        return db
            .select(employeeListItemProjection)
            .from(employeesTable)
            .where(eq(employeesTable.department_id, departmentId));
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
        const currentStatus = existing.status;
        const newPosition = input.position ?? existing.position;
        if (input.status && input.status !== currentStatus) {
            const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
            if (!allowed.includes(input.status)) {
                throw ApiError.badRequest(`Transisi status dari ${currentStatus} ke ${input.status} tidak diizinkan`);
            }
        }
        if (input.position && input.position !== existing.position) {
            if (input.position === "MANAGER") {
                if (existing.position === "MANAGER") {
                    throw ApiError.badRequest("Karyawan sudah berstatus MANAGER");
                }
                const [dept] = await db
                    .select()
                    .from(departmentsTable)
                    .where(eq(departmentsTable.id, existing.department_id))
                    .limit(1);
                if (!dept) {
                    throw ApiError.notFound("Department tidak ditemukan");
                }
                if (dept.manager_id && dept.manager_id !== id) {
                    throw ApiError.conflict("Department sudah memiliki manager. Silakan unassign manager terlebih dahulu.");
                }
                await db.transaction(async (tx) => {
                    await tx
                        .update(employeesTable)
                        .set({ position: "MANAGER", updated_at: new Date() })
                        .where(eq(employeesTable.id, id));
                    await tx
                        .update(departmentsTable)
                        .set({ manager_id: id, updated_at: new Date() })
                        .where(eq(departmentsTable.id, existing.department_id));
                });
                const [updated] = await db
                    .select()
                    .from(employeesTable)
                    .where(eq(employeesTable.id, id))
                    .limit(1);
                return updated;
            }
            if (input.position === "STAFF" && existing.position === "MANAGER") {
                const [dept] = await db
                    .select()
                    .from(departmentsTable)
                    .where(eq(departmentsTable.manager_id, id))
                    .limit(1);
                await db.transaction(async (tx) => {
                    await tx
                        .update(employeesTable)
                        .set({ position: "STAFF", updated_at: new Date() })
                        .where(eq(employeesTable.id, id));
                    if (dept) {
                        await tx
                            .update(departmentsTable)
                            .set({ manager_id: null, updated_at: new Date() })
                            .where(eq(departmentsTable.manager_id, id));
                    }
                });
                const [updated] = await db
                    .select()
                    .from(employeesTable)
                    .where(eq(employeesTable.id, id))
                    .limit(1);
                return updated;
            }
        }
        if (input.department_id && input.department_id !== existing.department_id) {
            if (existing.position === "MANAGER") {
                const [dept] = await db
                    .select()
                    .from(departmentsTable)
                    .where(eq(departmentsTable.manager_id, id))
                    .limit(1);
                const deptName = dept?.name ?? "Unknown";
                throw ApiError.badRequest(`Karyawan ${existing.full_name} adalah manager dept ${deptName}. Silakan ubah manager dept ${deptName} terlebih dahulu.`);
            }
        }
        try {
            const [updated] = await db
                .update(employeesTable)
                .set({
                ...(input.full_name !== undefined && { full_name: input.full_name }),
                ...(input.department_id !== undefined && {
                    department_id: input.department_id
                }),
                ...(input.position !== undefined && { position: input.position }),
                ...(input.base_salary !== undefined && {
                    base_salary: String(input.base_salary)
                }),
                ...(input.join_date !== undefined && { join_date: input.join_date }),
                ...(input.status !== undefined && { status: input.status }),
                ...(input.nik !== undefined && { nik: input.nik }),
                ...(input.address !== undefined && { address: input.address }),
                ...(input.bank_account_number !== undefined && {
                    bank_account_number: input.bank_account_number
                }),
                ...(input.bank_account_name !== undefined && {
                    bank_account_name: input.bank_account_name
                }),
                ...(input.phone !== undefined && { phone: input.phone }),
                updated_at: new Date()
            })
                .where(eq(employeesTable.id, id))
                .returning();
            return updated;
        }
        catch (error) {
            if (isUniqueViolation(error)) {
                throw ApiError.conflict("NIK sudah terdaftar");
            }
            throw error;
        }
    },
    async updateOwnProfile(userId, input) {
        const employeeId = await getEmployeeIdByUserId(userId);
        try {
            const [updated] = await db
                .update(employeesTable)
                .set({
                nik: input.nik,
                address: input.address,
                bank_account_number: input.bank_account_number,
                bank_account_name: input.bank_account_name,
                phone: input.phone,
                updated_at: new Date()
            })
                .where(eq(employeesTable.id, employeeId))
                .returning();
            return updated;
        }
        catch (error) {
            if (isUniqueViolation(error)) {
                throw ApiError.conflict("NIK sudah terdaftar");
            }
            throw error;
        }
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
        if (existing.position === "MANAGER") {
            const [dept] = await db
                .select()
                .from(departmentsTable)
                .where(eq(departmentsTable.manager_id, id))
                .limit(1);
            const deptName = dept?.name ?? "Unknown";
            throw ApiError.badRequest(`Karyawan ${existing.full_name} adalah manager dept ${deptName}. Silakan ubah manager dept ${deptName} terlebih dahulu.`);
        }
        await db.transaction(async (tx) => {
            await tx
                .update(employeesTable)
                .set({ status: "RESIGNED", updated_at: new Date() })
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