/* global process */
/* eslint-disable no-unused-vars */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEnvironment } from './config/envValidation.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Validate Environment Variables on App Boot
validateEnvironment();

const app = express();

// Trust proxy for rate limiting behind reverse proxies (Render / NGINX)
// Enforce HTTPS in production (Redirect HTTP to HTTPS)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 1. Enhanced Helmet Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Managed dynamically in client / NGINX
  referrerPolicy: { policy: "no-referrer-when-downgrade" },
  frameguard: { action: "deny" }
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  FRONTEND_URL,
].filter(Boolean);

// 2. Hardened CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked by CORS: Origin ${origin} is not in allowed origins.`);
    return callback(new Error(`CORS policy violation: Origin ${origin} unauthorized`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 204
}));

// 3. Rate Limiters (Phase 1 Security Requirement)
// Auth routes tight rate limiting (protect login/register/forgot-password against brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 requests per IP limit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many API requests from this IP, please slow down.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 4. Body parsers (50MB limit to support base64 proof uploads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve local media uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 5. Health Check & System Status Routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// New basic health endpoint under /api
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health/deep', (req, res) => {
  const memory = process.memoryUsage();
  res.status(200).json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rssMB: Math.round(memory.rss / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024)
    },
    databaseStatus: 'connected'
  });
});

app.get('/', (req, res) => {
  res.send('RajCivic Connect Production API Server is running');
});

import auditRoutes from './routes/auditRoutes.js';

// Correlation Request ID Middleware (Phase 6 Observability)
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || `REQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// 6. Register API Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit-logs', auditRoutes);

// Versioned API v1 Aliases (Phase 6 API Versioning)
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/auth', authRoutes);

// 7. Global Error Handler (Sanitized for Production Safety)
app.use((err, req, res, next) => {
  console.error("Unhandled Server Exception:", err.stack || err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message
  });
});

// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RajCivic Connect Server active on port ${PORT}`);
    console.log(`🔒 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  });
}

export default app;
