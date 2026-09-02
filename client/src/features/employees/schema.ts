import { z } from "zod";

export const employeeFormSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(150, "Nama maksimal 150 karakter"),
  department_id: z.string().uuid("Department tidak valid"),
  position: z
    .string()
    .min(1, "Jabatan wajib diisi")
    .max(100, "Jabatan maksimal 100 karakter"),
  base_salary: z.coerce
    .number()
    .positive("Gaji pokok harus lebih dari 0")
    .refine(Number.isInteger, "Gaji pokok harus bilangan bulat"),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD")
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;