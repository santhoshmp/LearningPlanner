import { useState, useCallback, useEffect } from 'react';
import { ChildAuthErrorHandler, AuthError } from '../utils/childErrorHandler';
import { useAuth } from '../contexts/AuthContext';

export interface UseChildErrorHandlerReturn {
  error: AuthError | null;
  isLoading: boolean;
  clearError: () => void;
  handleError: (error: any) => AuthError;
  retryOperation: (operation: () => Promise<void>) => Promise<void>;
  reportError: (error: AuthError) => Promise<void>;
}

export const useChildErrorHandler = (): UseChildErrorHandlerReturn => {
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isChild, logout, refreshAuth } = useAuth();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((originalError: any): AuthError => {
    const authError = ChildAuthErrorHandler.handleAuthenticationError(originalError, {
      onRetry: async () => {
        clearError();
        setIsLoading(true);
        try {
          await refreshAuth();
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        } finally {
          setIsLoading(false);
        }
      },
      onLogout: async () => {
        clearError();
        setIsLoading(true);
        try {
          await logout();
        } catch (logoutError) {
          console.error('Logout failed:', logoutError);
          // Force cleanup even if logout fails
          ChildAuthErrorHandler.cleanCorruptedSession();
          window.location.href = isChild ? '/child-login' : '/login';
        } finally {
          setIsLoading(false);
        }
      },
      onContactHelp: () => {
        const helpMessage = isChild 
          ? `Hi! Something went wrong and we need a grown-up to help. 
             
             Please ask a parent or guardian to:
             1. Check your internet connection 🌐
             2. Try refreshing the page 🔄
             3. Contact support if the problem continues 📞
             
             Error details: ${authError.code}`
          : `An error occurred. Please try refreshing the page or contact support if the issue persists.
             
             Error: ${authError.code}`;
        
        alert(helpMessage);
      },
      onGoHome: () => {
        clearError();
        window.location.href = '/';
      }
    });

    setError(authError);
    return authError;
  }, [isChild, logout, refreshAuth, clearError]);

  const retryOperation = useCallback(async (operation: () => Promise<void>): Promise<void> => {
    setIsLoading(true);
    try {
      await ChildAuthErrorHandler.withNetworkRetry(operation);
      clearError();
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const reportError = useCallback(async (authError: AuthError): Promise<void> => {
    try {
      const errorReport = {
        errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: authError.message,
        code: authError.code,
        userFriendlyMessage: authError.userFriendlyMessage,
        severity: authError.severity,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionCorruption: ChildAuthErrorHandler.getSessionCorruptionIssues(),
        isChild
      };

      // Send to backend for monitoring (non-blocking)
      fetch('/api/child/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      }).catch(reportingError => {
        console.warn('Failed to report error to backend:', reportingError);
      });
    } catch (reportingError) {
      console.warn('Error reporting failed:', reportingError);
    }
  }, [isChild]);

  // Auto-report errors when they occur
  useEffect(() => {
    if (error) {
      reportError(error);
    }
  }, [error, reportError]);

  // Check for authentication loops on mount
  useEffect(() => {
    if (ChildAuthErrorHandler.isLoopDetected()) {
      console.warn('Authentication loop detected on mount, cleaning up');
      ChildAuthErrorHandler.resetLoopDetection();
      ChildAuthErrorHandler.cleanCorruptedSession();
      
      const redirectPath = isChild ? '/child-login' : '/login';
      window.location.href = redirectPath;
    }
  }, [isChild]);

  // Monitor for session corruption
  useEffect(() => {
    const checkSessionHealth = () => {
      const corruptionIssues = ChildAuthErrorHandler.getSessionCorruptionIssues();
      if (corruptionIssues.length > 0) {
        console.warn('Session corruption detected:', corruptionIssues);
        const corruptionError = ChildAuthErrorHandler.createError('CORRUPTED_SESSION');
        handleError(corruptionError);
      }
    };

    // Check session health periodically
    const interval = setInterval(checkSessionHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [handleError]);

  return {
    error,
    isLoading,
    clearError,
    handleError,
    retryOperation,
    reportError
  };
};