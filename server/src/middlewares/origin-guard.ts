import { NextFunction, Request, Response } from "express";
import env from "../configs/env";
import { ApiError } from "../utils/api-error";

const allowedOrigins = env.CORS_ORIGIN.split(",").map(origin => origin.trim());

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
