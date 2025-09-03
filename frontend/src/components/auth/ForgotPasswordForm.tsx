import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  Container,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data);
      setIsSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to send reset email';
      toast.error(errorMessage);
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
                width: 60,
                height: 60,
                bgcolor: isSubmitted ? 'success.main' : 'primary.main',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              {isSubmitted ? <SendIcon fontSize="large" /> : <EmailIcon fontSize="large" />}
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
              {isSubmitted ? 'Check your email' : 'Forgot your password?'}
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              {isSubmitted
                ? `We've sent password reset instructions to ${getValues('email')}`
                : "Enter your email address and we'll send you instructions to reset your password"}
            </Typography>
          </Box>

          {isSubmitted ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Password reset instructions sent successfully!
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Didn't receive the email? Check your spam folder or{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setIsSubmitted(false)}
                  sx={{ fontWeight: 'bold' }}
                >
                  try again
                </Link>
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 2 }}
              >
                Back to sign in
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                    InputProps={{
                      startAdornment: (
                        <EmailIcon color="action" sx={{ mr: 1 }} fontSize="small" />
                      ),
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  position: 'relative',
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress
                      size={24}
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        marginLeft: '-12px',
                      }}
                    />
                    Sending...
                  </>
                ) : (
                  'Send reset instructions'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  startIcon={<ArrowBackIcon />}
                  color="primary"
                >
                  Back to sign in
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordForm;