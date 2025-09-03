import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { motion } from 'framer-motion';
import ChildFriendlyErrorComponent, { ChildFriendlyError } from './ChildFriendlyError';

interface Props {
  children: ReactNode;
  childAge?: number;
  childId?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  childFriendlyError: ChildFriendlyError | null;
}

class ChildErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      childFriendlyError: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { childAge = 10, childId, onError } = this.props;
    
    // Create child-friendly error
    const childFriendlyError = this.createChildFriendlyError(error, childAge);
    
    this.setState({ childFriendlyError });

    // Log the error with child-specific context
    this.logChildError(error, errorInfo, childId);

    // Call parent error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  private createChildFriendlyError(error: Error, childAge: number): ChildFriendlyError {
    const ageGroup = this.getAgeGroup(childAge);
    
    // Categorize the error
    const errorType = this.categorizeError(error);
    
    const errorMessages = {
      component: {
        early: {
          title: "Oops! Something Broke! 🔧",
          message: "Don't worry! Sometimes things break, but we can fix them together. Let's try again!",
          icon: "🔧"
        },
        middle: {
          title: "Component Error 🔧",
          message: "Something went wrong with this part of the app. Let's refresh and try again!",
          icon: "🔧"
        },
        teen: {
          title: "Application Error 🔧",
          message: "There was a technical issue with this component. Please refresh the page or try again.",
          icon: "🔧"
        }
      },
      network: {
        early: {
          title: "Internet Trouble! 🌐",
          message: "The internet is having a little trouble. Let's check the connection and try again!",
          icon: "🌐"
        },
        middle: {
          title: "Connection Problem 🌐",
          message: "We're having trouble connecting. Check your internet and refresh the page!",
          icon: "🌐"
        },
        teen: {
          title: "Network Error 🌐",
          message: "There's a network connectivity issue. Please check your connection and reload the page.",
          icon: "🌐"
        }
      },
      javascript: {
        early: {
          title: "App Hiccup! 🤖",
          message: "The app had a little hiccup, but we can fix it! Let's refresh and start fresh!",
          icon: "🤖"
        },
        middle: {
          title: "App Error 🤖",
          message: "Something unexpected happened in the app. Don't worry, refreshing should fix it!",
          icon: "🤖"
        },
        teen: {
          title: "JavaScript Error 🤖",
          message: "There was a JavaScript error in the application. Please refresh the page to continue.",
          icon: "🤖"
        }
      }
    };

    const config = errorMessages[errorType]?.[ageGroup] || errorMessages.component[ageGroup];
    
    return {
      title: config.title,
      message: config.message,
      icon: config.icon,
      severity: 'error',
      actionButton: {
        text: ageGroup === 'early' ? 'Try Again!' : 'Refresh Page',
        action: 'refresh_page'
      },
      parentNotification: true,
      recoveryOptions: [
        { id: 'refresh', text: 'Refresh Page', action: 'refresh_page', icon: '🔄' },
        { id: 'go-home', text: 'Go Home', action: 'go_home', icon: '🏠' },
        { id: 'get-help', text: 'Get Help', action: 'request_help', icon: '🆘' }
      ]
    };
  }

  private getAgeGroup(age: number): 'early' | 'middle' | 'teen' {
    if (age >= 5 && age <= 8) return 'early';
    if (age >= 9 && age <= 12) return 'middle';
    return 'teen';
  }

  private categorizeError(error: Error): 'component' | 'network' | 'javascript' {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || name.includes('network')) {
      return 'network';
    }
    if (name.includes('syntax') || name.includes('reference') || name.includes('type')) {
      return 'javascript';
    }
    return 'component';
  }

  private async logChildError(error: Error, errorInfo: React.ErrorInfo, childId?: string) {
    try {
      const errorData = {
        childId: childId || 'unknown',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Child Error Boundary caught an error:', errorData);
      }

      // TODO: Send to backend error logging service
      // await api.post('/api/child/errors', errorData);
    } catch (loggingError) {
      console.error('Failed to log child error:', loggingError);
    }
  }

  private handleErrorAction = (action: string) => {
    switch (action) {
      case 'refresh_page':
        window.location.reload();
        break;
      case 'go_home':
        window.location.href = '/child/dashboard';
        break;
      case 'request_help':
        // TODO: Integrate with help system
        console.log('Help requested for error:', this.state.errorId);
        break;
      default:
        console.log('Unknown error action:', action);
    }
  };

  private handleDismissError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      childFriendlyError: null
    });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // If we have a child-friendly error, show it
      if (this.state.childFriendlyError) {
        return (
          <Container maxWidth="md" sx={{ py: 4 }}>
            <ChildFriendlyErrorComponent
              error={this.state.childFriendlyError}
              onAction={this.handleErrorAction}
              onDismiss={this.handleDismissError}
            />
          </Container>
        );
      }

      // Fallback error display
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              textAlign="center"
              p={4}
              sx={{
                backgroundColor: 'error.light',
                borderRadius: 3,
                border: '2px solid',
                borderColor: 'error.main'
              }}
            >
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                🤖
              </Typography>
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'error.main' }}>
                Oops! Something went wrong!
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, maxWidth: 400 }}>
                Don't worry! Sometimes apps have little problems. Let's refresh the page and try again!
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => window.location.reload()}
                sx={{
                  fontSize: '1.1rem',
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                🔄 Refresh Page
              </Button>
            </Box>
          </motion.div>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ChildErrorBoundary;