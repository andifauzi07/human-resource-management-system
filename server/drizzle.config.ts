import dotenv from "dotenv-flow";
// Fallback development agar .env.development terbaca meski NODE_ENV kosong.
dotenv.config({ default_node_env: "development" });
import { Config, defineConfig } from "drizzle-kit";

// Tooling CLI (migrate/generate/studio) hanya menuntut DATABASE_URL —
// sengaja TIDAK memvalidasi secret runtime (JWT, dsb.) agar tooling tetap
// bisa dijalankan tanpa variabel yang tidak relevan.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL wajib diisi untuk menjalankan drizzle-kit " +
      "(development lokal dibaca dari server/.env.development)."
  );
}

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/index.ts",
  dialect: "postgresql",
  schemaFilter: ["public", "neon_auth"],
  dbCredentials: {
    url: databaseUrl
  },
  verbose: true,
  strict: true
}) satisfies Config;
