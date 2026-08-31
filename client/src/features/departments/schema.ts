import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter"),
  manager_id: z.string().uuid("Manager tidak valid").nullable().optional()
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
