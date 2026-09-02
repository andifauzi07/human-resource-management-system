import { z } from "zod";
import employeeService from "../services/employee.service.js";
import { ApiResponse } from "../utils/api-response.js";
import { AsyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
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
    status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});
export const create = AsyncHandler(async (req, res) => {
    const body = createEmployeeSchema.parse(req.body);
    const result = await employeeService.createEmployee(body);
    return ApiResponse.created(res, "Employee berhasil dibuat", result);
});
export const list = AsyncHandler(async (req, res) => {
    const userRole = req.user?.role;
    const userId = req.user?.sub;
    if (!userRole || !userId) {
        throw ApiError.unauthorized("Tidak terautentikasi");
    }
    const employees = await employeeService.listEmployees(userRole, userId);
    return ApiResponse.ok(res, "Daftar employee", employees);
});
export const getMine = AsyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) {
        throw ApiError.unauthorized("Tidak terautentikasi");
    }
    const employee = await employeeService.getEmployeeByUserId(userId);
    return ApiResponse.ok(res, "Profil employee", employee);
});
export const getById = AsyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const employee = await employeeService.getEmployeeById(id);
    return ApiResponse.ok(res, "Detail employee", employee);
});
export const update = AsyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const body = updateEmployeeSchema.parse(req.body);
    const employee = await employeeService.updateEmployee(id, body);
    return ApiResponse.ok(res, "Employee berhasil diupdate", employee);
});
export const remove = AsyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await employeeService.deactivateEmployee(id);
    return ApiResponse.ok(res, "Employee berhasil dinonaktifkan");
});
export const resetPassword = AsyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const result = await employeeService.resetPassword(id);
    return ApiResponse.ok(res, "Password berhasil di-reset", result);
});
//# sourceMappingURL=employee.controller.js.map