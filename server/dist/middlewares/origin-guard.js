import env from "../configs/env.js";
import { ApiError } from "../utils/api-error.js";
const allowedOrigins = env.CORS_ORIGIN.split(",").map(origin => origin.trim());
export function originGuard(req, _res, next) {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
        return next();
    }
    return next(ApiError.forbidden("Origin tidak diizinkan"));
}
//# sourceMappingURL=origin-guard.js.map