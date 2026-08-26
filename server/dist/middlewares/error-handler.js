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