import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { ChildAuthErrorHandler, AuthError } from '../../utils/childErrorHandler';
import ChildFriendlyErrorDisplay from './ChildFriendlyErrorDisplay';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: AuthError | null;
  errorId: string | null;
}

class ChildAuthErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Convert to child-friendly error
    const authError = ChildAuthErrorHandler.handleAuthenticationError(error, {
      onRetry: () => {}, // Will be set in render
      onLogout: () => {
        // Clear session and redirect to child login
        ChildAuthErrorHandler.cleanCorruptedSession();
        window.location.href = '/child-login';
      },
      onContactHelp: () => {
        // Show help contact information
        alert('Please ask a grown-up to help you! 👨‍👩‍👧‍👦');
      },
      onGoHome: () => {
        window.location.href = '/';
      }
    });

    return {
      hasError: true,
      error: authError,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for monitoring
    console.error('ChildAuthErrorBoundary caught an error:', error, errorInfo);
    
    // Check for authentication loops
    if (ChildAuthErrorHandler.isLoopDetected()) {
      console.warn('Authentication loop detected, cleaning session');
      ChildAuthErrorHandler.cleanCorruptedSession();
      ChildAuthErrorHandler.resetLoopDetection();
    }
    
    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Report to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send error report to backend for monitoring
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionCorruption: ChildAuthErrorHandler.getSessionCorruptionIssues(),
        retryCount: this.retryCount
      };
      
      // Send to backend (non-blocking)
      fetch('/api/child-errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      }).catch(err => {
        console.warn('Failed to report error to backend:', err);
      });
    } catch (reportingError) {
      console.warn('Error reporting failed:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorId: null
      });
    } else {
      // Max retries reached, force logout
      ChildAuthErrorHandler.cleanCorruptedSession();
      window.location.href = '/child-login';
    }
  };

  private handleLogout = () => {
    ChildAuthErrorHandler.cleanCorruptedSession();
    ChildAuthErrorHandler.resetLoopDetection();
    window.location.href = '/child-login';
  };

  private handleContactHelp = () => {
    // Show child-friendly help message
    const helpMessage = `
      Hi! It looks like something went wrong. Here's what you can do:
      
      1. Ask a grown-up to help you 👨‍👩‍👧‍👦
      2. Try refreshing the page 🔄
      3. Check your internet connection 🌐
      
      Error ID: ${this.state.errorId}
    `;
    
    alert(helpMessage);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Update recovery actions with current handlers
      const errorWithActions: AuthError = {
        ...this.state.error,
        recoveryActions: [
          ...(this.retryCount < this.maxRetries ? [{
            label: 'Try Again',
            action: this.handleRetry,
            icon: '🔄',
            primary: true
          }] : []),
          {
            label: 'Log In Again',
            action: this.handleLogout,
            icon: '🔑',
            primary: this.retryCount >= this.maxRetries
          },
          {
            label: 'Go Home',
            action: this.handleGoHome,
            icon: '🏠'
          },
          {
            label: 'Ask for Help',
            action: this.handleContactHelp,
            icon: '🆘'
          }
        ]
      };

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <ChildFriendlyErrorDisplay
              error={errorWithActions}
              showTechnicalDetails={process.env.NODE_ENV === 'development'}
            />
            
            {/* Additional help information */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
              <Box sx={{ fontSize: '2rem', mb: 1 }}>🤗</Box>
              <Box sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                Don't worry! These things happen sometimes.
                <br />
                A grown-up can help you get back to learning!
              </Box>
            </Box>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ChildAuthErrorBoundary;