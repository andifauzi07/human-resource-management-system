export interface Department {
  id: string;
  name: string;
  manager_id: string | null;
  manager_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  department_id: string;
  full_name: string;
  position: string;
  status: "ACTIVE" | "INACTIVE";
}
