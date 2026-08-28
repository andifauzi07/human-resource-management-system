import { eq, sql } from "drizzle-orm";
import db from "../configs/db";
import {
  departmentsTable,
  type Department,
  type NewDepartment
} from "../drizzle/schemas/department.schema";
import { employeesTable } from "../drizzle/schemas/employee.schema";
import { ApiError } from "../utils/api-error";

export const departmentService = {
  async createDepartment(input: NewDepartment): Promise<Department> {
    const [created] = await db
      .insert(departmentsTable)
      .values(input)
      .returning();

    return created;
  },

  async getDepartmentById(id: string): Promise<Department> {
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

  async listDepartments(): Promise<Department[]> {
    return db.select().from(departmentsTable);
  },

  async updateDepartment(
    id: string,
    input: Partial<NewDepartment>
  ): Promise<Department> {
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

  async deleteDepartment(id: string): Promise<void> {
    await this.getDepartmentById(id);

    const [employeeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employeesTable)
      .where(eq(employeesTable.department_id, id));

    if (employeeCount.count > 0) {
      throw ApiError.badRequest(
        "Tidak dapat menghapus department yang memiliki karyawan"
      );
    }

    await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
  }
};

export default departmentService;
