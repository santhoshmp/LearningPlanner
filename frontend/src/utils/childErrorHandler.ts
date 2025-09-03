import { ReactNode } from 'react';

export interface AuthError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  recoveryActions: RecoveryAction[];
  shouldRedirect: boolean;
  redirectPath?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  icon?: ReactNode;
  primary?: boolean;
}

export interface NetworkError extends Error {
  isNetworkError: boolean;
  retryCount?: number;
  maxRetries?: number;
}

// Child-friendly error messages with emojis and simple language
export const CHILD_ERROR_MESSAGES: Record<string, Omit<AuthError, 'recoveryActions'>> = {
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid username or PIN',
    userFriendlyMessage: 'Oops! Your username or PIN doesn\'t match. Let\'s try again! 🔑',
    shouldRedirect: false,
    severity: 'medium'
  },
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Session has expired',
    userFriendlyMessage: 'Your learning time is up! Please log in again to continue. ⏰',
    shouldRedirect: true,
    redirectPath: '/child-login',
    severity: 'medium'
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    userFriendlyMessage: 'We\'re having trouble connecting. Check your internet and try again! 🌐',
    shouldRedirect: false,
    severity: 'high'
  },
  TOKEN_REFRESH_FAILED: {
    code: 'TOKEN_REFRESH_FAILED',
    message: 'Failed to refresh authentication token',
    userFriendlyMessage: 'We need to log you in again. Don\'t worry, your progress is saved! 🔄',
    shouldRedirect: true,
    redirectPath: '/child-login',
    severity: 'medium'
  },
  AUTHENTICATION_LOOP: {
    code: 'AUTHENTICATION_LOOP',
    message: 'Authentication loop detected',
    userFriendlyMessage: 'Something got mixed up! Let\'s start fresh with a new login. 🔄',
    shouldRedirect: true,
    redirectPath: '/child-login',
    severity: 'high'
  },
  CORRUPTED_SESSION: {
    code: 'CORRUPTED_SESSION',
    message: 'Session data is corrupted',
    userFriendlyMessage: 'We found some mixed-up data. Let\'s clean it up and try again! 🧹',
    shouldRedirect: true,
    redirectPath: '/child-login',
    severity: 'high'
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Server error occurred',
    userFriendlyMessage: 'Our computers are having a little trouble. Let\'s wait a moment and try again! 🤖',
    shouldRedirect: false,
    severity: 'high'
  },
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    message: 'Permission denied',
    userFriendlyMessage: 'You don\'t have permission to do that. Ask a grown-up for help! 👨‍👩‍👧‍👦',
    shouldRedirect: false,
    severity: 'medium'
  },
  ACCOUNT_LOCKED: {
    code: 'ACCOUNT_LOCKED',
    message: 'Account is temporarily locked',
    userFriendlyMessage: 'Your account is taking a little break for safety. Ask a grown-up to help unlock it! 🔒',
    shouldRedirect: false,
    severity: 'critical'
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    userFriendlyMessage: 'Something unexpected happened. Let\'s try again or ask for help! 🤔',
    shouldRedirect: false,
    severity: 'medium'
  }
};

// Authentication loop detection
class AuthLoopDetector {
  private static readonly MAX_REDIRECTS = 3;
  private static readonly TIME_WINDOW = 30000; // 30 seconds
  private static redirectHistory: Array<{ path: string; timestamp: number }> = [];

  static recordRedirect(path: string): void {
    const now = Date.now();
    
    // Clean old entries
    this.redirectHistory = this.redirectHistory.filter(
      entry => now - entry.timestamp < this.TIME_WINDOW
    );
    
    // Add new entry
    this.redirectHistory.push({ path, timestamp: now });
  }

  static isLoopDetected(): boolean {
    const now = Date.now();
    const recentRedirects = this.redirectHistory.filter(
      entry => now - entry.timestamp < this.TIME_WINDOW
    );
    
    return recentRedirects.length >= this.MAX_REDIRECTS;
  }

  static reset(): void {
    this.redirectHistory = [];
  }

  static getRedirectCount(): number {
    const now = Date.now();
    return this.redirectHistory.filter(
      entry => now - entry.timestamp < this.TIME_WINDOW
    ).length;
  }
}

