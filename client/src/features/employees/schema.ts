import { z } from "zod";

export const nikSchema = z
  .string()
  .regex(/^\d{16}$/, "NIK harus 16 digit angka");

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9]{8,15}$/, "Nomor telepon tidak valid");

export const positionEnum = z.enum(["STAFF", "MANAGER"]);
export const statusEnum = z.enum(["PROBATION", "ACTIVE", "ON_LEAVE", "RESIGNED"]);

export const employeeFormSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(150, "Nama maksimal 150 karakter"),
  department_id: z.string().uuid("Department tidak valid"),
  position: positionEnum,
  base_salary: z.coerce
    .number()
    .positive("Gaji pokok harus lebih dari 0")
    .refine(Number.isInteger, "Gaji pokok harus bilangan bulat"),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD")
});

export const employeeEditSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(150, "Nama maksimal 150 karakter"),
  department_id: z.string().uuid("Department tidak valid"),
  position: positionEnum,
  base_salary: z.coerce
    .number()
    .positive("Gaji pokok harus lebih dari 0")
    .refine(Number.isInteger, "Gaji pokok harus bilangan bulat"),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
  status: statusEnum.optional(),
  nik: z
    .string()
    .refine((v) => v === "" || /^\d{16}$/.test(v), "NIK harus 16 digit angka")
    .optional(),
  address: z.string().max(255, "Alamat maksimal 255 karakter").optional(),
  bank_account_number: z
    .string()
    .max(50, "Nomor rekening maksimal 50 karakter")
    .optional(),
  bank_account_name: z
    .string()
    .max(150, "Nama rekening maksimal 150 karakter")
    .optional(),
  phone: z
    .string()
    .refine(
      (v) => v === "" || /^\+?[0-9]{8,15}$/.test(v),
      "Nomor telepon tidak valid"
    )
    .optional()
});

export const updateMineSchema = z.object({
  nik: nikSchema,
  address: z.string().max(255, "Alamat maksimal 255 karakter").optional(),
  bank_account_number: z
    .string()
    .max(50, "Nomor rekening maksimal 50 karakter")
    .optional(),
  bank_account_name: z
    .string()
    .max(150, "Nama rekening maksimal 150 karakter")
    .optional(),
  phone: phoneSchema
});

export const employeeDetailSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(150, "Nama maksimal 150 karakter"),
  department_id: z.string().uuid("Department tidak valid"),
  position: positionEnum,
  base_salary: z.coerce
    .number()
    .positive("Gaji pokok harus lebih dari 0")
    .refine(Number.isInteger, "Gaji pokok harus bilangan bulat"),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
  status: statusEnum,
  nik: nikSchema,
  address: z.string().max(255, "Alamat maksimal 255 karakter").optional(),
  bank_account_number: z
    .string()
    .max(50, "Nomor rekening maksimal 50 karakter")
    .optional(),
  bank_account_name: z
    .string()
    .max(150, "Nama rekening maksimal 150 karakter")
    .optional(),
  phone: phoneSchema
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
export type EmployeeEditValues = z.infer<typeof employeeEditSchema>;
export type UpdateMineValues = z.infer<typeof updateMineSchema>;
export type EmployeeDetailValues = z.infer<typeof employeeDetailSchema>;