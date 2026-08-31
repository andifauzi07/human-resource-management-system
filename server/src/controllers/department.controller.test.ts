import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import * as departmentController from "./department.controller";
import departmentService from "../services/department.service";
import type { DepartmentWithManager } from "../services/department.service";

vi.mock("../services/department.service", () => ({
  default: {
    createDepartment: vi.fn(),
    getDepartmentById: vi.fn(),
    listDepartments: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn()
  }
}));

const mockService = vi.mocked(departmentService);

function mockDept(
  overrides?: Partial<DepartmentWithManager>
): DepartmentWithManager {
  return {
    id: "1",
    name: "Engineering",
    manager_id: null,
    manager_name: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

function createMockReq(overrides?: Partial<Request>) {
  return {
    body: {},
    params: {},
    user: { sub: "user-123", role: "HRD" },
    ...overrides
  } as Request;
}

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  } as unknown as Response;
  return res;
}

// Helper to run AsyncHandler and wait for completion
async function runHandler(
  handler: (
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next: any
  ) => void,
  req: Request,
  res: Response
): Promise<void> {
  const next = vi.fn();
  handler(req, res, next);
  // Wait for promise chain to complete
  await new Promise(resolve => setTimeout(resolve, 0));
  if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
    throw next.mock.calls[0][0];
  }
}

describe("Department Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create department", async () => {
      const dept = mockDept();
      mockService.createDepartment.mockResolvedValue(dept);

      const req = createMockReq({ body: { name: "Engineering" } });
      const res = createMockRes();

      await runHandler(departmentController.create, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("list", () => {
    it("should return departments", async () => {
      mockService.listDepartments.mockResolvedValue([mockDept()]);

      const req = createMockReq();
      const res = createMockRes();

      await runHandler(departmentController.list, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getById", () => {
    it("should return department", async () => {
      mockService.getDepartmentById.mockResolvedValue(mockDept());

      const req = createMockReq({ params: { id: "1" } });
      const res = createMockRes();

      await runHandler(departmentController.getById, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("update", () => {
    it("should update department", async () => {
      mockService.updateDepartment.mockResolvedValue(
        mockDept({ name: "Updated" })
      );

      const req = createMockReq({
        params: { id: "1" },
        body: { name: "Updated" }
      });
      const res = createMockRes();

      await runHandler(departmentController.update, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("remove", () => {
    it("should delete department", async () => {
      mockService.deleteDepartment.mockResolvedValue(undefined);

      const req = createMockReq({ params: { id: "1" } });
      const res = createMockRes();

      await runHandler(departmentController.remove, req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
