import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../configs/env.js";
export async function hashPassword(plain) {
    return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}
export async function verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}
export function signAccessToken(userId, role) {
    const options = {
        expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN
    };
    return jwt.sign({ sub: userId, role }, env.JWT_SECRET, options);
}
export function signRefreshToken(userId) {
    const options = {
        expiresIn: env.JWT_REFRESH_TOKEN_EXPIRES_IN
    };
    return jwt.sign({ sub: userId }, env.REFRESH_SECRET, options);
}
export function verifyAccessToken(token) {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return { sub: String(decoded.sub), role: decoded.role };
}
export function verifyRefreshToken(token) {
    const decoded = jwt.verify(token, env.REFRESH_SECRET);
    return { sub: String(decoded.sub) };
}
//# sourceMappingURL=auth.js.map