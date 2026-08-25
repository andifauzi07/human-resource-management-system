import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import env from "../configs/env";

export type UserRole = "STAFF" | "HRD";

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(userId: string, role: UserRole): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, options);
}

export function signRefreshToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign({ sub: userId }, env.REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return { sub: String(decoded.sub), role: decoded.role as UserRole };
}

export function verifyRefreshToken(token: string): { sub: string } {
  const decoded = jwt.verify(token, env.REFRESH_SECRET) as jwt.JwtPayload;
  return { sub: String(decoded.sub) };
}
