import { apiFetch } from "@/lib/api";
import type {
  CreateEmployeeResult,
  Employee,
  EmployeeCredentials,
  EmployeeListItem
} from "./types";

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
  nik?: string;
  address?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  phone?: string;
}

export type UpdateMyProfileInput = Pick<
  UpdateEmployeeInput,
  "nik" | "address" | "bank_account_number" | "bank_account_name" | "phone"
>;

export const employeesApi = {
  async list(): Promise<EmployeeListItem[]> {
    return apiFetch<EmployeeListItem[]>("/employees");
  },
  async listAll(): Promise<Employee[]> {
    return apiFetch<Employee[]>("/employees");
  },
  async mine(): Promise<Employee> {
    return apiFetch<Employee>("/employees/mine");
  },
  async getById(id: string): Promise<Employee> {
    return apiFetch<Employee>(`/employees/${id}`);
  },
  async updateMine(input: UpdateMyProfileInput): Promise<Employee> {
    return apiFetch<Employee>("/employees/mine", {
      method: "PATCH",
      body: input
    });
  },
  async create(input: CreateEmployeeInput): Promise<CreateEmployeeResult> {
    return apiFetch<CreateEmployeeResult>("/employees", {
      method: "POST",
      body: input
    });
  },
  async update(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    return apiFetch<Employee>(`/employees/${id}`, {
      method: "PATCH",
      body: input
    });
  },
  async remove(id: string): Promise<void> {
    await apiFetch<null>(`/employees/${id}`, { method: "DELETE" });
  },
  async resetPassword(id: string): Promise<EmployeeCredentials> {
    return apiFetch<EmployeeCredentials>(`/employees/${id}/reset-password`, {
      method: "POST"
    });
  }
};