import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import { authApi } from '../../services/api';
import { SessionManager } from '../../utils/sessionManager';

const SimpleChildLoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('Attempting child login with:', { username });

      // Clear any existing session
      SessionManager.clearSession();

      // Call the API directly
      const result = await authApi.childLogin(username, pin);
      console.log('Login successful:', result);

      // Create and save session
      const sessionData = SessionManager.createSessionFromAuthResult(result);
      SessionManager.saveSession(sessionData);

      // Navigate to dashboard
      navigate('/child-dashboard', { replace: true });

    } catch (err: any) {
      console.error('Login error:', err);

      let errorMessage = 'Login failed. Please try again.';

      if (err.response?.status === 401) {
        errorMessage = 'Invalid username or PIN. Please check and try again.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many attempts. Please wait a moment and try again.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
            Welcome Back! 👋
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Enter your username and PIN to start learning
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="pin"
              label="PIN"
              type="password"
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isLoading}
              inputProps={{ maxLength: 4 }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !username.trim() || !pin.trim()}
              sx={{
                py: 1.5,
                fontSize: '1.2rem',
                fontWeight: 700,
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Logging in...
                </>
              ) : (
                'Start Learning! 🚀'
              )}
            </Button>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Need help? Ask a parent or guardian! 👨‍👩‍👧‍👦
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SimpleChildLoginForm;