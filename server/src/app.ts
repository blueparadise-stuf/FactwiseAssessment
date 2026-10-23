import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import apiRouter from './routes/apiRouter.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = () => {
  const app = express();

  // Security headers (compatible across TypeScript versions and module loaders)
  const helmetFn: any = (helmet as any)?.default || helmet;
  app.use(
    helmetFn({
      contentSecurityPolicy: false, // Allows flexible client hosting if served from same origin
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  const allowedOrigins = [
    ENV.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
        if (!origin || allowedOrigins.includes(origin) || ENV.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in assessment mode or origin check
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(ENV.COOKIE_SECRET));

  // Logging in dev
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate limiting on sensitive auth endpoints
  const rateLimitFn: any = (rateLimit as any)?.default || rateLimit;
  const authLimiter = rateLimitFn({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/v1/auth/login', authLimiter);

  // Auto-connect to database in serverless environment (e.g., Vercel)
  app.use(async (_req, _res, next) => {
    if (mongoose.connection.readyState === 0) {
      try {
        await connectDB();
      } catch (err) {
        console.error('Serverless database auto-connect error:', err);
      }
    }
    next();
  });

  // Health check endpoint for deployment monitoring
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: ENV.NODE_ENV,
    });
  });

  // Mount versioned REST API
  app.use('/api/v1', apiRouter);

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

// Instantiate app and export as default for Vercel / serverless runtime
export const app = createApp();
(app as any).default = app;
export default app;
