export interface Department {
  id: string;
  name: string;
  manager_id: string | null;
  manager_name: string | null;
  created_at: string;
  updated_at: string;
}
