import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Avatar,
  CircularProgress,
  Alert,
  InputAdornment,
  Fade,
  Slide,
  Zoom,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Rocket as RocketIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  CheckCircle as CheckCircleIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { SessionManager } from '../../utils/sessionManager';
import { useChildErrorHandler } from '../../hooks/useChildErrorHandler';
import ChildFriendlyErrorDisplay from '../common/ChildFriendlyErrorDisplay';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  isMobile: boolean;
  screenResolution?: string;
  language?: string;
  timezone?: string;
}

interface ChildFriendlyError {
  title: string;
  message: string;
  icon: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  recoveryOptions?: Array<{
    text: string;
    action: () => void;
    primary?: boolean;
  }>;
  autoHide?: boolean;
  duration?: number;
}

interface LoginProgress {
  step: 'idle' | 'validating' | 'authenticating' | 'loading-dashboard' | 'success';
  message: string;
  progress: number;
}

const ChildLoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    pin?: string;
  }>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const { childLogin, isLoading: authLoading, isAuthenticated, isChild } = useAuth();
  const { error, clearError, handleError, retryOperation } = useChildErrorHandler();
  const navigate = useNavigate();
  const { setUserRole } = useTheme();

  // Set the theme to child mode and capture device information
  useEffect(() => {
    setUserRole('child');
    
    // Capture device information for security logging
    const captureDeviceInfo = () => {
      const info: DeviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      setDeviceInfo(info);
    };

    captureDeviceInfo();
    
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup function to reset to parent theme when unmounting
    return () => {
      setUserRole('parent');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setUserRole]);

  // Redirect if already authenticated as child
  useEffect(() => {
    if (isAuthenticated && isChild) {
      console.log('Child already authenticated, redirecting to dashboard');
      navigate('/child-dashboard', { replace: true });
    }
  }, [isAuthenticated, isChild, navigate]);

  // Auto-hide success messages
  useEffect(() => {
    if (error?.autoHide) {
      const timer = setTimeout(() => {
        setError(null);
      }, error.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Enhanced child-friendly error message mapping
  const getChildFriendlyError = (errorCode: string, errorMessage: string, statusCode?: number): ChildFriendlyError => {
    // Handle network connectivity issues
    if (!isOnline) {
      return {
        title: 'No internet connection! 📶',
        message: 'Check your internet connection and try again when you\'re back online!',
        icon: '📶',
        severity: 'warning',
        recoveryOptions: [
          {
            text: 'Try again',
            action: () => setError(null),
            primary: true
          }
        ]
      };
    }

    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        return {
          title: 'Oops! Let\'s try again! 🔑',
          message: retryCount > 2 
            ? 'Having trouble? Ask a parent or guardian to help you with your login details!'
            : 'Your username or PIN doesn\'t match. Double-check and try again!',
          icon: '🔑',
          severity: 'warning',
          recoveryOptions: [
            {
              text: 'Clear and try again',
              action: () => {
                setUsername('');
                setPin('');
                setError(null);
                setRetryCount(0);
              },
              primary: true
            },
            ...(retryCount > 1 ? [{
              text: 'Ask for help',
              action: () => {
                alert('Ask a parent or guardian to help you log in! They can check your username and PIN.');
              }
            }] : [])
          ]
        };
      case 'ACCOUNT_LOCKED':
      case 'TOO_MANY_ATTEMPTS':
        return {
          title: 'Account needs a break! ⏰',
          message: 'Your account is taking a short break for safety. Try again in a few minutes, or ask a parent for help!',
          icon: '⏰',
          severity: 'info',
          recoveryOptions: [
            {
              text: 'Ask a parent for help',
              action: () => {
                alert('Please ask a parent or guardian to help unlock your account.');
              },
              primary: true
            }
          ]
        };
      case 'NETWORK_ERROR':
        return {
          title: 'Connection trouble! 🌐',
          message: 'We\'re having trouble connecting to our servers. Check your internet and try again!',
          icon: '🌐',
          severity: 'warning',
          recoveryOptions: [
            {
              text: 'Try again',
              action: () => setError(null),
              primary: true
            },
            {
              text: 'Check connection',
              action: () => {
                if (navigator.onLine) {
                  setError({
                    title: 'Connection looks good! ✅',
                    message: 'Your internet connection seems fine. Let\'s try logging in again!',
                    icon: '✅',
                    severity: 'success',
                    autoHide: true,
                    duration: 2000
                  });
                } else {
                  setError({
                    title: 'No internet! 📶',
                    message: 'Please check your internet connection and try again.',
                    icon: '📶',
                    severity: 'error'
                  });
                }
              }
            }
          ]
        };
      case 'SERVER_ERROR':
        return {
          title: 'Our servers are taking a break! 🔧',
          message: 'Don\'t worry, it\'s not your fault! Our team is working to fix this. Try again in a few minutes!',
          icon: '🔧',
          severity: 'error',
          recoveryOptions: [
            {
              text: 'Try again',
              action: () => setError(null),
              primary: true
            }
          ]
        };
      case 'SESSION_EXPIRED':
        return {
          title: 'Session expired! ⏰',
          message: 'Your previous session has expired. Please log in again to continue learning!',
          icon: '⏰',
          severity: 'info',
          recoveryOptions: [
            {
              text: 'Log in again',
              action: () => {
                SessionManager.clearSession();
                setError(null);
                setUsername('');
                setPin('');
              },
              primary: true
            }
          ]
        };
      default:
        // Handle HTTP status codes
        if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
          return getChildFriendlyError('SERVER_ERROR', errorMessage, statusCode);
        } else if (statusCode === 400 || statusCode === 401) {
          return getChildFriendlyError('INVALID_CREDENTIALS', errorMessage, statusCode);
        } else if (statusCode === 429) {
          return getChildFriendlyError('TOO_MANY_ATTEMPTS', errorMessage, statusCode);
        }

        return {
          title: 'Hmm, something happened! 🤔',
          message: 'Don\'t worry! Let\'s try logging in again. If this keeps happening, ask a parent for help!',
          icon: '🤔',
          severity: 'warning',
          recoveryOptions: [
            {
              text: 'Try again',
              action: () => setError(null),
              primary: true
            },
            {
              text: 'Ask for help',
              action: () => {
                alert('If you keep having trouble, ask a parent or guardian to help you!');
              }
            }
          ]
        };
    }
  };

  // Input validation
  const validateInputs = (): boolean => {
    const errors: { username?: string; pin?: string } = {};
    
    if (!username.trim()) {
      errors.username = 'Please enter your username! 📝';
    } else if (username.length < 3) {
      errors.username = 'Username needs at least 3 characters! 📏';
    }
    
    if (!pin.trim()) {
      errors.pin = 'Please enter your PIN! 🔢';
    } else if (pin.length !== 4) {
      errors.pin = 'PIN needs exactly 4 numbers! 🔢';
    } else if (!/^\d{4}$/.test(pin)) {
      errors.pin = 'PIN can only have numbers! 🔢';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateLoginProgress = (step: LoginProgress['step'], message: string, progress: number) => {
    setLoginProgress({ step, message, progress });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationErrors({});

    // Check online status first
    if (!isOnline) {
      const networkError = new Error('No internet connection');
      (networkError as any).code = 'NETWORK_ERROR';
      handleError(networkError);
      return;
    }

    // Validate inputs first
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setRetryCount(prev => prev + 1);

    try {
      await retryOperation(async () => {
        console.log('Attempting child login with:', { username, retryCount });
        
        // Use the AuthContext childLogin method with enhanced error handling
        await childLogin(username, pin);
        
        console.log('Child login successful through AuthContext');

        // Show success state
        setShowSuccess(true);

        // Reset retry count on success
        setRetryCount(0);

        // Navigate after success animation with replace to prevent back navigation
        setTimeout(() => {
          navigate('/child-dashboard', { replace: true });
        }, 1500);
      });

    } catch (err: any) {
      console.error('Child login error:', err);
      
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = 'Something went wrong';
      let statusCode = err.response?.status;
      
      if (err.response) {
        if (err.response.data?.error) {
          errorCode = err.response.data.error.code || 'UNKNOWN_ERROR';
          errorMessage = err.response.data.error.message || 'Something went wrong';
        } else if (err.response.status === 400) {
          errorCode = 'INVALID_CREDENTIALS';
          errorMessage = 'Invalid username or PIN';
        } else if (err.response.status === 401) {
          errorCode = 'INVALID_CREDENTIALS';
          errorMessage = 'Authentication failed';
        } else if (err.response.status === 429) {
          errorCode = 'TOO_MANY_ATTEMPTS';
          errorMessage = 'Too many login attempts';
        } else if (err.response.status >= 500) {
          errorCode = 'SERVER_ERROR';
          errorMessage = 'Server error - please try again';
        }
      } else if (err.request) {
        // Network error
        errorCode = 'NETWORK_ERROR';
        errorMessage = 'Network error - check your connection';
      } else {
        // Other error
        errorMessage = err.message || 'An unexpected error occurred';
      }

      setError(getChildFriendlyError(errorCode, errorMessage, statusCode));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setValidationErrors({});
    setShowSuccess(false);
    updateLoginProgress('idle', '', 0);
    setRetryCount(0);
  };

  const handleClearForm = () => {
    setUsername('');
    setPin('');
    setError(null);
    setValidationErrors({});
    setShowSuccess(false);
    updateLoginProgress('idle', '', 0);
    setRetryCount(0);
  };

  const handleInputChange = (field: 'username' | 'pin', value: string) => {
    if (field === 'username') {
      // Clean username input (remove special characters except underscore)
      const cleanValue = value.replace(/[^a-zA-Z0-9_]/g, '');
      setUsername(cleanValue);
      if (validationErrors.username) {
        setValidationErrors(prev => ({ ...prev, username: undefined }));
      }
    } else {
      // Only allow numbers for PIN and limit to 4 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setPin(numericValue);
      if (validationErrors.pin) {
        setValidationErrors(prev => ({ ...prev, pin: undefined }));
      }
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle keyboard shortcuts for better UX
  const handleKeyDown = (e: React.KeyboardEvent, field: 'username' | 'pin') => {
    // Allow Enter to move to next field or submit
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'username' && username.trim()) {
        document.getElementById('pin')?.focus();
      } else if (field === 'pin' && pin.length === 4) {
        handleSubmit(e as any);
      }
    }
    
    // Allow Escape to clear current field
    if (e.key === 'Escape') {
      if (field === 'username') {
        setUsername('');
      } else {
        setPin('');
      }
    }
  };

  // Enhanced success animation component
  const SuccessAnimation = () => (
    <Zoom in={showSuccess} timeout={500}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(76, 175, 80, 0.95)',
          borderRadius: 4,
          color: 'white',
          zIndex: 10,
        }}
      >
        <CheckCircleIcon 
          sx={{ 
            fontSize: '4rem', 
            mb: 2,
            animation: 'pulse 1s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' }
            }
          }} 
        />
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, textAlign: 'center' }}>
          Welcome back, {username}! 🎉
        </Typography>
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
          Login successful! Taking you to your dashboard...
        </Typography>
        <LinearProgress 
          sx={{ 
            width: '80%',
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.3)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'white',
              borderRadius: 3
            }
          }}
        />
      </Box>
    </Zoom>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fef7ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Slide direction="up" in={true} timeout={800}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: 'center',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <SuccessAnimation />
            
            <Fade in={!showSuccess} timeout={300}>
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4,
                  }}
                >
                  <Avatar
                    sx={{
                      m: 1,
                      width: 80,
                      height: 80,
                      bgcolor: 'secondary.main',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                      fontSize: '2.5rem',
                      animation: 'bounce 2s infinite',
                      '@keyframes bounce': {
                        '0%, 20%, 50%, 80%, 100%': {
                          transform: 'translateY(0)',
                        },
                        '40%': {
                          transform: 'translateY(-10px)',
                        },
                        '60%': {
                          transform: 'translateY(-5px)',
                        },
                      },
                    }}
                  >
                    🎓
                  </Avatar>
                  <Typography 
                    component="h1" 
                    variant="h3" 
                    fontWeight="bold" 
                    sx={{ 
                      mt: 2,
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Welcome Back! 👋
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                    Enter your username and PIN to start learning
                  </Typography>
                </Box>

                {/* Connection Status Indicator */}
                {!isOnline && (
                  <Fade in={!isOnline} timeout={300}>
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        bgcolor: 'warning.light',
                        color: 'warning.contrastText'
                      }}
                      icon={<WifiOffIcon />}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        No internet connection! 📶
                      </Typography>
                      <Typography variant="body2">
                        Please check your internet connection to log in.
                      </Typography>
                    </Alert>
                  </Fade>
                )}

                {/* Login Progress Indicator */}
                {isLoading && loginProgress.step !== 'idle' && (
                  <Fade in={isLoading} timeout={300}>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="primary" fontWeight={500}>
                          {loginProgress.message}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={loginProgress.progress} 
                        sx={{ 
                          borderRadius: 1,
                          height: 6,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 1,
                            bgcolor: 'secondary.main'
                          }
                        }}
                      />
                    </Box>
                  </Fade>
                )}

                {/* Error Messages */}
                {error && (
                  <Fade in={!!error} timeout={300}>
                    <Box sx={{ mb: 3 }}>
                      <ChildFriendlyErrorDisplay
                        error={error}
                        onDismiss={clearError}
                        showTechnicalDetails={process.env.NODE_ENV === 'development'}
                      />
                    </Box>
                  </Fade>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username 👤"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'username')}
                    error={!!validationErrors.username}
                    helperText={validationErrors.username || 'Type your username here'}
                    placeholder="Enter your username"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        fontSize: '1.2rem',
                        minHeight: '56px',
                        '& fieldset': {
                          borderWidth: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: 'secondary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'secondary.main',
                        },
                        '&.Mui-error fieldset': {
                          borderColor: 'error.main',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1.1rem',
                      },
                      '& .MuiFormHelperText-root': {
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      },
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="pin"
                    label="PIN 🔢"
                    type="password"
                    id="pin"
                    autoComplete="current-password"
                    value={pin}
                    onChange={(e) => handleInputChange('pin', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'pin')}
                    error={!!validationErrors.pin}
                    helperText={validationErrors.pin || 'Enter your 4-digit PIN (Press Enter when done!)'}
                    placeholder="••••"
                    inputProps={{ 
                      maxLength: 4,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      'aria-label': 'Enter your 4-digit PIN'
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        fontSize: '1.2rem',
                        minHeight: '56px',
                        '& fieldset': {
                          borderWidth: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: 'secondary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'secondary.main',
                        },
                        '&.Mui-error fieldset': {
                          borderColor: 'error.main',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1.1rem',
                      },
                      '& .MuiFormHelperText-root': {
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="secondary"
                      disabled={isLoading || !username.trim() || !pin.trim() || !isOnline}
                      sx={{
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover:not(:disabled)': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 15px 35px rgba(255, 107, 107, 0.4)',
                        },
                        '&:disabled': {
                          opacity: 0.6,
                        },
                      }}
                      startIcon={isLoading ? undefined : <RocketIcon />}
                    >
                      {isLoading ? (
                        <>
                          <CircularProgress
                            size={24}
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              marginLeft: '-12px',
                              color: 'white'
                            }}
                          />
                          {loginProgress.message || 'Logging in...'}
                        </>
                      ) : !isOnline ? (
                        'No Internet Connection'
                      ) : (
                        'Start Learning! 🚀'
                      )}
                    </Button>
                    
                    <Tooltip title="Clear form and start over">
                      <IconButton
                        onClick={handleClearForm}
                        disabled={isLoading}
                        sx={{
                          bgcolor: 'grey.100',
                          '&:hover': {
                            bgcolor: 'grey.200',
                          },
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Help and Status Section */}
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Connection Status */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isOnline ? 'success.light' : 'error.light',
                      color: isOnline ? 'success.contrastText' : 'error.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      fontSize: '0.9rem'
                    }}
                  >
                    {isOnline ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
                    <Typography variant="body2" fontWeight={500}>
                      {isOnline ? 'Connected to internet ✅' : 'No internet connection ❌'}
                    </Typography>
                  </Box>

                  {/* Help Section */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    <HelpIcon />
                    <Typography variant="body1" fontWeight={500}>
                      Need help? Ask a parent or guardian! 👨‍👩‍👧‍👦
                    </Typography>
                  </Box>

                  {/* Security Notice */}
                  {retryCount > 2 && (
                    <Fade in={retryCount > 2} timeout={300}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'warning.light',
                          color: 'warning.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          fontSize: '0.9rem'
                        }}
                      >
                        <SecurityIcon fontSize="small" />
                        <Typography variant="body2" fontWeight={500}>
                          Multiple attempts detected. Ask a parent for help! 🔒
                        </Typography>
                      </Box>
                    </Fade>
                  )}
                </Box>
              </Box>
            </Fade>
          </Paper>
        </Slide>
      </Container>
    </Box>
  );
};

export default ChildLoginForm;