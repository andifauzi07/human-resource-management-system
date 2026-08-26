import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import env from "./env";

// Pool kecil: tiap instance serverless membuka pool sendiri; default pg (10)
// dikali banyak instance cold-start dapat menghabiskan kuota koneksi Neon.
const pool = new Pool({
  connectionString: env.DATABASE_URL!,
  max: 3
});

const db = drizzle(pool, {
  logger: env.NODE_ENV === "development"
});

export default db;
