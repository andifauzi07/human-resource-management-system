import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../configs/db", () => ({
    default: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        transaction: vi.fn()
    }
}));
vi.mock("../utils/password", () => ({
    generatePassword: vi.fn().mockReturnValue("TestPass123!"),
    generateEmail: vi.fn().mockReturnValue("john.doe@company.com")
}));
vi.mock("../utils/auth", () => ({
    hashPassword: vi.fn().mockResolvedValue("hashed_password")
}));
import { employeeService } from "./employee.service.js";
import db from "../configs/db.js";
const mockDb = vi.mocked(db);
function mockEmp(overrides) {
    return {
        id: "emp-123",
        department_id: "dept-123",
        full_name: "John Doe",
        position: "Engineer",
        base_salary: "5000000",
        join_date: "2026-09-01",
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides
    };
}
function mockUser(overrides) {
    return {
        id: "user-123",
        employee_id: "emp-123",
        email: "john.doe@company.com",
        password_hash: "hashed_password",
        role: "STAFF",
        created_at: new Date(),
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
describe("Employee Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe("createEmployee", () => {
        it("should create employee + user account with generated password", async () => {
            const employee = mockEmp();
            const user = mockUser();
            // Mock email check - no existing user
            const emailCheck = mockSelectChain([]);
            mockDb.select.mockReturnValueOnce(emailCheck);
            // Mock employee insert
            const insertChain = {
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([employee])
                })
            };
            mockDb.insert.mockReturnValueOnce(insertChain);
            // Mock user insert
            const userInsertChain = {
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([user])
                })
            };
            mockDb.insert.mockReturnValueOnce(userInsertChain);
            const result = await employeeService.createEmployee({
                full_name: "John Doe",
                department_id: "dept-123",
                position: "Engineer",
                base_salary: 5000000,
                join_date: "2026-09-01"
            });
            expect(result.employee).toEqual(employee);
            expect(result.credentials.email).toBe("john.doe@company.com");
            expect(result.credentials.password).toBe("TestPass123!");
        });
        it("should throw error if email already exists", async () => {
            const existingUser = mockUser();
            const emailCheck = mockSelectChain(existingUser);
            mockDb.select.mockReturnValue(emailCheck);
            await expect(employeeService.createEmployee({
                full_name: "John Doe",
                department_id: "dept-123",
                position: "Engineer",
                base_salary: 5000000,
                join_date: "2026-09-01"
            })).rejects.toThrow("Email sudah terdaftar");
        });
    });
    describe("getEmployeeById", () => {
        it("should return employee when HRD", async () => {
            const employee = mockEmp();
            const chain = mockSelectChain(employee);
            mockDb.select.mockReturnValue(chain);
            const result = await employeeService.getEmployeeById("emp-123", "HRD", "user-456");
            expect(result).toEqual(employee);
        });
        it("should throw 403 when STAFF tries to view other", async () => {
            const employee = mockEmp({ id: "emp-other" });
            const chain = mockSelectChain(employee);
            mockDb.select.mockReturnValue(chain);
            await expect(employeeService.getEmployeeById("emp-other", "STAFF", "user-123")).rejects.toThrow("Tidak diizinkan melihat data karyawan lain");
        });
    });
    describe("listEmployees", () => {
        it("should return all employees when HRD", async () => {
            const employees = [mockEmp()];
            const chain = { from: vi.fn().mockResolvedValue(employees) };
            mockDb.select.mockReturnValue(chain);
            const result = await employeeService.listEmployees("HRD");
            expect(result).toEqual(employees);
        });
        it("should throw 403 when STAFF tries to list all", async () => {
            await expect(employeeService.listEmployees("STAFF")).rejects.toThrow("Hanya HRD yang dapat melihat semua karyawan");
        });
    });
    describe("updateEmployee", () => {
        it("should update employee fields", async () => {
            const employee = mockEmp();
            const updated = mockEmp({ full_name: "Jane Doe" });
            const selectChain = mockSelectChain(employee);
            mockDb.select.mockReturnValue(selectChain);
            const updateChain = {
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([updated])
                    })
                })
            };
            mockDb.update.mockReturnValue(updateChain);
            const result = await employeeService.updateEmployee("emp-123", {
                full_name: "Jane Doe"
            });
            expect(result).toEqual(updated);
        });
        it("should throw error if employee not found", async () => {
            const chain = mockSelectChain([]);
            mockDb.select.mockReturnValue(chain);
            await expect(employeeService.updateEmployee("nonexistent", { full_name: "Test" })).rejects.toThrow("Employee tidak ditemukan");
        });
    });
    describe("deactivateEmployee", () => {
        it("should set status to INACTIVE and clear manager_id of departments", async () => {
            const employee = mockEmp();
            const selectChain = mockSelectChain(employee);
            mockDb.select.mockReturnValue(selectChain);
            const updateChain = {
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined)
                })
            };
            mockDb.update.mockReturnValue(updateChain);
            const txUpdate = vi.fn().mockReturnValue(updateChain);
            const tx = { update: txUpdate };
            mockDb.transaction.mockImplementation((async (cb) => cb(tx)));
            await employeeService.deactivateEmployee("emp-123");
            expect(mockDb.transaction).toHaveBeenCalled();
            expect(tx.update).toHaveBeenCalledTimes(2);
        });
        it("should throw error if employee not found", async () => {
            const chain = mockSelectChain([]);
            mockDb.select.mockReturnValue(chain);
            await expect(employeeService.deactivateEmployee("nonexistent")).rejects.toThrow("Employee tidak ditemukan");
        });
    });
    describe("resetPassword", () => {
        it("should generate new password and return plain text", async () => {
            const employee = mockEmp();
            const user = mockUser();
            // First select: getEmployeeById
            const empChain = mockSelectChain(employee);
            mockDb.select.mockReturnValueOnce(empChain);
            // Second select: find user by employee_id
            const userChain = mockSelectChain(user);
            mockDb.select.mockReturnValueOnce(userChain);
            const updateChain = {
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined)
                })
            };
            mockDb.update.mockReturnValue(updateChain);
            const result = await employeeService.resetPassword("emp-123");
            expect(result.email).toBe("john.doe@company.com");
            expect(result.password).toBe("TestPass123!");
        });
    });
});
//# sourceMappingURL=employee.service.test.js.map