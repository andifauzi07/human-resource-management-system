export type EmployeeStatus = "PROBATION" | "ACTIVE" | "ON_LEAVE" | "RESIGNED";

export type EmployeePosition = "STAFF" | "MANAGER";

export interface EmployeeListItem {
  id: string;
  full_name: string;
  position: EmployeePosition;
  status: EmployeeStatus;
  join_date: string;
}

export interface EmployeeDepartment {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  department_id: string;
  full_name: string;
  position: EmployeePosition;
  base_salary: string;
  join_date: string;
  nik: string | null;
  address: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  phone: string | null;
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