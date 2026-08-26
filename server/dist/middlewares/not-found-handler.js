import { ApiError } from "../utils/api-error.js";
export const notFoundHandler = (req, res, next) => {
    throw ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`);
};
//# sourceMappingURL=not-found-handler.js.map