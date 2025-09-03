import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  Container,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth';
import { healthCheck, oauthApi } from '../../services/api';
import SocialLoginButtons from './SocialLoginButtons';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Test backend connection first
      try {
        await healthCheck();
        console.log('Backend is reachable');
      } catch (healthError) {
        console.error('Backend health check failed:', healthError);
        toast.error('Cannot connect to server. Please check if the backend is running.');
        return;
      }
      
      await login(data as LoginCredentials);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'instagram') => {
    try {
      setSocialLoading(provider);
      
      // Test backend connection first
      try {
        await healthCheck();
      } catch (healthError) {
        console.error('Backend health check failed:', healthError);
        toast.error('Cannot connect to server. Please check if the backend is running.');
        return;
      }

      // Initiate OAuth flow
      const { authUrl } = await oauthApi.initiateAuth(provider, false);
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Social login error:', error);
      toast.error(error.response?.data?.message || `Failed to sign in with ${provider}`);
    } finally {
      setSocialLoading(null);
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
            ? '#f8fafc'
            : '#0f172a',
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Avatar
              sx={{
                m: 1,
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              <LoginIcon fontSize="large" />
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Sign in to your AI Study Planner account
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  autoComplete="email"
                  autoFocus
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot your password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting || isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                position: 'relative',
                fontWeight: 600,
              }}
            >
              {isSubmitting || isLoading ? (
                <>
                  <CircularProgress
                    size={24}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      marginLeft: '-12px',
                    }}
                  />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <SocialLoginButtons
              onSocialLogin={handleSocialLogin}
              isLoading={!!socialLoading}
              loadingProvider={socialLoading || undefined}
              disabled={isSubmitting || isLoading}
            />

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" fontWeight="bold">
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginForm;