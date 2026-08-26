import dotenv from "dotenv-flow";
// Tanpa NODE_ENV eksplisit (mis. tooling CLI), fallback ke development
// sehingga .env.development selalu terbaca.
dotenv.config({ default_node_env: "development" });
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Opsional: Vercel Functions tidak menyediakan PORT; default untuk dev lokal.
  PORT: z.coerce.number().int().positive().default(9000),

  DATABASE_URL: z.url(),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  CORS_ORIGIN: z.string({
    message: "CORS_ORIGIN wajib diisi (origin spesifik, bukan *)"
  }),

  JWT_SECRET: z
    .string({ message: "JWT_SECRET wajib diisi" })
    .min(16, "JWT_SECRET minimal 16 karakter"),

  REFRESH_SECRET: z
    .string({ message: "REFRESH_SECRET wajib diisi" })
    .min(16, "REFRESH_SECRET minimal 16 karakter"),

  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(20).default(10),

  ENABLE_DOCS: z
    .enum(["true", "false"])
    .default("true")
    .transform(value => value === "true")
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // Throw (bukan process.exit) agar platform serverless melaporkan
  // penyebab kegagalan cold start dengan jelas.
  throw new Error(
    `Konfigurasi environment tidak valid:\n${z.prettifyError(result.error)}`
  );
}

export const env: Readonly<Env> = Object.freeze(result.data);

export default env;
