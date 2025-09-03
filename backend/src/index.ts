import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { requestIdMiddleware, requestLogger, suspiciousActivityDetection, secureHeaders } from './middleware/securityMonitoring';
import { performanceMonitor, setupMemoryMonitoring } from './middleware/performanceMonitoring';
import { createRateLimiter } from './middleware/rateLimiting';
import { sanitizeInput, contentSecurityPolicy } from './middleware/validation';
import { SECURITY_CONFIG } from './config/security';
import { realTimeProgressService } from './services/realTimeProgressService';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import childProfileRoutes from './routes/childProfile';
import childRoutes from './routes/child';
import profileRoutes from './routes/profile';
import settingsRoutes from './routes/settings';
import claudeRoutes from './routes/claude';
import analyticsRoutes from './routes/analytics';
import planAdaptationRoutes from './routes/planAdaptation';
import privacyRoutes from './routes/privacy';
import contentSafetyRoutes from './routes/contentSafety';
import contentRoutes from './routes/content';
import geminiRoutes from './routes/gemini';
import studyPlansRoutes from './routes/studyPlans';
import curriculumRoutes from './routes/curriculum';
import educationalContentRoutes from './routes/educationalContent';
import youtubeResourceRoutes from './routes/youtubeResources';
import readingMaterialRoutes from './routes/readingMaterials';
import resourceValidationRoutes from './routes/resourceValidation';
import masterDataRoutes from './routes/masterData';
import masterDataSimpleRoutes from './routes/masterDataSimple';
import masterDataMonitoringRoutes from './routes/masterDataMonitoring';
import childErrorRoutes from './routes/childErrors';
import childHelpAnalyticsRoutes from './routes/childHelpAnalytics';
import realTimeProgressRoutes from './routes/realTimeProgress';
import parentalMonitoringRoutes from './routes/parentalMonitoring';
import userTestingRoutes from './routes/userTesting';
import testChildAuthRoutes from './routes/testChildAuth';
import childSessionMonitoringRoutes from './routes/childSessionMonitoring';
import { scheduledNotificationService } from './services/scheduledNotificationService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security and monitoring middleware
app.use(requestIdMiddleware);
app.use(secureHeaders);

// Enhanced helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: SECURITY_CONFIG.CSP.DEFAULT_SRC,
      scriptSrc: SECURITY_CONFIG.CSP.SCRIPT_SRC,
      styleSrc: SECURITY_CONFIG.CSP.STYLE_SRC,
      fontSrc: SECURITY_CONFIG.CSP.FONT_SRC,
      imgSrc: SECURITY_CONFIG.CSP.IMG_SRC,
      mediaSrc: SECURITY_CONFIG.CSP.MEDIA_SRC,
      connectSrc: SECURITY_CONFIG.CSP.CONNECT_SRC,
      frameSrc: SECURITY_CONFIG.CSP.FRAME_SRC,
      objectSrc: SECURITY_CONFIG.CSP.OBJECT_SRC,
      baseUri: SECURITY_CONFIG.CSP.BASE_URI,
      formAction: SECURITY_CONFIG.CSP.FORM_ACTION,
      frameAncestors: SECURITY_CONFIG.CSP.FRAME_ANCESTORS,
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: SECURITY_CONFIG.HEADERS.HSTS_MAX_AGE,
    includeSubDomains: SECURITY_CONFIG.HEADERS.HSTS_INCLUDE_SUBDOMAINS,
    preload: SECURITY_CONFIG.HEADERS.HSTS_PRELOAD
  }
}));

// CORS configuration with security considerations
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    console.log('CORS check - Origin:', origin, 'Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Global rate limiting
app.use(createRateLimiter('general'));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static file serving for uploads with security headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
}, express.static(process.env.UPLOAD_DIR || 'uploads'));

// Security monitoring
app.use(requestLogger);
app.use(suspiciousActivityDetection);

// Performance monitoring
app.use(performanceMonitor);

// Input validation and sanitization
app.use(sanitizeInput);
app.use(contentSecurityPolicy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Study Planner Backend is running' });
});

// API routes with specific rate limiting
// Temporarily disable auth rate limiting for development
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth', createRateLimiter('auth'), authRoutes);
} else {
  app.use('/api/auth', authRoutes);
}
app.use('/api/oauth', createRateLimiter('oauth'), oauthRoutes);
app.use('/api/child-profiles', childProfileRoutes);
app.use('/api/child', childRoutes);
app.use('/api/profile', createRateLimiter('upload'), profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/study-plans', studyPlansRoutes);
app.use('/api/claude', createRateLimiter('ai'), claudeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/plan-adaptation', planAdaptationRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/content-safety', contentSafetyRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/gemini', createRateLimiter('ai'), geminiRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/educational-content', educationalContentRoutes);
app.use('/api/youtube-resources', youtubeResourceRoutes);
app.use('/api/reading-materials', readingMaterialRoutes);
app.use('/api/resource-validation', resourceValidationRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/master-data-simple', masterDataSimpleRoutes);
app.use('/api/monitoring', masterDataMonitoringRoutes);
app.use('/api/child/errors', childErrorRoutes);
app.use('/api/child', childHelpAnalyticsRoutes);
app.use('/api/real-time-progress', realTimeProgressRoutes);
app.use('/api/parental-monitoring', parentalMonitoringRoutes);
app.use('/api/user-testing', userTestingRoutes);
app.use('/api/child-session-monitoring', childSessionMonitoringRoutes);
app.use('/api/test', testChildAuthRoutes);

// Initialize real-time progress service
realTimeProgressService.initialize(server);

// Start server
server.listen(PORT, () => {
  logger.info({
    type: 'server_start',
    message: `Server running on port ${PORT}`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
  
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Real-time progress sync enabled`);
  
  // Start scheduled notification service
  scheduledNotificationService.start();
  console.log(`📧 Scheduled notifications enabled`);
  
  // Start memory monitoring (every 5 minutes)
  const memoryMonitorInterval = setupMemoryMonitoring(300000);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    clearInterval(memoryMonitorInterval);
    scheduledNotificationService.stop();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
});

export default app;