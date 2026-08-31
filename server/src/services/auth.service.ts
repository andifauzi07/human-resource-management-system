import { eq } from "drizzle-orm";
import db from "../configs/db";
import { usersTable, type User } from "../drizzle/schemas/user.schema";
import { ApiError } from "../utils/api-error";
import { STATUS_CODES } from "../constants/status-codes";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken
} from "../utils/auth";
import type { UserRole } from "../utils/auth";

export type PublicUser = Omit<User, "password_hash">;

function toPublicUser(user: User): PublicUser {
  const { password_hash, ...rest } = user;
  return rest;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      throw ApiError.conflict("Email sudah terdaftar");
    }

    const password_hash = await hashPassword(input.password);
    const [created] = await db
      .insert(usersTable)
      .values({
        email: input.email,
        password_hash,
        role: "STAFF"
      })
      .returning();

    return toPublicUser(created);
  },

  async login(input: LoginInput): Promise<{
    user: PublicUser;
    tokens: TokenPair;
  }> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);

    if (!user) {
      throw ApiError.unauthorized("Email atau password salah");
    }

    const valid = await verifyPassword(input.password, user.password_hash);
    if (!valid) {
      throw ApiError.unauthorized("Email atau password salah");
    }

    const tokens = issueTokens(user.id, user.role);
    return { user: toPublicUser(user), tokens };
  },

  async refresh(refreshToken: string): Promise<{
    user: PublicUser;
    tokens: TokenPair;
  }> {
    const { sub } = verifyRefreshToken(refreshToken);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, sub))
      .limit(1);

    if (!user) {
      throw ApiError.unauthorized("User tidak ditemukan");
    }

    const tokens = issueTokens(user.id, user.role);
    return { user: toPublicUser(user), tokens };
  },

  async me(userId: string): Promise<PublicUser> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      throw ApiError.notFound("User tidak ditemukan");
    }

    return toPublicUser(user);
  },

  logout(): void {
    // Stateless: tidak ada denylist. Cookie refresh dihapus di controller.
  }
};

function issueTokens(userId: string, role: UserRole): TokenPair {
  return {
    accessToken: signAccessToken(userId, role),
    refreshToken: signRefreshToken(userId)
  };
}

export default authService;
