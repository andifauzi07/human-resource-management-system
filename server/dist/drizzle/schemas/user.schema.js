import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { employeesTable } from "./employee.schema.js";
export const userRoleEnum = pgEnum("user_role", ["STAFF", "HRD"]);
export const usersTable = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    employee_id: uuid("employee_id").references(() => employeesTable.id),
    email: varchar({ length: 255 }).notNull().unique(),
    password_hash: varchar({ length: 255 }).notNull(),
    role: userRoleEnum().notNull().default("STAFF"),
    created_at: timestamp("created_at").defaultNow().notNull()
});
//# sourceMappingURL=user.schema.js.map