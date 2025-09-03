# Child Progress Module Environment Configuration

## Overview

This document outlines the environment configuration requirements for deploying the Child Progress Module. The configuration includes database settings, Redis cache configuration, security settings, and feature flags specific to child progress tracking.

## Environment Variables

### Core Application Settings

```bash
# Application Environment
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ai_study_planner"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ai_study_planner

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_minimum_32_characters
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# Child-specific JWT settings
CHILD_JWT_EXPIRES_IN=20m
CHILD_SESSION_TIMEOUT=1200000
CHILD_MAX_FAILED_LOGINS=3
CHILD_LOCKOUT_DURATION=900000
```

### Child Progress Module Specific Settings

```bash
# Badge System Configuration
BADGE_PROCESSING_ENABLED=true
BADGE_PROCESSING_INTERVAL=60000
BADGE_CACHE_TTL=300
BADGE_CELEBRATION_ENABLED=true
BADGE_SOUND_ENABLED=true

# Progress Tracking Settings
PROGRESS_SYNC_ENABLED=true
PROGRESS_SYNC_INTERVAL=30000
PROGRESS_BATCH_SIZE=100
PROGRESS_RETENTION_DAYS=365

# Learning Streak Configuration
STREAK_CALCULATION_ENABLED=true
STREAK_TIMEZONE=America/New_York
STREAK_GRACE_PERIOD_HOURS=6
STREAK_MAX_TYPES=5

# Child Authentication Settings
CHILD_AUTH_ENABLED=true
CHILD_PIN_MIN_LENGTH=4
CHILD_PIN_MAX_LENGTH=6
CHILD_DEVICE_TRACKING=true
CHILD_IP_LOGGING=true

# Parental Monitoring Settings
PARENTAL_NOTIFICATIONS_ENABLED=true
PARENTAL_EMAIL_NOTIFICATIONS=true
PARENTAL_SMS_NOTIFICATIONS=false
SECURITY_ALERT_THRESHOLD=3
SUSPICIOUS_ACTIVITY_DETECTION=true

# Real-time Features
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3002
REAL_TIME_PROGRESS_ENABLED=true
REAL_TIME_BADGE_NOTIFICATIONS=true

# Performance Settings
CHILD_PROGRESS_CACHE_ENABLED=true
CHILD_PROGRESS_CACHE_TTL=300
BADGE_ELIGIBILITY_CACHE_TTL=180
ANALYTICS_CACHE_TTL=600
```

### External Service Configuration

```bash
# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@ai-study-planner.com
PARENT_NOTIFICATION_EMAIL_TEMPLATE=d-1234567890abcdef

# AI Services
CLAUDE_API_KEY=your_claude_api_key
CLAUDE_MODEL=claude-3-sonnet-20240229
GEMINI_API_KEY=your_gemini_api_key

# File Upload Configuration
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif
AVATAR_UPLOAD_PATH=/uploads/avatars

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/app/logs
LOG_ROTATION_ENABLED=true
LOG_MAX_SIZE=10m
LOG_MAX_FILES=14

# Security Settings
HELMET_ENABLED=true
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
RATE_LIMITING_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Child-specific Rate Limiting
CHILD_RATE_LIMIT_ENABLED=true
CHILD_AUTH_RATE_LIMIT=5
CHILD_PROGRESS_RATE_LIMIT=60
CHILD_DASHBOARD_RATE_LIMIT=30
CHILD_BADGE_RATE_LIMIT=20
```

### Feature Flags

```bash
# Child Progress Module Features
FEATURE_CHILD_PROGRESS_MODULE=true
FEATURE_ENHANCED_CHILD_AUTH=true
FEATURE_BADGE_SYSTEM=true
FEATURE_LEARNING_STREAKS=true
FEATURE_REAL_TIME_PROGRESS=true
FEATURE_CHILD_ANALYTICS=true
FEATURE_PARENTAL_MONITORING=true
FEATURE_CHILD_ERROR_HANDLING=true
FEATURE_CHILD_HELP_SYSTEM=true
FEATURE_MOBILE_OPTIMIZATIONS=true

# Badge System Features
FEATURE_BADGE_CELEBRATIONS=true
FEATURE_BADGE_PROGRESS_TRACKING=true
FEATURE_CUSTOM_BADGES=false
FEATURE_BADGE_ANALYTICS=true
FEATURE_BADGE_RECOMMENDATIONS=true

# Analytics Features
FEATURE_CHILD_DASHBOARD_ANALYTICS=true
FEATURE_LEARNING_TIME_TRACKING=true
FEATURE_SUBJECT_MASTERY_TRACKING=true
FEATURE_STREAK_ANALYTICS=true
FEATURE_HELP_REQUEST_ANALYTICS=true

# Safety and Monitoring Features
FEATURE_LOGIN_MONITORING=true
FEATURE_DEVICE_TRACKING=true
FEATURE_SUSPICIOUS_ACTIVITY_DETECTION=true
FEATURE_EMERGENCY_LOGOUT=true
FEATURE_CONTENT_SAFETY_INTEGRATION=true

# Performance Features
FEATURE_PROGRESS_CACHING=true
FEATURE_BADGE_CACHING=true
FEATURE_LAZY_LOADING=true
FEATURE_BATCH_PROCESSING=true
FEATURE_PERFORMANCE_MONITORING=true
```

