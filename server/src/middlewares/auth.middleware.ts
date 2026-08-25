import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";
import { verifyAccessToken, type UserRole } from "../utils/auth";

export function authGuard(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Token akses tidak ditemukan"));
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { sub: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(
      ApiError.unauthorized("Token akses tidak valid atau kedaluwarsa")
    );
  }
}

export function rbacGuard(allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Tidak terautentikasi"));
    }
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden("Role tidak diizinkan"));
    }
    return next();
  };
}
