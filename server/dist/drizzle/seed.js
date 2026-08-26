import { eq } from "drizzle-orm";
import db from "../configs/db.js";
import { usersTable } from "../drizzle/schemas/user.schema.js";
import { hashPassword } from "../utils/auth.js";
import { logger } from "../utils/logger.js";
const DEMO_USERS = [
    {
        email: "staff@demo.hris",
        password: "password123",
        role: "STAFF"
    },
    {
        email: "hrd@demo.hris",
        password: "password123",
        role: "HRD"
    }
];
async function seed() {
    for (const demo of DEMO_USERS) {
        const [existing] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, demo.email))
            .limit(1);
        if (existing) {
            logger.info(`User ${demo.email} sudah ada, lewati.`);
            continue;
        }
        const password_hash = await hashPassword(demo.password);
        await db.insert(usersTable).values({
            email: demo.email,
            password_hash,
            role: demo.role
        });
        logger.info(`User demo ${demo.email} (${demo.role}) dibuat.`);
    }
    logger.info("Seed selesai.");
}
seed()
    .then(() => process.exit(0))
    .catch(err => {
    logger.error(err, "Gagal seed user demo");
    process.exit(1);
});
//# sourceMappingURL=seed.js.map