import { apiFetch } from "@/lib/api";
import type { Employee } from "../employees/types";
import type { Department } from "./types";

export interface CreateDepartmentInput {
  name: string;
  manager_id?: string | null;
}

export interface UpdateDepartmentInput {
  name?: string;
  manager_id?: string | null;
}

export const departmentsApi = {
  async list(): Promise<Department[]> {
    return apiFetch<Department[]>("/departments");
  },
  async getById(id: string): Promise<Department> {
    return apiFetch<Department>(`/departments/${id}`);
  },
  async create(input: CreateDepartmentInput): Promise<Department> {
    return apiFetch<Department>("/departments", {
      method: "POST",
      body: input
    });
  },
  async update(id: string, input: UpdateDepartmentInput): Promise<Department> {
    return apiFetch<Department>(`/departments/${id}`, {
      method: "PATCH",
      body: input
    });
  },
  async remove(id: string): Promise<void> {
    await apiFetch<null>(`/departments/${id}`, { method: "DELETE" });
  }
};

export const departmentsEmployeesApi = {
  async list(): Promise<Employee[]> {
    return apiFetch<Employee[]>("/employees");
  }
};
