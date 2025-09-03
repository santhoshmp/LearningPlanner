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
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../types/auth';
import { oauthApi } from '../../services/api';
import SocialLoginButtons from './SocialLoginButtons';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must not exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must not exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{ firstName: string, email: string } | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { register: registerUser, login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      
      // Register the user
      await registerUser(registerData as RegisterData);
      
      // Auto-login after successful registration
      try {
        await login({
          email: data.email,
          password: data.password
        });
        
        // Navigate to dashboard immediately after successful login
        navigate('/dashboard');
      } catch (loginError) {
        console.error('Auto-login failed:', loginError);
        
        // Show success message and redirect to login if auto-login fails
        setRegisteredUser({
          firstName: data.firstName,
          email: data.email
        });
        setRegistrationSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'instagram') => {
    try {
      setSocialLoading(provider);
      
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

  // If registration is successful, show success message
  if (registrationSuccess && registeredUser) {
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
        <Container maxWidth="xs">
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Avatar
              sx={{
                m: '0 auto',
                mb: 3,
                width: 80,
                height: 80,
                bgcolor: 'success.main',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              <CheckCircleIcon fontSize="large" />
            </Avatar>
            
            <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
              Registration Successful!
            </Typography>
            
            <Alert severity="success" sx={{ my: 2 }}>
              <AlertTitle>Welcome, {registeredUser.firstName}!</AlertTitle>
              Your account has been created successfully.
            </Alert>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Auto-login failed. You'll be redirected to the login page in a few seconds...
            </Typography>
            
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              Go to Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
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
                m: '0 auto 16px',
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
              }}
            >
              <PersonAddIcon fontSize="medium" />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight="600" gutterBottom>
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
              Join AI Study Planner and start creating personalized learning experiences
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  id="firstName"
                  label="First Name *"
                  autoComplete="given-name"
                  autoFocus
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name *"
                  autoComplete="family-name"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  id="email"
                  label="Email Address *"
                  autoComplete="email"
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
                  required
                  fullWidth
                  label="Password *"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 2 }}
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

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  label="Confirm Password *"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  sx={{ mb: 3 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleToggleConfirmPassword}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting || isLoading}
              sx={{
                py: 1.5,
                position: 'relative',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '16px',
                mb: 2,
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <SocialLoginButtons
              onSocialLogin={handleSocialLogin}
              isLoading={!!socialLoading}
              loadingProvider={socialLoading || undefined}
              disabled={isSubmitting || isLoading}
            />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterForm;