import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { healthRouter } from './routes/health.js';
import { restaurantsRouter } from './routes/restaurants.js';
import { routesRouter } from './routes/routes.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { demoRouter } from './routes/demo.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security & middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — generous limits for hackathon demo
const routeLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.', code: 'RATE_LIMITED' },
});

const recommendationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.', code: 'RATE_LIMITED' },
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/routes', routeLimiter, routesRouter);
app.use('/api/recommendations', recommendationLimiter, recommendationsRouter);
app.use('/api/demo', demoRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🍽️  WayDine API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
