import { describe, it, expect, vi, beforeEach } from "vitest";
import * as employeeController from "./employee.controller.js";
import employeeService from "../services/employee.service.js";
vi.mock("../services/employee.service", () => ({
    default: {
        createEmployee: vi.fn(),
        getEmployeeById: vi.fn(),
        getEmployeeByUserId: vi.fn(),
        listEmployees: vi.fn(),
        updateEmployee: vi.fn(),
        deactivateEmployee: vi.fn(),
        resetPassword: vi.fn()
    }
}));
const mockService = vi.mocked(employeeService);
function mockEmp(overrides) {
    return {
        id: "emp-1",
        department_id: "dept-1",
        full_name: "John Doe",
        position: "STAFF",
        base_salary: "5000000",
        join_date: "2026-09-01",
        nik: null,
        address: null,
        bank_account_number: null,
        bank_account_name: null,
        phone: null,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides
    };
}
function mockEmpWithDept(overrides) {
    return {
        ...mockEmp(overrides),
        department: { id: "dept-1", name: "Engineering" }
    };
}
function createMockReq(overrides) {
    return {
        body: {},
        params: {},
        user: { sub: "user-123", role: "HRD" },
        ...overrides
    };
}
function createMockRes() {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };
    return res;
}
async function runHandler(handler, req, res) {
    const next = vi.fn();
    handler(req, res, next);
    await new Promise(resolve => setTimeout(resolve, 0));
    if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
    }
}
describe("Employee Controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe("create", () => {
        it("should create employee", async () => {
            const result = {
                employee: mockEmp(),
                credentials: { email: "john@company.com", password: "pass123" }
            };
            mockService.createEmployee.mockResolvedValue(result);
            const req = createMockReq({
                body: {
                    full_name: "John Doe",
                    department_id: "550e8400-e29b-41d4-a716-446655440000",
                    position: "STAFF",
                    base_salary: 5000000,
                    join_date: "2026-09-01"
                }
            });
            const res = createMockRes();
            await runHandler(employeeController.create, req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });
        it("should create employee with a custom status from body", async () => {
            const result = {
                employee: mockEmp({ status: "ACTIVE" }),
                credentials: { email: "jane@company.com", password: "pass123" }
            };
            mockService.createEmployee.mockResolvedValue(result);
            const req = createMockReq({
                body: {
                    full_name: "Jane Doe",
                    department_id: "550e8400-e29b-41d4-a716-446655440000",
                    position: "STAFF",
                    base_salary: 6000000,
                    join_date: "2026-09-01",
                    status: "ACTIVE"
                }
            });
            const res = createMockRes();
            await runHandler(employeeController.create, req, res);
            expect(mockService.createEmployee).toHaveBeenCalledWith(expect.objectContaining({ status: "ACTIVE" }));
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });
    describe("list", () => {
        it("should return employees when HRD", async () => {
            mockService.listEmployees.mockResolvedValue([mockEmpWithDept()]);
            const req = createMockReq({ user: { sub: "user-1", role: "HRD" } });
            const res = createMockRes();
            await runHandler(employeeController.list, req, res);
            expect(mockService.listEmployees).toHaveBeenCalledWith("HRD", "user-1");
            expect(res.status).toHaveBeenCalledWith(200);
        });
        it("should pass userId when STAFF lists employees", async () => {
            mockService.listEmployees.mockResolvedValue([mockEmpWithDept()]);
            const req = createMockReq({ user: { sub: "user-1", role: "STAFF" } });
            const res = createMockRes();
            await runHandler(employeeController.list, req, res);
            expect(mockService.listEmployees).toHaveBeenCalledWith("STAFF", "user-1");
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
    describe("getMine", () => {
        it("should return own profile", async () => {
            mockService.getEmployeeByUserId.mockResolvedValue(mockEmpWithDept());
            const req = createMockReq({ user: { sub: "user-1", role: "STAFF" } });
            const res = createMockRes();
            await runHandler(employeeController.getMine, req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
    describe("getById", () => {
        it("should return employee by id", async () => {
            mockService.getEmployeeById.mockResolvedValue(mockEmpWithDept());
            const req = createMockReq({
                params: { id: "emp-1" },
                user: { sub: "user-1", role: "HRD" }
            });
            const res = createMockRes();
            await runHandler(employeeController.getById, req, res);
            expect(mockService.getEmployeeById).toHaveBeenCalledWith("emp-1");
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
    describe("update", () => {
        it("should update employee", async () => {
            mockService.updateEmployee.mockResolvedValue(mockEmp({ full_name: "Jane Doe" }));
            const req = createMockReq({
                params: { id: "emp-1" },
                body: { full_name: "Jane Doe" }
            });
            const res = createMockRes();
            await runHandler(employeeController.update, req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
    describe("remove", () => {
        it("should deactivate employee", async () => {
            mockService.deactivateEmployee.mockResolvedValue(undefined);
            const req = createMockReq({ params: { id: "emp-1" } });
            const res = createMockRes();
            await runHandler(employeeController.remove, req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
    describe("resetPassword", () => {
        it("should return new password", async () => {
            mockService.resetPassword.mockResolvedValue({
                email: "john@company.com",
                password: "NewPass123!"
            });
            const req = createMockReq({ params: { id: "emp-1" } });
            const res = createMockRes();
            await runHandler(employeeController.resetPassword, req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
//# sourceMappingURL=employee.controller.test.js.map