import { ZodError } from "zod";
import env from "../configs/env.js";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../utils/logger.js";
export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    let statusCode = 500;
    let message = "Internal server error";
    let errors;
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }
    else if (err instanceof ZodError) {
        statusCode = 400;
        message = err.issues[0]?.message ?? "Input tidak valid";
        const fieldErrors = {};
        for (const issue of err.issues) {
            const key = String(issue.path[0] ?? "unknown");
            fieldErrors[key] ??= issue.message;
        }
        errors = fieldErrors;
    }
    logger.error(err, `Error: ${message} | Status: ${statusCode} | Path: ${req.method} ${req.originalUrl}`);
    const response = {
        success: false,
        message,
        statusCode,
        ...(errors !== undefined && { errors }),
        ...(env.NODE_ENV === "development" && { stack: err.stack })
    };
    res.status(statusCode).json(response);
};
//# sourceMappingURL=error-handler.js.map