import dotenv from "dotenv-flow";
dotenv.config();
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.string().regex(/^\d+$/, "PORT must be a number").transform(Number),

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

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(20).default(10)
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment configuration");
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env: Readonly<Env> = Object.freeze(result.data);

export default env;
