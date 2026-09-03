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

import { departmentService } from "./department.service";
import db from "../configs/db";

const mockDb = vi.mocked(db);

function mockDept(overrides?: Record<string, unknown>) {
  return {
    id: "dept-123",
    name: "Engineering",
    manager_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

function mockManager(overrides?: Record<string, unknown>) {
  return {
    id: "emp-1",
    department_id: "dept-123",
    full_name: "Jane Manager",
    position: "Manager",
    base_salary: "10000000",
    join_date: "2026-09-01",
    status: "ACTIVE" as const,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

function mockSelectChain(result: unknown) {
  const limit = vi
    .fn()
    .mockResolvedValue(Array.isArray(result) ? result : [result]);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, _limit: limit, _where: where };
}

function mockJoinSelectChain(result: unknown) {
  const where = vi.fn().mockReturnValue({
    limit: vi.fn().mockResolvedValue(result)
  });
  const leftJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ leftJoin });
  return { from, leftJoin, where };
}

function mockListJoinChain(result: unknown) {
  // Departments list: select().from().leftJoin() resolves to rows array
  const rows = Array.isArray(result) ? result : [result];
  const leftJoin = vi.fn().mockResolvedValue(rows);
  const from = vi.fn().mockReturnValue({ leftJoin });
  return { from, leftJoin };
}

function makeTx() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
}

function txSelectChain(result: unknown) {
  const limit = vi
    .fn()
    .mockResolvedValue(Array.isArray(result) ? result : [result]);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, _limit: limit, _where: where };
}

function txInsertChain(result: unknown) {
  const returning = vi
    .fn()
    .mockResolvedValue(Array.isArray(result) ? result : [result]);
  const values = vi.fn().mockReturnValue({ returning });
  return { values };
}

function txUpdateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  return { set };
}

