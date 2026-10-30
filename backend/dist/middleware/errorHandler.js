"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error('API Error:', err.message);
    // PostgreSQL unique violation
    if ('code' in err && err.code === '23505') {
        res.status(409).json({
            error: 'Duplicate resource',
            code: 'CONFLICT',
        });
        return;
    }
    // PostgreSQL invalid input
    if ('code' in err && err.code === '22P02') {
        res.status(400).json({
            error: 'Invalid input format',
            code: 'INVALID_INPUT',
        });
        return;
    }
    res.status(500).json({
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
    });
}
//# sourceMappingURL=errorHandler.js.map