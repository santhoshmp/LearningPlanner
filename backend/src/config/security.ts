import { Request } from 'express';

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    MAX_CONSECUTIVE_CHARS: 3,
    COMMON_PASSWORDS_CHECK: true
  },

  // Session management
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    IDLE_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
    CONCURRENT_SESSIONS_LIMIT: 5,
    SECURE_COOKIES: process.env.NODE_ENV === 'production',
    SAME_SITE: 'strict' as const,
    HTTP_ONLY: true
  },

  // Rate limiting
  RATE_LIMITS: {
    GLOBAL: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 1000
    },
    AUTH: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 10
    },
    OAUTH: {
      WINDOW_MS: 10 * 60 * 1000, // 10 minutes
      MAX_REQUESTS: 20
    },
    PASSWORD_RESET: {
      WINDOW_MS: 60 * 60 * 1000, // 1 hour
      MAX_REQUESTS: 3
    },
    AI_REQUESTS: {
      WINDOW_MS: 5 * 60 * 1000, // 5 minutes
      MAX_REQUESTS: 10
    },
    FILE_UPLOAD: {
      WINDOW_MS: 10 * 60 * 1000, // 10 minutes
      MAX_REQUESTS: 20
    }
  },

  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    MAX_FILES: 5,
    SCAN_FOR_MALWARE: true,
    QUARANTINE_SUSPICIOUS: true
  },

  // OAuth security
  OAUTH: {
    STATE_MAX_AGE: 10 * 60 * 1000, // 10 minutes
    PKCE_REQUIRED: true,
    TOKEN_ENCRYPTION_ALGORITHM: 'aes-256-gcm',
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
    MAX_PROVIDER_ACCOUNTS: 5
  },

  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://appleid.cdn-apple.com"],
    STYLE_SRC: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    FONT_SRC: ["'self'", "https://fonts.gstatic.com"],
    IMG_SRC: ["'self'", "data:", "https:", "blob:"],
    MEDIA_SRC: ["'self'", "blob:"],
    CONNECT_SRC: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com"],
    FRAME_SRC: ["'self'", "https://accounts.google.com", "https://appleid.apple.com"],
    OBJECT_SRC: ["'none'"],
    BASE_URI: ["'self'"],
    FORM_ACTION: ["'self'"],
    FRAME_ANCESTORS: ["'none'"]
  },

  // Security headers
  HEADERS: {
    HSTS_MAX_AGE: 31536000, // 1 year
    HSTS_INCLUDE_SUBDOMAINS: true,
    HSTS_PRELOAD: true,
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin'
  },

  // Input validation
  INPUT_VALIDATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 1000,
    MAX_OBJECT_DEPTH: 10,
    SANITIZE_HTML: true,
    STRIP_DANGEROUS_CHARS: true,
    LOG_VALIDATION_FAILURES: true
  },

  // Monitoring and alerting
  MONITORING: {
    LOG_FAILED_ATTEMPTS: true,
    ALERT_THRESHOLD: 10, // Failed attempts before alert
    BLOCK_THRESHOLD: 50, // Failed attempts before temporary block
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
    SUSPICIOUS_PATTERNS: [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL injection
      /((\%3C)|<)[^\n]+((\%3E)|>)/i, // XSS
      /\.\.\/|\.\.\\|\.\/|\.\\|\/etc\/passwd|\/etc\/shadow/i, // Path traversal
      /\.\.|%2e%2e|%252e%252e/i // Directory traversal
    ]
  },

  // Encryption
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 16,
    TAG_LENGTH: 16,
    PBKDF2_ITERATIONS: 10000,
    SALT_LENGTH: 16
  }
};

/**
 * Security utility functions
 */
export class SecurityUtils {
  /**
   * Generate cryptographically secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = SECURITY_CONFIG.PASSWORD;

    if (password.length < config.MIN_LENGTH) {
      errors.push(`Password must be at least ${config.MIN_LENGTH} characters long`);
    }

    if (password.length > config.MAX_LENGTH) {
      errors.push(`Password must not exceed ${config.MAX_LENGTH} characters`);
    }

    if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.REQUIRE_SPECIAL_CHARS && !new RegExp(`[${config.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for consecutive characters
    for (let i = 0; i < password.length - config.MAX_CONSECUTIVE_CHARS; i++) {
      const char = password[i];
      let consecutive = 1;
      for (let j = i + 1; j < password.length && password[j] === char; j++) {
        consecutive++;
      }
      if (consecutive > config.MAX_CONSECUTIVE_CHARS) {
        errors.push(`Password cannot contain more than ${config.MAX_CONSECUTIVE_CHARS} consecutive identical characters`);
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if request is from trusted source
   */
  static isTrustedSource(req: Request): boolean {
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    const trustedUserAgents = process.env.TRUSTED_USER_AGENTS?.split(',') || [];
    
    if (trustedIPs.length > 0 && !trustedIPs.includes(req.ip || '')) {
      return false;
    }

    if (trustedUserAgents.length > 0) {
      const userAgent = req.headers['user-agent'] || '';
      return trustedUserAgents.some(trusted => userAgent.includes(trusted));
    }

    return true;
  }