describe("Department Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDepartment", () => {
    it("should create department without manager", async () => {
      const dept = mockDept();
      const chain = {
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([dept])
        })
      };
      mockDb.insert.mockReturnValue(chain as never);

      const result = await departmentService.createDepartment({
        name: "Engineering"
      });

      expect(result).toEqual({ ...dept, manager_name: null });
    });

    it("should create department with valid active manager", async () => {
      const dept = mockDept({ manager_id: "emp-1" });
      const manager = mockManager({ department_id: "dept-123" });

      // validateManagerForDepartment uses db.select (outside tx)
      // - first select for manager lookup: returns manager with status+department_id
      const mgrChain = mockSelectChain({
        id: manager.id,
        status: manager.status,
        department_id: manager.department_id
      });
      mockDb.select.mockReturnValueOnce(mgrChain as never);

      // - second select for existingManager: no existing department
      const existingMgrChain = mockSelectChain([]);
      mockDb.select.mockReturnValueOnce(existingMgrChain as never);

      // db.transaction callback
      const tx = makeTx();
      // inside tx: existingManager select (no existing)
      tx.select.mockReturnValueOnce(txSelectChain([]));
      // inside tx: insert returns dept
      tx.insert.mockReturnValueOnce(txInsertChain([dept]));
      // inside tx: update employee position
      tx.update.mockReturnValueOnce(txUpdateChain());
      mockDb.transaction.mockImplementation(async cb => cb(tx as never));

      // After tx: select(withManagerProjection) join to get created dept
      const createdChain = mockJoinSelectChain([
        {
          id: dept.id,
          name: dept.name,
          manager_id: dept.manager_id,
          created_at: dept.created_at,
          updated_at: dept.updated_at,
          manager_name: manager.full_name
        }
      ]);
      mockDb.select.mockReturnValueOnce(createdChain as never);

      const result = await departmentService.createDepartment({
        name: "Engineering",
        manager_id: "emp-1"
      });

      expect(result.manager_id).toBe("emp-1");
      expect(result.manager_name).toBe("Jane Manager");
    });

    it("should throw 400 when manager does not exist", async () => {
      // validateManager: db.select returns empty -> "Manager tidak ditemukan"
      const mgrChain = mockSelectChain([]);
      mockDb.select.mockReturnValue(mgrChain as never);

      await expect(
        departmentService.createDepartment({
          name: "Engineering",
          manager_id: "missing"
        })
      ).rejects.toThrow("Manager tidak ditemukan");
    });

    it("should throw 400 when manager is INACTIVE", async () => {
      const manager = mockManager({ status: "INACTIVE" });
      const mgrChain = mockSelectChain({
        id: manager.id,
        status: manager.status,
        department_id: manager.department_id
      });
      mockDb.select.mockReturnValue(mgrChain as never);

      // transaction must execute the callback so validateManager runs
      const tx = makeTx();
      mockDb.transaction.mockImplementation(async cb => cb(tx as never));

      await expect(
        departmentService.createDepartment({
          name: "Engineering",
          manager_id: "emp-1"
        })
      ).rejects.toThrow("Manager harus berstatus ACTIVE");
    });
  });

  describe("getDepartmentById", () => {
    it("should return department with manager_name when found", async () => {
      const row = {
        id: "dept-123",
        name: "Engineering",
        manager_id: "emp-1",
        manager_name: "Jane Manager",
        created_at: new Date(),
        updated_at: new Date()
      };
      const chain = mockJoinSelectChain([row]);
      mockDb.select.mockReturnValue(chain as never);

      const result = await departmentService.getDepartmentById("dept-123");
      expect(result).toEqual(row);
    });

    it("should throw error when not found", async () => {
      const chain = mockJoinSelectChain([]);
      mockDb.select.mockReturnValue(chain as never);

      await expect(
        departmentService.getDepartmentById("nonexistent")
      ).rejects.toThrow("Department tidak ditemukan");
    });
  });

  describe("listDepartments", () => {
    it("should return departments with manager_name", async () => {
      const rows = [
        {
          id: "1",
          name: "Engineering",
          manager_id: "emp-1",
          manager_name: "Jane Manager",
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: "2",
          name: "Marketing",
          manager_id: null,
          manager_name: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      const chain = mockListJoinChain(rows);
      mockDb.select.mockReturnValue(chain as never);

      const result = await departmentService.listDepartments();
      expect(result).toEqual(rows);
    });
  });

  describe("updateDepartment", () => {
    it("should update department fields and return manager_name", async () => {
      const existing = mockDept();

      // getDepartmentById (join select)
      const selectChain = mockJoinSelectChain([
        {
          id: existing.id,
          name: existing.name,
          manager_id: existing.manager_id,
          manager_name: null,
          created_at: existing.created_at,
          updated_at: existing.updated_at
        }
      ]);
      mockDb.select.mockReturnValueOnce(selectChain as never);

      // transaction flow for name update (no manager change)
      const tx = makeTx();
      // inside tx: select current dept
      tx.select.mockReturnValueOnce(txSelectChain([existing]));
      // inside tx: update dept table
      tx.update.mockReturnValueOnce(txUpdateChain());
      mockDb.transaction.mockImplementation(async cb => cb(tx as never));

      // after tx: return this.getDepartmentById(id) again (join select)
      const finalChain = mockJoinSelectChain([
        {
          id: existing.id,
          name: "Updated",
          manager_id: existing.manager_id,
          manager_name: null,
          created_at: existing.created_at,
          updated_at: existing.updated_at
        }
      ]);
      mockDb.select.mockReturnValueOnce(finalChain as never);

      const result = await departmentService.updateDepartment("dept-123", {
        name: "Updated"
      });
      expect(result.name).toBe("Updated");
      expect(result.manager_name).toBeNull();
    });

    it("should throw 400 when updating to INACTIVE manager", async () => {
      const existing = mockDept();
      const selectChain = mockJoinSelectChain([
        {
          id: existing.id,
          name: existing.name,
          manager_id: existing.manager_id,
          manager_name: null,
          created_at: existing.created_at,
          updated_at: existing.updated_at
        }
      ]);
      mockDb.select.mockReturnValueOnce(selectChain as never);

      // transaction flow
      const tx = makeTx();
      tx.select.mockReturnValueOnce(txSelectChain([existing]));
      // inside tx: select manager (returns INACTIVE)
      tx.select.mockReturnValueOnce(
        txSelectChain([
          {
            id: "emp-1",
            status: "INACTIVE",
            department_id: "dept-123"
          }
        ])
      );
      mockDb.transaction.mockImplementation(async cb => cb(tx as never));

      await expect(
        departmentService.updateDepartment("dept-123", {
          manager_id: "emp-1"
        })
      ).rejects.toThrow("Manager harus berstatus ACTIVE");
    });
  });

  describe("deleteDepartment", () => {
    it("should delete department if no employees", async () => {
      const dept = mockDept();

      // First select: getDepartmentById (join)
      const empChain = mockJoinSelectChain([
        {
          id: dept.id,
          name: dept.name,
          manager_id: dept.manager_id,
          manager_name: null,
          created_at: dept.created_at,
          updated_at: dept.updated_at
        }
      ]);
      mockDb.select.mockReturnValueOnce(empChain as never);

      // Second select: employee count
      const countChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }])
        })
      };
      mockDb.select.mockReturnValueOnce(countChain as never);

      const deleteChain = {
        where: vi.fn().mockResolvedValue(undefined)
      };
      mockDb.delete.mockReturnValue(deleteChain as never);

      await departmentService.deleteDepartment("dept-123");
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it("should throw error if department has employees", async () => {
      const dept = mockDept();

      // First select: getDepartmentById (join)
      const empChain = mockJoinSelectChain([
        {
          id: dept.id,
          name: dept.name,
          manager_id: dept.manager_id,
          manager_name: null,
          created_at: dept.created_at,
          updated_at: dept.updated_at
        }
      ]);
      mockDb.select.mockReturnValueOnce(empChain as never);

      // Second select: employee count
      const countChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }])
        })
      };
      mockDb.select.mockReturnValueOnce(countChain as never);

      await expect(
        departmentService.deleteDepartment("dept-123")
      ).rejects.toThrow(
        "Tidak dapat menghapus department yang memiliki karyawan"
      );
    });
  });
});
