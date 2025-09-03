import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  Avatar,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const result = await authApi.verifyEmail({ token });
        setStatus('success');
        setMessage(result.message);
        toast.success('Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Email verified successfully! You can now sign in.' }
          });
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        const errorMessage = error.response?.data?.error?.message || 'Email verification failed';
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return <CircularProgress size={60} />;
      case 'success':
        return (
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: 'success.main',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            }}
          >
            <CheckCircleIcon fontSize="large" />
          </Avatar>
        );
      case 'error':
        return (
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: 'error.main',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            }}
          >
            <ErrorIcon fontSize="large" />
          </Avatar>
        );
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying your email...';
      case 'success':
        return 'Email verified successfully!';
      case 'error':
        return 'Verification failed';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'verifying':
        return 'Please wait while we verify your email address.';
      case 'success':
        return 'Your email has been verified. You will be redirected to the login page shortly.';
      case 'error':
        return message || 'There was an error verifying your email address.';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
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
            textAlign: 'center',
            boxShadow: (theme) =>
              theme.palette.mode === 'light'
                ? '0 20px 40px rgba(0, 0, 0, 0.2)'
                : '0 20px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            {getIcon()}
            <Typography component="h1" variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
              {getTitle()}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {getDescription()}
            </Typography>
            
            {status === 'success' && (
              <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
                Redirecting to login page in 3 seconds...
              </Alert>
            )}
          </Box>

          {status === 'error' && (
            <Stack spacing={2} sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Need help? Try these options:
              </Typography>
              
              <Button
                component={RouterLink}
                to="/register"
                variant="outlined"
                startIcon={<EmailIcon />}
                fullWidth
              >
                Request new verification email
              </Button>
              
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                startIcon={<ArrowBackIcon />}
                fullWidth
              >
                Back to sign in
              </Button>
            </Stack>
          )}

          {status !== 'error' && (
            <Button
              component={RouterLink}
              to="/login"
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 2 }}
            >
              Back to sign in
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailVerification;