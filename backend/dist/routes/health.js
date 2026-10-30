"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'WayDine API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
    });
});
//# sourceMappingURL=health.js.map