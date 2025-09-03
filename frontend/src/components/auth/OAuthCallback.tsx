import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  Container,
  Paper,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { oauthApi } from '../../services/api';
import AccountConflictResolver from './AccountConflictResolver';

interface CallbackState {
  status: 'loading' | 'success' | 'error' | 'linking' | 'conflict';
  message: string;
  provider?: string;
  error?: string;
  conflictData?: any;
}

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processing authentication...',
  });
  const [conflictResolving, setConflictResolving] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const provider = searchParams.get('provider') || 'unknown';

        // Handle OAuth errors
        if (error) {
          let errorMessage = 'Authentication failed';
          switch (error) {
            case 'access_denied':
              errorMessage = 'Access was denied. Please try again.';
              break;
            case 'invalid_request':
              errorMessage = 'Invalid request. Please try again.';
              break;
            case 'server_error':
              errorMessage = 'Server error occurred. Please try again later.';
              break;
            default:
              errorMessage = `Authentication error: ${error}`;
          }
          
          setCallbackState({
            status: 'error',
            message: errorMessage,
            provider,
            error,
          });
          return;
        }

        if (!code) {
          setCallbackState({
            status: 'error',
            message: 'No authorization code received',
            provider,
            error: 'missing_code',
          });
          return;
        }

        // Determine if this is account linking or new login
        const isLinking = user && state?.includes('link');

        setCallbackState({
          status: isLinking ? 'linking' : 'loading',
          message: isLinking 
            ? `Linking your ${provider} account...`
            : `Completing ${provider} authentication...`,
          provider,
        });

        if (isLinking) {
          // Handle account linking
          await oauthApi.linkAccount(provider as any, code, state);
          setCallbackState({
            status: 'success',
            message: `Successfully linked your ${provider} account!`,
            provider,
          });
          
          // Redirect to settings after a delay
          setTimeout(() => {
            navigate('/settings?tab=accounts', { replace: true });
          }, 2000);
        } else {
          // Handle OAuth login
          const authResult = await oauthApi.callback(provider as any, code, state);
          
          // Use the auth context to set the user
          await login(authResult);
          
          setCallbackState({
            status: 'success',
            message: `Successfully signed in with ${provider}!`,
            provider,
          });
          
          // Redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        
        // Handle account conflict
        if (error.response?.data?.code === 'ACCOUNT_CONFLICT') {
          setCallbackState({
            status: 'conflict',
            message: 'Account conflict detected',
            provider: searchParams.get('provider') || 'unknown',
            conflictData: error.response.data.conflictData,
          });
          return;
        }
        
        let errorMessage = 'Authentication failed';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setCallbackState({
          status: 'error',
          message: errorMessage,
          provider: searchParams.get('provider') || 'unknown',
          error: error.response?.data?.code || 'unknown_error',
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, login, user]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  const handleGoToSettings = () => {
    navigate('/settings?tab=accounts', { replace: true });
  };

  const handleConflictResolve = async (resolution: 'merge' | 'create_new' | 'cancel') => {
    if (resolution === 'cancel') {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setConflictResolving(true);
      
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const provider = searchParams.get('provider');

      if (!code || !provider) {
        throw new Error('Missing required parameters');
      }

      // Call the appropriate API based on resolution
      if (resolution === 'merge') {
        // Link the account to existing user
        await oauthApi.linkAccount(provider as any, code, state || undefined);
        
        setCallbackState({
          status: 'success',
          message: `Successfully linked your ${provider} account!`,
          provider,
        });
        
        setTimeout(() => {
          navigate('/settings?tab=accounts', { replace: true });
        }, 2000);
      } else {
        // Create new account
        const authResult = await oauthApi.callback(provider as any, code, state, { forceNewAccount: true });
        await login(authResult);
        
        setCallbackState({
          status: 'success',
          message: `Successfully created new account with ${provider}!`,
          provider,
        });
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    } catch (error: any) {
      console.error('Conflict resolution error:', error);
      setCallbackState({
        status: 'error',
        message: error.response?.data?.message || 'Failed to resolve account conflict',
        provider: searchParams.get('provider') || 'unknown',
        error: error.response?.data?.code || 'resolution_failed',
      });
    } finally {
      setConflictResolving(false);
    }
  };

  const renderContent = () => {
    switch (callbackState.status) {
      case 'loading':
      case 'linking':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              {callbackState.message}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we complete the process...
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle
              sx={{
                fontSize: 60,
                color: 'success.main',
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom>
              {callbackState.message}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Redirecting you now...
            </Typography>
            {callbackState.status === 'success' && user && (
              <Button
                variant="outlined"
                onClick={handleGoToSettings}
                sx={{ mt: 2 }}
              >
                Go to Account Settings
              </Button>
            )}
          </Box>
        );

      case 'conflict':
        return (
          <AccountConflictResolver
            open={true}
            onClose={() => navigate('/login', { replace: true })}
            conflictData={callbackState.conflictData}
            onResolve={handleConflictResolve}
            loading={conflictResolving}
          />
        );

      case 'error':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <ErrorIcon
              sx={{
                fontSize: 60,
                color: 'error.main',
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom color="error">
              Authentication Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {callbackState.message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleRetry}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  // Handle conflict case separately since it renders a modal
  if (callbackState.status === 'conflict') {
    return renderContent();
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: (theme) =>
              theme.palette.mode === 'light'
                ? '0 20px 40px rgba(0, 0, 0, 0.2)'
                : '0 20px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {renderContent()}
        </Paper>
      </Container>
    </Box>
  );
};

export default OAuthCallback;