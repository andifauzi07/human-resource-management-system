export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export interface EmployeeListItem {
  id: string;
  full_name: string;
  position: string;
}

export interface EmployeeDepartment {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  department_id: string;
  full_name: string;
  position: string;
  base_salary: string;
  join_date: string;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
  department: EmployeeDepartment | null;
}

export interface EmployeeCredentials {
  email: string;
  password: string;
}

export interface CreateEmployeeResult {
  employee: Employee;
  credentials: EmployeeCredentials;
}