## Environment-Specific Configurations

### Development Environment (.env.development)

```bash
# Development-specific settings
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Relaxed security for development
CHILD_SESSION_TIMEOUT=3600000
CHILD_MAX_FAILED_LOGINS=10
RATE_LIMITING_ENABLED=false

# Development database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_study_planner_dev"

# Development Redis
REDIS_URL=redis://localhost:6379/1

# Mock external services
SENDGRID_API_KEY=mock_sendgrid_key
CLAUDE_API_KEY=mock_claude_key
GEMINI_API_KEY=mock_gemini_key

# Development feature flags
FEATURE_BADGE_CELEBRATIONS=true
FEATURE_REAL_TIME_PROGRESS=true
FEATURE_PERFORMANCE_MONITORING=false
```

### Staging Environment (.env.staging)

```bash
# Staging-specific settings
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info

# Staging database
DATABASE_URL="postgresql://staging_user:staging_password@staging-db:5432/ai_study_planner_staging"

# Staging Redis
REDIS_URL=redis://staging-redis:6379
REDIS_PASSWORD=staging_redis_password

# Staging external services
SENDGRID_API_KEY=staging_sendgrid_key
CLAUDE_API_KEY=staging_claude_key
GEMINI_API_KEY=staging_gemini_key

# Staging security settings
CHILD_SESSION_TIMEOUT=1800000
CHILD_MAX_FAILED_LOGINS=5
RATE_LIMITING_ENABLED=true

# Staging feature flags (mirror production)
FEATURE_CHILD_PROGRESS_MODULE=true
FEATURE_BADGE_SYSTEM=true
FEATURE_REAL_TIME_PROGRESS=true
```

### Production Environment (.env.production)

```bash
# Production settings
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn

# Production database (use environment variables for security)
DATABASE_URL=${DATABASE_URL}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Production Redis
REDIS_URL=${REDIS_URL}
REDIS_PASSWORD=${REDIS_PASSWORD}

# Production security settings
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CHILD_SESSION_TIMEOUT=1200000
CHILD_MAX_FAILED_LOGINS=3
RATE_LIMITING_ENABLED=true

# Production external services
SENDGRID_API_KEY=${SENDGRID_API_KEY}
CLAUDE_API_KEY=${CLAUDE_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}

# Production feature flags
FEATURE_CHILD_PROGRESS_MODULE=true
FEATURE_ENHANCED_CHILD_AUTH=true
FEATURE_BADGE_SYSTEM=true
FEATURE_LEARNING_STREAKS=true
FEATURE_REAL_TIME_PROGRESS=true
FEATURE_PARENTAL_MONITORING=true
FEATURE_PERFORMANCE_MONITORING=true
```

## Docker Configuration

### Docker Compose Override for Child Progress Module

Create `docker-compose.child-progress.yml`:

```yaml
version: '3.8'

services:
  backend:
    environment:
      # Child Progress Module Settings
      - FEATURE_CHILD_PROGRESS_MODULE=true
      - BADGE_PROCESSING_ENABLED=true
      - PROGRESS_SYNC_ENABLED=true
      - CHILD_AUTH_ENABLED=true
      - PARENTAL_NOTIFICATIONS_ENABLED=true
      
      # Performance Settings
      - CHILD_PROGRESS_CACHE_ENABLED=true
      - BADGE_ELIGIBILITY_CACHE_TTL=180
      - PROGRESS_BATCH_SIZE=100
      
      # Security Settings
      - CHILD_SESSION_TIMEOUT=1200000
      - CHILD_MAX_FAILED_LOGINS=3
      - SUSPICIOUS_ACTIVITY_DETECTION=true
    
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/uploads:/app/uploads
    
    depends_on:
      - postgres
      - redis
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    environment:
      # Child Progress Module Frontend Settings
      - REACT_APP_CHILD_PROGRESS_ENABLED=true
      - REACT_APP_BADGE_CELEBRATIONS_ENABLED=true
      - REACT_APP_REAL_TIME_PROGRESS_ENABLED=true
      - REACT_APP_WEBSOCKET_URL=ws://localhost:3002
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    
    volumes:
      - redis_data:/data
    
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/scripts/backup-database.sh:/backup-database.sh
    
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Configuration

Create `k8s/child-progress-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: child-progress-config
  namespace: ai-study-planner
