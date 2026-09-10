/**
 * Express Application Setup
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import passport from 'passport';

import { 
  connectDB, 
  validateConfig,
  APP_CONFIG 
} from './config/index.js';

import { configurePassport } from './config/passport.js';

import { 
  apiLimiter, 
  authLimiter, 
  domainCheckLimiter 
} from './middleware/rateLimiter.js';

import { 
  errorHandler, 
  notFoundHandler 
} from './middleware/errorHandler.js';

import { sanitizeInput } from './middleware/validation.js';

// Route imports
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import domainRoutes from './routes/domains.js';
import dnsRoutes from './routes/dns.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import contactRoutes from './routes/contacts.js';

/**
 * Create and configure Express app
 */
export async function createApp() {
  // Validate configuration
  validateConfig();
  
  // Connect to database
  await connectDB();
  
  // Configure Passport
  configurePassport();
  
  const app = express();
  
  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);
  
  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));
  
  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
  app.use(cors(corsOptions));
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Cookie parser
  app.use(cookieParser());
  
  // Compression
  app.use(compression());
  
  // Request logging
  if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
    app.use(morgan('combined'));
  }
  
  // Input sanitization
  app.use(sanitizeInput);
  
  // Session configuration
  const sessionConfig = {
    name: process.env.SESSION_COOKIE_NAME || 'dr_session',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60, // 7 days
      autoRemove: 'native',
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.SESSION_COOKIE_SECURE === 'true',
      sameSite: process.env.SESSION_COOKIE_SAME_SITE || 'lax',
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };
  
  app.use(session(sessionConfig));
  
  // Initialize Passport (must be after session)
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Health check endpoint (before rate limiting)
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: APP_CONFIG.version,
    });
  });
  
  // API version prefix
  const apiPrefix = APP_CONFIG.apiPrefix;
  
  // Apply general rate limiter
  app.use(`${apiPrefix}/`, apiLimiter);
  
  // Routes with specific rate limiters
  app.use(`${apiPrefix}/auth`, authLimiter, authRoutes);
  app.use(`${apiPrefix}/auth/oauth`, oauthRoutes);
  app.use(`${apiPrefix}/domains`, domainCheckLimiter, domainRoutes);
  app.use(`${apiPrefix}/dns`, dnsRoutes);
  app.use(`${apiPrefix}/cart`, cartRoutes);
  app.use(`${apiPrefix}/orders`, orderRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/contacts`, contactRoutes);
  
  // 404 handler
  app.use(notFoundHandler);
  
  // Global error handler
  app.use(errorHandler);
  
  return app;
}

export default createApp;