// Network error detection and retry mechanism
class NetworkErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // Progressive delays

  static isNetworkError(error: any): boolean {
    return (
      error?.code === 'NETWORK_ERROR' ||
      error?.name === 'NetworkError' ||
      error?.message?.includes('Network Error') ||
      error?.message?.includes('fetch') ||
      error?.message?.includes('ERR_NETWORK') ||
      error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
      error?.response?.status === 0 ||
      (!navigator.onLine && error?.message)
    );
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isNetworkError(error) || attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        const delay = this.RETRY_DELAYS[attempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  static createNetworkError(originalError: Error, retryCount: number = 0): NetworkError {
    const networkError = new Error(originalError.message) as NetworkError;
    networkError.name = 'NetworkError';
    networkError.isNetworkError = true;
    networkError.retryCount = retryCount;
    networkError.maxRetries = this.MAX_RETRIES;
    networkError.stack = originalError.stack;
    return networkError;
  }
}

// Session data validation and corruption detection
class SessionValidator {
  private static readonly REQUIRED_FIELDS = ['user', 'userRole', 'accessToken', 'refreshToken'];
  
  static validateSessionData(sessionData: any): boolean {
    if (!sessionData || typeof sessionData !== 'object') {
      return false;
    }
    
    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!sessionData[field]) {
        return false;
      }
    }
    
    // Validate user object
    if (!sessionData.user.id || !sessionData.user.role) {
      return false;
    }
    
    // Validate role consistency
    const userRole = sessionData.userRole;
    const userObjectRole = sessionData.user.role;
    
    if (userRole === 'child' && userObjectRole !== 'CHILD') {
      return false;
    }
    
    if (userRole === 'parent' && userObjectRole !== 'PARENT') {
      return false;
    }
    
    // Validate tokens format
    if (typeof sessionData.accessToken !== 'string' || sessionData.accessToken.length < 10) {
      return false;
    }
    
    if (typeof sessionData.refreshToken !== 'string' || sessionData.refreshToken.length < 10) {
      return false;
    }
    
    return true;
  }
  
  static detectCorruption(): string[] {
    const issues: string[] = [];
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');
      const userRole = localStorage.getItem('userRole');
      
      // Check for missing data
      if (!accessToken) issues.push('Missing access token');
      if (!refreshToken) issues.push('Missing refresh token');
      if (!userStr) issues.push('Missing user data');
      if (!userRole) issues.push('Missing user role');
      
      // Check for malformed JSON
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (!user.id) issues.push('Invalid user ID');
          if (!user.role) issues.push('Invalid user role');
        } catch {
          issues.push('Corrupted user data JSON');
        }
      }
      
      // Check for role consistency
      if (userStr && userRole) {
        try {
          const user = JSON.parse(userStr);
          if (userRole === 'child' && user.role !== 'CHILD') {
            issues.push('Role inconsistency: child/CHILD mismatch');
          }
          if (userRole === 'parent' && user.role !== 'PARENT') {
            issues.push('Role inconsistency: parent/PARENT mismatch');
          }
        } catch {
          // Already caught above
        }
      }
      
    } catch (error) {
      issues.push('Failed to access localStorage');
    }
    
    return issues;
  }
  
  static cleanCorruptedData(): void {
    const keysToRemove = [
      'accessToken', 'refreshToken', 'user', 'userRole', 
      'loginTime', 'sessionId'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key} from localStorage:`, error);
      }
    });
  }
}

// Main error handler class
export class ChildAuthErrorHandler {
  static createError(
    code: string, 
    originalError?: Error,
    customMessage?: string,
    recoveryActions: RecoveryAction[] = []
  ): AuthError {
    const baseError = CHILD_ERROR_MESSAGES[code] || CHILD_ERROR_MESSAGES.UNKNOWN_ERROR;
    
    return {
      ...baseError,
      message: customMessage || baseError.message,
      recoveryActions
    };
  }
  
  static handleAuthenticationError(error: any, context: {
    onRetry?: () => void;
    onLogout?: () => void;
    onContactHelp?: () => void;
    onGoHome?: () => void;
  } = {}): AuthError {
    // Detect error type - prioritize specific errors over corruption detection
    let errorCode = 'UNKNOWN_ERROR';
    
    // Check for authentication loop first (highest priority)
    if (AuthLoopDetector.isLoopDetected()) {
      errorCode = 'AUTHENTICATION_LOOP';
      AuthLoopDetector.reset();
    }
    // Check for specific error types
    else if (NetworkErrorHandler.isNetworkError(error)) {
      errorCode = 'NETWORK_ERROR';
    } else if (error?.response?.status === 401) {
      errorCode = 'INVALID_CREDENTIALS';
    } else if (error?.response?.status === 403) {
      errorCode = 'PERMISSION_DENIED';
    } else if (error?.response?.status >= 500) {
      errorCode = 'SERVER_ERROR';
    } else if (error?.code === 'TOKEN_REFRESH_FAILED') {
      errorCode = 'TOKEN_REFRESH_FAILED';
    }
    // Only check for session corruption if no specific error type was detected
    else {
      const corruptionIssues = SessionValidator.detectCorruption();
      if (corruptionIssues.length > 0) {
        errorCode = 'CORRUPTED_SESSION';
        SessionValidator.cleanCorruptedData();
      }
    }
    
    // Create recovery actions
    const recoveryActions: RecoveryAction[] = [];
    
    if (errorCode === 'NETWORK_ERROR' && context.onRetry) {
      recoveryActions.push({
        label: 'Try Again',
        action: context.onRetry,
        icon: '🔄',
        primary: true
      });
    }
    
    if (context.onLogout && ['SESSION_EXPIRED', 'TOKEN_REFRESH_FAILED', 'CORRUPTED_SESSION', 'AUTHENTICATION_LOOP'].includes(errorCode)) {
      recoveryActions.push({
        label: 'Log In Again',
        action: context.onLogout,
        icon: '🔑',
        primary: true
      });
    }
    
    if (context.onGoHome) {
      recoveryActions.push({
        label: 'Go Home',
        action: context.onGoHome,
        icon: '🏠'
      });
    }
    
    if (context.onContactHelp) {
      recoveryActions.push({
        label: 'Ask for Help',
        action: context.onContactHelp,
        icon: '🆘'
      });
    }
    
    return this.createError(errorCode, error, undefined, recoveryActions);
  }
  
  static recordRedirect(path: string): void {
    AuthLoopDetector.recordRedirect(path);
  }
  
  static isLoopDetected(): boolean {
    return AuthLoopDetector.isLoopDetected();
  }
  
  static resetLoopDetection(): void {
    AuthLoopDetector.reset();
  }
  
  static async withNetworkRetry<T>(operation: () => Promise<T>): Promise<T> {
    return NetworkErrorHandler.withRetry(operation);
  }
  
  static validateSession(sessionData: any): boolean {
    return SessionValidator.validateSessionData(sessionData);
  }
  
  static cleanCorruptedSession(): void {
    SessionValidator.cleanCorruptedData();
  }
  
  static getSessionCorruptionIssues(): string[] {
    return SessionValidator.detectCorruption();
  }
}

export { AuthLoopDetector, NetworkErrorHandler, SessionValidator };