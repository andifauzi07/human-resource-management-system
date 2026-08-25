import type { UserRole } from "../utils/auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role: UserRole;
      };
    }
  }
}

export {};
