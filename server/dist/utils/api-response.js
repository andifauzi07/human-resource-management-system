import { STATUS_CODES } from "../constants/status-codes.js";
export class ApiResponse {
    success;
    message;
    statusCode;
    data;
    errors;
    constructor({ success, message, statusCode, data, errors }) {
        this.success = success;
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
        this.errors = errors;
    }
    send(res) {
        return res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            statusCode: this.statusCode,
            ...(this.data !== undefined && { data: this.data }),
            ...(this.errors !== undefined && { errors: this.errors })
        });
    }
    static Success(res, message, data, statusCode = STATUS_CODES.OK) {
        return new ApiResponse({
            success: true,
            message,
            data,
            statusCode
        }).send(res);
    }
    static ok(res, message = "OK", data) {
        return ApiResponse.Success(res, message, data, STATUS_CODES.OK);
    }
    static created(res, message = "Created", data) {
        return ApiResponse.Success(res, message, data, STATUS_CODES.CREATED);
    }
}
/*
 * Usage:
 * ApiResponse.ok(res, "OK", data);
 * ApiResponse.created(res, "Created", data);
 */
//# sourceMappingURL=api-response.js.map