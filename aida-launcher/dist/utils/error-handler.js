"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LauncherError = void 0;
exports.getErrorMessage = getErrorMessage;
class LauncherError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR') {
        super(message);
        this.code = code;
        this.name = 'LauncherError';
    }
}
exports.LauncherError = LauncherError;
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
