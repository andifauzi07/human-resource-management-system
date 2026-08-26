import { NextFunction, Request, Response } from "express";
import env from "../configs/env";
import { ApiError } from "../utils/api-error";

const allowedOrigins = env.CORS_ORIGIN.split(",").map(origin => origin.trim());

/**
 * Mitigasi CSRF untuk endpoint konsumen cookie refresh (SameSite=None).
 * Browser selalu mengirim header Origin pada request lintas-situs — jika ada
 * dan tidak termasuk allowlist CORS_ORIGIN, tolak. Request non-browser
 * (curl/skrip) tanpa header Origin diteruskan.
 */
export function originGuard(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    return next();
  }

  return next(ApiError.forbidden("Origin tidak diizinkan"));
}
