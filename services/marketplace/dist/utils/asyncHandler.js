"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
/** Wrap async route handlers to catch errors and pass to Express error handling. */
function asyncHandler(fn) {
    return (req, res, next) => {
        void Promise.resolve(fn(req, res, next)).catch(next);
    };
}
