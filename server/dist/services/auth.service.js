import { eq } from "drizzle-orm";
import db from "../configs/db.js";
import { usersTable } from "../drizzle/schemas/user.schema.js";
import { ApiError } from "../utils/api-error.js";
import { hashPassword, signAccessToken, signRefreshToken, verifyPassword, verifyRefreshToken } from "../utils/auth.js";
function toPublicUser(user) {
    const { password_hash, ...rest } = user;
    return rest;
}
export const authService = {
    async register(input) {
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
            // Registrasi publik selalu STAFF; penetapan HRD hanya via seed/admin.
            role: "STAFF"
        })
            .returning();
        return toPublicUser(created);
    },
    async login(input) {
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
    async refresh(refreshToken) {
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
    async me(userId) {
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
    logout() {
        // Stateless: tidak ada denylist. Cookie refresh dihapus di controller.
    }
};
function issueTokens(userId, role) {
    return {
        accessToken: signAccessToken(userId, role),
        refreshToken: signRefreshToken(userId)
    };
}
export default authService;
//# sourceMappingURL=auth.service.js.map