  /**
   * Detect suspicious request patterns
   */
  static detectSuspiciousPatterns(req: Request): { isSuspicious: boolean; patterns: string[] } {
    const patterns: string[] = [];
    const url = req.originalUrl;
    const body = JSON.stringify(req.body);
    const query = JSON.stringify(req.query);

    for (const pattern of SECURITY_CONFIG.MONITORING.SUSPICIOUS_PATTERNS) {
      if (pattern.test(url) || pattern.test(body) || pattern.test(query)) {
        if (pattern.source.includes('sql')) patterns.push('sql_injection');
        else if (pattern.source.includes('xss')) patterns.push('xss');
        else if (pattern.source.includes('traversal')) patterns.push('path_traversal');
        else patterns.push('unknown_pattern');
      }
    }

    return {
      isSuspicious: patterns.length > 0,
      patterns
    };
  }

  /**
   * Generate Content Security Policy header value
   */
  static generateCSPHeader(): string {
    const csp = SECURITY_CONFIG.CSP;
    const directives = [
      `default-src ${csp.DEFAULT_SRC.join(' ')}`,
      `script-src ${csp.SCRIPT_SRC.join(' ')}`,
      `style-src ${csp.STYLE_SRC.join(' ')}`,
      `font-src ${csp.FONT_SRC.join(' ')}`,
      `img-src ${csp.IMG_SRC.join(' ')}`,
      `media-src ${csp.MEDIA_SRC.join(' ')}`,
      `connect-src ${csp.CONNECT_SRC.join(' ')}`,
      `frame-src ${csp.FRAME_SRC.join(' ')}`,
      `object-src ${csp.OBJECT_SRC.join(' ')}`,
      `base-uri ${csp.BASE_URI.join(' ')}`,
      `form-action ${csp.FORM_ACTION.join(' ')}`,
      `frame-ancestors ${csp.FRAME_ANCESTORS.join(' ')}`,
      'upgrade-insecure-requests'
    ];

    return directives.join('; ');
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  /**
   * Check if IP is in allowed range
   */
  static isIPAllowed(ip: string, allowedRanges: string[] = []): boolean {
    if (allowedRanges.length === 0) return true;
    
    // Simple IP range checking (can be enhanced with proper CIDR support)
    return allowedRanges.some(range => {
      if (range.includes('/')) {
        // CIDR notation - simplified check
        const [network, bits] = range.split('/');
        // This is a simplified implementation
        return ip.startsWith(network.split('.').slice(0, Math.floor(parseInt(bits) / 8)).join('.'));
      } else {
        return ip === range;
      }
    });
  }

  /**
   * Generate secure session token
   */
  static generateSessionToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Hash password with salt
   */
  static async hashPassword(password: string): Promise<string> {
    const crypto = require('crypto');
    const salt = crypto.randomBytes(SECURITY_CONFIG.ENCRYPTION.SALT_LENGTH).toString('hex');
    const hash = crypto.pbkdf2Sync(
      password, 
      salt, 
      SECURITY_CONFIG.ENCRYPTION.PBKDF2_ITERATIONS, 
      64, 
      'sha512'
    ).toString('hex');
    
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const crypto = require('crypto');
      const [salt, hash] = hashedPassword.split(':');
      const expectedHash = crypto.pbkdf2Sync(
        password, 
        salt, 
        SECURITY_CONFIG.ENCRYPTION.PBKDF2_ITERATIONS, 
        64, 
        'sha512'
      ).toString('hex');
      
      return hash === expectedHash;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Common security patterns for validation
 */
export const SECURITY_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  PIN: /^\d{4,6}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
  SQL_INJECTION: /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  XSS: /((\%3C)|<)[^\n]+((\%3E)|>)/i,
  PATH_TRAVERSAL: /\.\.\/|\.\.\\|\.\/|\.\\|\/etc\/passwd|\/etc\/shadow/i
};