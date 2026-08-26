import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/auth.js";
export function authGuard(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return next(ApiError.unauthorized("Token akses tidak ditemukan"));
    }
    const token = header.slice("Bearer ".length).trim();
    try {
        const payload = verifyAccessToken(token);
        req.user = { sub: payload.sub, role: payload.role };
        return next();
    }
    catch {
        return next(ApiError.unauthorized("Token akses tidak valid atau kedaluwarsa"));
    }
}
export function rbacGuard(allowed) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized("Tidak terautentikasi"));
        }
        if (!allowed.includes(req.user.role)) {
            return next(ApiError.forbidden("Role tidak diizinkan"));
        }
        return next();
    };
}
//# sourceMappingURL=auth.middleware.js.map