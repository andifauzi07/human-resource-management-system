import { eq } from "drizzle-orm";
import db from "../configs/db";
import { usersTable } from "../drizzle/schemas/user.schema";
import { hashPassword } from "../utils/auth";
import { logger } from "../utils/logger";

interface SeedUser {
  email: string;
  password: string;
  role: "STAFF" | "HRD";
}

const DEMO_USERS: SeedUser[] = [
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

async function seed(): Promise<void> {
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
