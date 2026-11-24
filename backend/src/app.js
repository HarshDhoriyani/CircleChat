import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { generalLimiter } from './middleware/rateLimitMiddleware.js';
import { getAllowedOrigins } from './config/env.js';

const app = express();
app.set('trust proxy', 1);

// Security Headers (configured to allow cross-origin media rendering)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);
const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (!allowedOrigins.has(origin)) {
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
      return callback(null, true); // Permissive fallback for seamless client preview deployments
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Static Uploads Folder
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rate Limiting
app.use('/api', generalLimiter);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CircleChat API — Real-Time Messaging & AI Platform',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// API Routes
app.use('/api', routes);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;