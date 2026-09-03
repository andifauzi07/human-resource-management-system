import { eq, sql } from "drizzle-orm";
import db from "../configs/db.js";
import { departmentsTable } from "../drizzle/schemas/department.schema.js";
import { employeesTable } from "../drizzle/schemas/employee.schema.js";
import { ApiError } from "../utils/api-error.js";
const withManagerProjection = {
    id: departmentsTable.id,
    name: departmentsTable.name,
    manager_id: departmentsTable.manager_id,
    created_at: departmentsTable.created_at,
    updated_at: departmentsTable.updated_at,
    manager_name: employeesTable.full_name
};
async function validateManagerForDepartment(managerId, departmentId) {
    const [manager] = await db
        .select({
        id: employeesTable.id,
        status: employeesTable.status,
        department_id: employeesTable.department_id
    })
        .from(employeesTable)
        .where(eq(employeesTable.id, managerId))
        .limit(1);
    if (!manager) {
        throw ApiError.badRequest("Manager tidak ditemukan");
    }
    const managerStatus = manager.status;
    if (managerStatus !== "ACTIVE" && managerStatus !== "PROBATION") {
        throw ApiError.badRequest("Manager harus berstatus ACTIVE");
    }
    if (departmentId && manager.department_id !== departmentId) {
        throw ApiError.badRequest("Manager harus berasal dari department yang sama dengan department yang dikelola.");
    }
    const [existingManager] = await db
        .select()
        .from(departmentsTable)
        .where(eq(departmentsTable.manager_id, managerId))
        .limit(1);
    if (existingManager && existingManager.id !== departmentId) {
        throw ApiError.conflict("Karyawan tersebut sudah menjadi manager di department lain.");
    }
}
export const departmentService = {
    async createDepartment(input) {
        if (input.manager_id) {
            await db.transaction(async (tx) => {
                await validateManagerForDepartment(input.manager_id, input.id);
                const [existingManager] = await tx
                    .select()
                    .from(departmentsTable)
                    .where(eq(departmentsTable.manager_id, input.manager_id))
                    .limit(1);
                if (existingManager) {
                    throw ApiError.badRequest("Department sudah memiliki manager.");
                }
                const [dept] = await tx
                    .insert(departmentsTable)
                    .values({
                    name: input.name,
                    manager_id: input.manager_id
                })
                    .returning();
                await tx
                    .update(employeesTable)
                    .set({ position: "MANAGER", updated_at: new Date() })
                    .where(eq(employeesTable.id, input.manager_id));
                return dept;
            });
            const [created] = await db
                .select(withManagerProjection)
                .from(departmentsTable)
                .leftJoin(employeesTable, eq(employeesTable.id, departmentsTable.manager_id))
                .where(eq(departmentsTable.name, input.name))
                .limit(1);
            if (!created) {
                throw ApiError.badRequest("Gagal membuat department");
            }
            return {
                id: created.id,
                name: created.name,
                manager_id: created.manager_id,
                created_at: created.created_at,
                updated_at: created.updated_at,
                manager_name: created.manager_name
            };
        }
        const [created] = await db
            .insert(departmentsTable)
            .values({ name: input.name })
            .returning();
        return this.enrichWithManager(created);
    },
    async getDepartmentById(id) {
        const [department] = await db
            .select(withManagerProjection)
            .from(departmentsTable)
            .leftJoin(employeesTable, eq(employeesTable.id, departmentsTable.manager_id))
            .where(eq(departmentsTable.id, id))
            .limit(1);
        if (!department) {
            throw ApiError.notFound("Department tidak ditemukan");
        }
        return {
            id: department.id,
            name: department.name,
            manager_id: department.manager_id,
            created_at: department.created_at,
            updated_at: department.updated_at,
            manager_name: department.manager_name
        };
    },
    async listDepartments() {
        const rows = await db
            .select(withManagerProjection)
            .from(departmentsTable)
            .leftJoin(employeesTable, eq(employeesTable.id, departmentsTable.manager_id));
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            manager_id: row.manager_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            manager_name: row.manager_name
        }));
    },
    async updateDepartment(id, input) {
        await this.getDepartmentById(id);
        if (input.manager_id !== undefined || input.name !== undefined) {
            return db.transaction(async (tx) => {
                const currentDept = await tx
                    .select()
                    .from(departmentsTable)
                    .where(eq(departmentsTable.id, id))
                    .limit(1)
                    .then(rows => rows[0]);
                if (!currentDept) {
                    throw ApiError.notFound("Department tidak ditemukan");
                }
                const newManagerId = input.manager_id !== undefined
                    ? input.manager_id
                    : currentDept.manager_id;
                const oldManagerId = currentDept.manager_id;
                if (newManagerId) {
                    const [manager] = await tx
                        .select({
                        id: employeesTable.id,
                        status: employeesTable.status,
                        department_id: employeesTable.department_id
                    })
                        .from(employeesTable)
                        .where(eq(employeesTable.id, newManagerId))
                        .limit(1);
                    if (!manager) {
                        throw ApiError.badRequest("Manager tidak ditemukan");
                    }
                    const managerStatus = manager.status;
                    if (managerStatus !== "ACTIVE" && managerStatus !== "PROBATION") {
                        throw ApiError.badRequest("Manager harus berstatus ACTIVE");
                    }
                    if (manager.department_id !== id) {
                        throw ApiError.badRequest("Manager harus berasal dari department yang sama dengan department yang dikelola.");
                    }
                    if (newManagerId !== oldManagerId) {
                        const [existingDept] = await tx
                            .select()
                            .from(departmentsTable)
                            .where(eq(departmentsTable.manager_id, newManagerId))
                            .limit(1);
                        if (existingDept) {
                            throw ApiError.badRequest("Department sudah memiliki manager.");
                        }
                    }
                }
                await tx
                    .update(departmentsTable)
                    .set({
                    ...(input.name !== undefined && { name: input.name }),
                    ...(input.manager_id !== undefined && {
                        manager_id: input.manager_id
                    }),
                    updated_at: new Date()
                })
                    .where(eq(departmentsTable.id, id));
                if (oldManagerId && oldManagerId !== newManagerId) {
                    await tx
                        .update(employeesTable)
                        .set({ position: "STAFF", updated_at: new Date() })
                        .where(eq(employeesTable.id, oldManagerId));
                }
                if (newManagerId && newManagerId !== oldManagerId) {
                    await tx
                        .update(employeesTable)
                        .set({ position: "MANAGER", updated_at: new Date() })
                        .where(eq(employeesTable.id, newManagerId));
                }
                return this.getDepartmentById(id);
            });
        }
        const [updated] = await db
            .update(departmentsTable)
            .set({
            ...input,
            updated_at: new Date()
        })
            .where(eq(departmentsTable.id, id))
            .returning();
        return this.enrichWithManager(updated);
    },
    async deleteDepartment(id) {
        await this.getDepartmentById(id);
        const [employeeCount] = await db
            .select({ count: sql `count(*)::int` })
            .from(employeesTable)
            .where(eq(employeesTable.department_id, id));
        if (employeeCount.count > 0) {
            throw ApiError.badRequest("Tidak dapat menghapus department yang memiliki karyawan");
        }
        await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
    },
    async enrichWithManager(department) {
        if (!department.manager_id) {
            return { ...department, manager_name: null };
        }
        const [manager] = await db
            .select({ full_name: employeesTable.full_name })
            .from(employeesTable)
            .where(eq(employeesTable.id, department.manager_id))
            .limit(1);
        return {
            ...department,
            manager_name: manager ? manager.full_name : null
        };
    }
};
export default departmentService;
//# sourceMappingURL=department.service.js.map