import winston from 'winston';
import 'winston-daily-rotate-file';

// Define log formats
const commonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: commonFormat,
  defaultMeta: { service: 'ai-study-planner' },
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to 'combined.log'
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Create security logger for access and security events
export const securityLogger = winston.createLogger({
  level: 'info',
  format: commonFormat,
  defaultMeta: { service: 'ai-study-planner-security' },
  transports: [
    // Write security logs to a separate file with daily rotation
    new winston.transports.DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    // Also write to combined log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Create audit logger for sensitive operations
export const auditLogger = winston.createLogger({
  level: 'info',
  format: commonFormat,
  defaultMeta: { service: 'ai-study-planner-audit' },
  transports: [
    // Write audit logs to a separate file with daily rotation
    new winston.transports.DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),
    // Also write to combined log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  );
  
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
  
  securityLogger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
  
  auditLogger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

/**
 * Log a security event
 * @param eventType Type of security event
 * @param data Additional event data
 */
export const logSecurityEvent = (eventType: string, data: any) => {
  securityLogger.info({
    eventType,
    timestamp: new Date().toISOString(),
    ...data
  });
};

/**
 * Log an audit event for sensitive operations
 * @param operation Operation being performed
 * @param userId User performing the operation
 * @param targetResource Resource being operated on
 * @param details Additional operation details
 * @param success Whether the operation was successful
 */
export const logAuditEvent = (
  operation: string,
  userId: string,
  targetResource: string,
  details: any,
  success: boolean
) => {
  auditLogger.info({
    operation,
    userId,
    targetResource,
    details,
    success,
    timestamp: new Date().toISOString()
  });
};

export default logger;