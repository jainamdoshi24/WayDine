"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const health_js_1 = require("./routes/health.js");
const restaurants_js_1 = require("./routes/restaurants.js");
const routes_js_1 = require("./routes/routes.js");
const recommendations_js_1 = require("./routes/recommendations.js");
const demo_js_1 = require("./routes/demo.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security & middleware
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting — generous limits for hackathon demo
const routeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.', code: 'RATE_LIMITED' },
});
const recommendationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.', code: 'RATE_LIMITED' },
});
// Routes
app.use('/api/health', health_js_1.healthRouter);
app.use('/api/restaurants', restaurants_js_1.restaurantsRouter);
app.use('/api/routes', routeLimiter, routes_js_1.routesRouter);
app.use('/api/recommendations', recommendationLimiter, recommendations_js_1.recommendationsRouter);
app.use('/api/demo', demo_js_1.demoRouter);
// Error handler
app.use(errorHandler_js_1.errorHandler);
app.listen(PORT, () => {
    console.log(`\n🍽️  WayDine API running at http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
exports.default = app;
//# sourceMappingURL=index.js.map