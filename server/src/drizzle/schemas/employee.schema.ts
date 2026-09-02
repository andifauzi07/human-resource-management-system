import {
  date,
  decimal,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { departmentsTable } from "./department.schema";

export const employeeStatusEnum = pgEnum("employee_status", [
  "ACTIVE",
  "INACTIVE"
]);

export const employeesTable = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  department_id: uuid("department_id")
    .notNull()
    .references(() => departmentsTable.id),
  full_name: varchar({ length: 150 }).notNull(),
  position: varchar({ length: 100 }).notNull(),
  base_salary: decimal("base_salary", { precision: 12, scale: 2 }).notNull(),
  join_date: date("join_date").notNull(),
  nik: varchar({ length: 20 }).unique(),
  address: varchar({ length: 255 }),
  bank_account_number: varchar({ length: 50 }),
  bank_account_name: varchar({ length: 150 }),
  phone: varchar({ length: 20 }),
  status: employeeStatusEnum().notNull().default("ACTIVE"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export type Employee = typeof employeesTable.$inferSelect;
export type NewEmployee = typeof employeesTable.$inferInsert;
