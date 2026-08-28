import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
export const departmentsTable = pgTable("departments", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar({ length: 100 }).notNull().unique(),
    manager_id: uuid("manager_id"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull()
});
//# sourceMappingURL=department.schema.js.map