data:
  # Child Progress Module Settings
  FEATURE_CHILD_PROGRESS_MODULE: "true"
  BADGE_PROCESSING_ENABLED: "true"
  BADGE_PROCESSING_INTERVAL: "60000"
  PROGRESS_SYNC_ENABLED: "true"
  PROGRESS_SYNC_INTERVAL: "30000"
  
  # Authentication Settings
  CHILD_AUTH_ENABLED: "true"
  CHILD_SESSION_TIMEOUT: "1200000"
  CHILD_MAX_FAILED_LOGINS: "3"
  CHILD_LOCKOUT_DURATION: "900000"
  
  # Cache Settings
  CHILD_PROGRESS_CACHE_ENABLED: "true"
  CHILD_PROGRESS_CACHE_TTL: "300"
  BADGE_ELIGIBILITY_CACHE_TTL: "180"
  
  # Performance Settings
  PROGRESS_BATCH_SIZE: "100"
  BADGE_CACHE_TTL: "300"
  
  # Feature Flags
  FEATURE_BADGE_CELEBRATIONS: "true"
  FEATURE_REAL_TIME_PROGRESS: "true"
  FEATURE_PARENTAL_MONITORING: "true"
  FEATURE_CHILD_ANALYTICS: "true"
```

## Database Configuration

### Prisma Configuration Updates

Add to `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Child Progress Module specific indexes
model ProgressRecord {
  @@index([childId, completedAt])
  @@index([childId, subject])
  @@index([completedAt], where: { completed: true })
}

model Achievement {
  @@index([childId, earnedAt])
  @@index([badgeDefinitionId])
}

model ChildLoginSession {
  @@index([childId, loginTime])
  @@index([loginTime])
}

model LearningStreak {
  @@index([childId, streakType])
  @@index([lastActivityDate])
}
```

### Database Migration Configuration

Create `prisma/migrations/deploy.sql`:

```sql
-- Child Progress Module deployment migration
-- This migration ensures all required tables and indexes exist

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_child_completed 
ON progress_records(child_id, completed_at) WHERE completed = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_child_subject 
ON progress_records(child_id, subject);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_child_earned 
ON achievements(child_id, earned_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_child_sessions_child_login 
ON child_login_sessions(child_id, login_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_streaks_child_type 
ON learning_streaks(child_id, streak_type);

-- Update existing tables with new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'progress_records' AND column_name = 'session_data') THEN
        ALTER TABLE progress_records ADD COLUMN session_data JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'achievements' AND column_name = 'celebration_shown') THEN
        ALTER TABLE achievements ADD COLUMN celebration_shown BOOLEAN DEFAULT false;
    END IF;
END $$;
```

## Redis Configuration

### Redis Configuration File (`redis.conf`)

```conf
# Redis configuration for Child Progress Module

# Basic settings
port 6379
bind 127.0.0.1
protected-mode yes
requirepass your_redis_password

# Memory settings
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence settings
save 900 1
save 300 10
save 60 10000

# Child Progress Module specific settings
# Database 0: General cache
# Database 1: Badge cache
# Database 2: Progress cache
# Database 3: Session cache

# Keyspace notifications for real-time updates
notify-keyspace-events Ex

# Performance settings
tcp-keepalive 300
timeout 0
tcp-backlog 511

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

### Redis Cache Configuration

```javascript
// Redis cache configuration for Child Progress Module
const REDIS_CONFIG = {
  // Badge system caching
  badges: {
    definitions: {
      keyPrefix: 'badge:def:',
      ttl: 3600, // 1 hour
      db: 1
    },
    progress: {
      keyPrefix: 'badge:progress:',
      ttl: 300, // 5 minutes
      db: 1
    },
    eligibility: {
      keyPrefix: 'badge:eligible:',
      ttl: 180, // 3 minutes
      db: 1
    }
  },
  
  // Progress tracking caching
  progress: {
    summary: {
      keyPrefix: 'progress:summary:',
      ttl: 300, // 5 minutes
      db: 2
    },
    history: {
      keyPrefix: 'progress:history:',
      ttl: 600, // 10 minutes
      db: 2
    },
    streaks: {
      keyPrefix: 'progress:streaks:',
      ttl: 300, // 5 minutes
      db: 2
    }
  },
  
  // Session management
  sessions: {
    child: {
      keyPrefix: 'session:child:',
      ttl: 1200, // 20 minutes
      db: 3
    },
    activity: {
      keyPrefix: 'session:activity:',
      ttl: 3600, // 1 hour
      db: 3
    }
  },
  
  // Analytics caching
  analytics: {
    dashboard: {
      keyPrefix: 'analytics:dashboard:',
      ttl: 600, // 10 minutes
      db: 0
    },
    reports: {
      keyPrefix: 'analytics:reports:',
      ttl: 1800, // 30 minutes
      db: 0
    }
  }
};
```

