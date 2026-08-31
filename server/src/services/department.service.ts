import { eq, sql } from "drizzle-orm";
import db from "../configs/db";
import {
  departmentsTable,
  type Department,
  type NewDepartment
} from "../drizzle/schemas/department.schema";
import {
  employeesTable,
  type Employee
} from "../drizzle/schemas/employee.schema";
import { ApiError } from "../utils/api-error";

export interface DepartmentWithManager extends Department {
  manager_name: string | null;
}

const withManagerProjection = {
  id: departmentsTable.id,
  name: departmentsTable.name,
  manager_id: departmentsTable.manager_id,
  created_at: departmentsTable.created_at,
  updated_at: departmentsTable.updated_at,
  manager_name: employeesTable.full_name
};

async function validateManager(managerId: string): Promise<void> {
  const [manager] = await db
    .select({ id: employeesTable.id, status: employeesTable.status })
    .from(employeesTable)
    .where(eq(employeesTable.id, managerId))
    .limit(1);

  if (!manager) {
    throw ApiError.badRequest("Manager tidak ditemukan");
  }

  if (manager.status !== "ACTIVE") {
    throw ApiError.badRequest("Manager harus berstatus ACTIVE");
  }
}

export const departmentService = {
  async createDepartment(input: NewDepartment): Promise<DepartmentWithManager> {
    if (input.manager_id) {
      await validateManager(input.manager_id);
    }

    const [created] = await db
      .insert(departmentsTable)
      .values(input)
      .returning();

    return this.enrichWithManager(created);
  },

  async getDepartmentById(id: string): Promise<DepartmentWithManager> {
    const [department] = await db
      .select(withManagerProjection)
      .from(departmentsTable)
      .leftJoin(
        employeesTable,
        eq(employeesTable.id, departmentsTable.manager_id)
      )
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

  async listDepartments(): Promise<DepartmentWithManager[]> {
    const rows = await db
      .select(withManagerProjection)
      .from(departmentsTable)
      .leftJoin(
        employeesTable,
        eq(employeesTable.id, departmentsTable.manager_id)
      );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      manager_id: row.manager_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      manager_name: row.manager_name
    }));
  },

  async updateDepartment(
    id: string,
    input: Partial<NewDepartment>
  ): Promise<DepartmentWithManager> {
    await this.getDepartmentById(id);

    if (input.manager_id) {
      await validateManager(input.manager_id);
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
  },

  async enrichWithManager(
    department: Department
  ): Promise<DepartmentWithManager> {
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
