import { Request, Response } from "express";
import { z } from "zod";
import employeeService from "../services/employee.service";
import { ApiResponse } from "../utils/api-response";
import { AsyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";

const createEmployeeSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nama lengkap wajib diisi")
    .max(150, "Nama lengkap maksimal 150 karakter"),
  department_id: z.string().uuid("Department ID harus UUID valid"),
  position: z
    .string()
    .min(1, "Posisi wajib diisi")
    .max(100, "Posisi maksimal 100 karakter"),
  base_salary: z.number().positive("Gaji pokok harus lebih dari 0"),
  join_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD")
});

const updateEmployeeSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nama lengkap wajib diisi")
    .max(150, "Nama lengkap maksimal 150 karakter")
    .optional(),
  department_id: z.string().uuid("Department ID harus UUID valid").optional(),
  position: z
    .string()
    .min(1, "Posisi wajib diisi")
    .max(100, "Posisi maksimal 100 karakter")
    .optional(),
  base_salary: z.number().positive("Gaji pokok harus lebih dari 0").optional(),
  join_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD")
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  nik: z
    .string()
    .regex(/^\d{16}$/, "NIK harus 16 digit angka")
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
    .regex(/^\+?[0-9]{8,15}$/, "Nomor telepon tidak valid")
    .optional()
});

// Self-service: hanya field pribadi yang boleh diubah; field inti TIDAK diterima.
const updateMineSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  address: z.string().max(255, "Alamat maksimal 255 karakter").optional(),
  bank_account_number: z
    .string()
    .max(50, "Nomor rekening maksimal 50 karakter")
    .optional(),
  bank_account_name: z
    .string()
    .max(150, "Nama rekening maksimal 150 karakter")
    .optional(),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "Nomor telepon tidak valid")
});

export const create = AsyncHandler(async (req: Request, res: Response) => {
  const body = createEmployeeSchema.parse(req.body);
  const result = await employeeService.createEmployee(body);
  return ApiResponse.created(res, "Employee berhasil dibuat", result);
});

export const list = AsyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user?.role;
  const userId = req.user?.sub;
  if (!userRole || !userId) {
    throw ApiError.unauthorized("Tidak terautentikasi");
  }
  const employees = await employeeService.listEmployees(userRole, userId);
  return ApiResponse.ok(res, "Daftar employee", employees);
});

export const getMine = AsyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw ApiError.unauthorized("Tidak terautentikasi");
  }
  const employee = await employeeService.getEmployeeByUserId(userId);
  return ApiResponse.ok(res, "Profil employee", employee);
});

export const getById = AsyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const employee = await employeeService.getEmployeeById(id);
  return ApiResponse.ok(res, "Detail employee", employee);
});

export const updateMine = AsyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw ApiError.unauthorized("Tidak terautentikasi");
  }
  const body = updateMineSchema.parse(req.body);
  const employee = await employeeService.updateOwnProfile(userId, body);
  return ApiResponse.ok(res, "Profil berhasil diperbarui", employee);
});

export const update = AsyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const body = updateEmployeeSchema.parse(req.body);
  const employee = await employeeService.updateEmployee(id, body);
  return ApiResponse.ok(res, "Employee berhasil diupdate", employee);
});

export const remove = AsyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await employeeService.deactivateEmployee(id);
  return ApiResponse.ok(res, "Employee berhasil dinonaktifkan");
});

export const resetPassword = AsyncHandler(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const result = await employeeService.resetPassword(id);
    return ApiResponse.ok(res, "Password berhasil di-reset", result);
  }
);