## Monitoring and Logging Configuration

### Application Logging Configuration

```javascript
// Winston logging configuration
const LOGGING_CONFIG = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File logging
    new winston.transports.File({
      filename: '/app/logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: '/app/logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 14
    }),
    
    // Child-specific logging
    new winston.transports.File({
      filename: '/app/logs/child-progress.log',
      level: 'info',
      format: winston.format.combine(
        winston.format.label({ label: 'child-progress' }),
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
};
```

### Health Check Configuration

```javascript
// Health check endpoints configuration
const HEALTH_CHECK_CONFIG = {
  endpoints: {
    '/health': {
      checks: ['database', 'redis', 'external_services']
    },
    '/health/child-progress': {
      checks: [
        'badge_processing',
        'progress_sync',
        'child_auth',
        'cache_performance'
      ]
    }
  },
  
  checks: {
    database: {
      timeout: 5000,
      query: 'SELECT 1'
    },
    redis: {
      timeout: 3000,
      command: 'PING'
    },
    badge_processing: {
      timeout: 10000,
      test: 'badge_eligibility_check'
    },
    progress_sync: {
      timeout: 5000,
      test: 'progress_update_latency'
    }
  }
};
```

## Security Configuration

### Child-Specific Security Settings

```javascript
// Security configuration for child progress module
const CHILD_SECURITY_CONFIG = {
  authentication: {
    pinLength: {
      min: parseInt(process.env.CHILD_PIN_MIN_LENGTH) || 4,
      max: parseInt(process.env.CHILD_PIN_MAX_LENGTH) || 6
    },
    sessionTimeout: parseInt(process.env.CHILD_SESSION_TIMEOUT) || 1200000,
    maxFailedLogins: parseInt(process.env.CHILD_MAX_FAILED_LOGINS) || 3,
    lockoutDuration: parseInt(process.env.CHILD_LOCKOUT_DURATION) || 900000
  },
  
  monitoring: {
    deviceTracking: process.env.CHILD_DEVICE_TRACKING === 'true',
    ipLogging: process.env.CHILD_IP_LOGGING === 'true',
    suspiciousActivityDetection: process.env.SUSPICIOUS_ACTIVITY_DETECTION === 'true',
    alertThreshold: parseInt(process.env.SECURITY_ALERT_THRESHOLD) || 3
  },
  
  rateLimiting: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.CHILD_AUTH_RATE_LIMIT) || 5
    },
    progress: {
      windowMs: 60 * 1000, // 1 minute
      max: parseInt(process.env.CHILD_PROGRESS_RATE_LIMIT) || 60
    },
    dashboard: {
      windowMs: 60 * 1000, // 1 minute
      max: parseInt(process.env.CHILD_DASHBOARD_RATE_LIMIT) || 30
    }
  }
};
```

## Deployment Checklist

### Pre-Deployment Checklist

- [ ] Environment variables configured for target environment
- [ ] Database migrations tested and ready
- [ ] Redis configuration updated
- [ ] SSL certificates installed (production)
- [ ] Backup procedures tested
- [ ] Monitoring and alerting configured
- [ ] Load balancer configuration updated
- [ ] CDN configuration updated (if applicable)
- [ ] DNS records updated (if applicable)

### Post-Deployment Checklist

- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] Child authentication endpoints working
- [ ] Badge system functioning
- [ ] Progress tracking operational
- [ ] Real-time features working
- [ ] Parental notifications sending
- [ ] Performance metrics within acceptable ranges
- [ ] Error rates within acceptable thresholds
- [ ] Backup procedures verified

### Rollback Checklist

- [ ] Backup restoration tested
- [ ] Database rollback procedures documented
- [ ] Service rollback procedures documented
- [ ] Configuration rollback procedures documented
- [ ] Monitoring for rollback completion
- [ ] Verification of rollback success

This comprehensive environment configuration ensures that the Child Progress Module is properly configured for all deployment environments while maintaining security, performance, and reliability standards.