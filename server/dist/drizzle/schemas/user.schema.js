import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
export const userRoleEnum = pgEnum("user_role", ["STAFF", "HRD"]);
export const usersTable = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar({ length: 255 }).notNull().unique(),
    password_hash: varchar({ length: 255 }).notNull(),
    role: userRoleEnum().notNull().default("STAFF"),
    created_at: timestamp("created_at").defaultNow().notNull()
});
//# sourceMappingURL=user.schema.js.map