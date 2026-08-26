import { Request, Response } from "express";
import { z } from "zod";
import authService from "../services/auth.service";
import { ApiResponse } from "../utils/api-response";
import { AsyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import env from "../configs/env";

export const REFRESH_COOKIE_NAME = "refreshToken";

// Registrasi publik TIDAK menerima field role — user baru selalu STAFF;
// penetapan HRD hanya lewat seed/admin (mencegah eskalasi privilese).
const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter")
});

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi")
});

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    // FE (hrd-management-system.vercel.app) dan BE (hriss-api.vercel.app)
    // lintas-situs (*.vercel.app di Public Suffix List) → wajib None+Secure
    // agar cookie terkirim; mitigasi CSRF lewat originGuard di route.
    secure: true,
    sameSite: "none",
    maxAge: parseExpiryToMs(env.JWT_REFRESH_TOKEN_EXPIRES_IN)
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
}

function parseExpiryToMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMult: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
  };
  const mult = unitMult[unit] ?? 86400000;
  return amount * mult;
}

export const register = AsyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const user = await authService.register(body);
  return ApiResponse.created(res, "User berhasil dibuat", user);
});

export const login = AsyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const { user, tokens } = await authService.login(body);
  setRefreshCookie(res, tokens.refreshToken);
  return ApiResponse.ok(res, "Login berhasil", {
    user,
    accessToken: tokens.accessToken
  });
});

export const refresh = AsyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw ApiError.unauthorized("Refresh token tidak ditemukan");
  }
  const { user, tokens } = await authService.refresh(token);
  setRefreshCookie(res, tokens.refreshToken);
  return ApiResponse.ok(res, "Token di-refresh", {
    user,
    accessToken: tokens.accessToken
  });
});

export const me = AsyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & { user?: { sub: string } }).user?.sub;
  if (!userId) {
    throw ApiError.unauthorized("Tidak terautentikasi");
  }
  const user = await authService.me(userId);
  return ApiResponse.ok(res, "Profil user", user);
});

export const logout = AsyncHandler(async (_req: Request, res: Response) => {
  authService.logout();
  clearRefreshCookie(res);
  return ApiResponse.ok(res, "Logout berhasil");
});

export const hrdArea = AsyncHandler(async (req: Request, res: Response) => {
  return ApiResponse.ok(res, "Akses area HRD berhasil", {
    user: req.user
  });
});
