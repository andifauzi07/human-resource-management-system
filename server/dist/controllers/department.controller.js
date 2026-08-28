import { z } from "zod";
import departmentService from "../services/department.service.js";
import { ApiResponse } from "../utils/api-response.js";
import { AsyncHandler } from "../utils/async-handler.js";
const createDepartmentSchema = z.object({
    name: z
        .string()
        .min(1, "Nama wajib diisi")
        .max(100, "Nama maksimal 100 karakter"),
    manager_id: z.string().uuid("Manager ID harus UUID valid").optional()
});
const updateDepartmentSchema = z.object({
    name: z
        .string()
        .min(1, "Nama wajib diisi")
        .max(100, "Nama maksimal 100 karakter")
        .optional(),
    manager_id: z.string().uuid("Manager ID harus UUID valid").optional()
});
export const create = AsyncHandler(async (req, res) => {
    const body = createDepartmentSchema.parse(req.body);
    const department = await departmentService.createDepartment(body);
    return ApiResponse.created(res, "Department berhasil dibuat", department);
});
export const list = AsyncHandler(async (_req, res) => {
    const departments = await departmentService.listDepartments();
    return ApiResponse.ok(res, "Daftar department", departments);
});
export const getById = AsyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const department = await departmentService.getDepartmentById(id);
    return ApiResponse.ok(res, "Detail department", department);
});
export const update = AsyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const body = updateDepartmentSchema.parse(req.body);
    const department = await departmentService.updateDepartment(id, body);
    return ApiResponse.ok(res, "Department berhasil diupdate", department);
});
export const remove = AsyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await departmentService.deleteDepartment(id);
    return ApiResponse.ok(res, "Department berhasil dihapus");
});
//# sourceMappingURL=department.controller.js.map