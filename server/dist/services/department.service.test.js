import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../configs/db", () => ({
    default: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }
}));
import { departmentService } from "./department.service.js";
import db from "../configs/db.js";
const mockDb = vi.mocked(db);
function mockDept(overrides) {
    return {
        id: "dept-123",
        name: "Engineering",
        manager_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides
    };
}
function mockSelectChain(result) {
    const limit = vi
        .fn()
        .mockResolvedValue(Array.isArray(result) ? result : [result]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    return { from, _limit: limit, _where: where };
}
describe("Department Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe("createDepartment", () => {
        it("should create department", async () => {
            const dept = mockDept();
            const chain = {
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([dept])
                })
            };
            mockDb.insert.mockReturnValue(chain);
            const result = await departmentService.createDepartment({
                name: "Engineering"
            });
            expect(result).toEqual(dept);
        });
    });
    describe("getDepartmentById", () => {
        it("should return department when found", async () => {
            const dept = mockDept();
            const chain = mockSelectChain(dept);
            mockDb.select.mockReturnValue(chain);
            const result = await departmentService.getDepartmentById("dept-123");
            expect(result).toEqual(dept);
        });
        it("should throw error when not found", async () => {
            const chain = mockSelectChain([]);
            mockDb.select.mockReturnValue(chain);
            await expect(departmentService.getDepartmentById("nonexistent")).rejects.toThrow("Department tidak ditemukan");
        });
    });
    describe("listDepartments", () => {
        it("should return all departments", async () => {
            const depts = [mockDept({ id: "1" }), mockDept({ id: "2" })];
            const chain = { from: vi.fn().mockResolvedValue(depts) };
            mockDb.select.mockReturnValue(chain);
            const result = await departmentService.listDepartments();
            expect(result).toEqual(depts);
        });
    });
    describe("updateDepartment", () => {
        it("should update department fields", async () => {
            const dept = mockDept();
            const updated = mockDept({ name: "Updated" });
            const selectChain = mockSelectChain(dept);
            mockDb.select.mockReturnValue(selectChain);
            const updateChain = {
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([updated])
                    })
                })
            };
            mockDb.update.mockReturnValue(updateChain);
            const result = await departmentService.updateDepartment("dept-123", {
                name: "Updated"
            });
            expect(result).toEqual(updated);
        });
    });
    describe("deleteDepartment", () => {
        it("should delete department if no employees", async () => {
            const dept = mockDept();
            // First select: getDepartmentById
            const empChain = mockSelectChain(dept);
            mockDb.select.mockReturnValueOnce(empChain);
            // Second select: employee count
            const countChain = {
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ count: 0 }])
                })
            };
            mockDb.select.mockReturnValueOnce(countChain);
            const deleteChain = {
                where: vi.fn().mockResolvedValue(undefined)
            };
            mockDb.delete.mockReturnValue(deleteChain);
            await departmentService.deleteDepartment("dept-123");
            expect(mockDb.delete).toHaveBeenCalled();
        });
        it("should throw error if department has employees", async () => {
            const dept = mockDept();
            // First select: getDepartmentById
            const empChain = mockSelectChain(dept);
            mockDb.select.mockReturnValueOnce(empChain);
            // Second select: employee count
            const countChain = {
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ count: 5 }])
                })
            };
            mockDb.select.mockReturnValueOnce(countChain);
            await expect(departmentService.deleteDepartment("dept-123")).rejects.toThrow("Tidak dapat menghapus department yang memiliki karyawan");
        });
    });
});
//# sourceMappingURL=department.service.test.js.map