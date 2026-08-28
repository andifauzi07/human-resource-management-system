import { eq, sql } from "drizzle-orm";
import db from "../configs/db.js";
import { departmentsTable } from "../drizzle/schemas/department.schema.js";
import { employeesTable } from "../drizzle/schemas/employee.schema.js";
import { ApiError } from "../utils/api-error.js";
export const departmentService = {
    async createDepartment(input) {
        const [created] = await db
            .insert(departmentsTable)
            .values(input)
            .returning();
        return created;
    },
    async getDepartmentById(id) {
        const [department] = await db
            .select()
            .from(departmentsTable)
            .where(eq(departmentsTable.id, id))
            .limit(1);
        if (!department) {
            throw ApiError.notFound("Department tidak ditemukan");
        }
        return department;
    },
    async listDepartments() {
        return db.select().from(departmentsTable);
    },
    async updateDepartment(id, input) {
        await this.getDepartmentById(id);
        const [updated] = await db
            .update(departmentsTable)
            .set({
            ...input,
            updated_at: new Date()
        })
            .where(eq(departmentsTable.id, id))
            .returning();
        return updated;
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
    }
};
export default departmentService;
//# sourceMappingURL=department.service.js.map