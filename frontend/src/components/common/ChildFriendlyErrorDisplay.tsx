import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import { AuthError } from '../../utils/childErrorHandler';

interface ChildFriendlyErrorDisplayProps {
  error: AuthError;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
  onRetry?: () => void;
  onGoHome?: () => void;
}

const ChildFriendlyErrorDisplay: React.FC<ChildFriendlyErrorDisplayProps> = ({
  error,
  onDismiss,
  showTechnicalDetails = false,
  onRetry,
  onGoHome
}) => {
  const theme = useTheme();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return 'ℹ️';
      case 'low':
        return '✅';
      default:
        return '🤔';
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 2,
        borderRadius: 3,
        boxShadow: theme.shadows[4],
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with severity indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ mr: 1 }}>
            {getSeverityIcon(error.severity)}
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Oops! Something happened
            </Typography>
            <Chip
              label={error.severity.toUpperCase()}
              color={getSeverityColor(error.severity) as any}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Child-friendly message */}
        <Alert 
          severity={getSeverityColor(error.severity) as any}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '1.1rem',
              fontWeight: 500
            }
          }}
        >
          {error.userFriendlyMessage}
        </Alert>

        {/* Recovery actions */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            What would you like to do?
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {onRetry && (
              <Button
                variant="contained"
                color="primary"
                onClick={onRetry}
                startIcon={<span>🔄</span>}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  py: 1
                }}
              >
                Try Again
              </Button>
            )}
            {onGoHome && (
              <Button
                variant="outlined"
                color="inherit"
                onClick={onGoHome}
                startIcon={<span>🏠</span>}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  py: 1
                }}
              >
                Go to Login
              </Button>
            )}
            {error.recoveryActions && error.recoveryActions.length > 0 && error.recoveryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.primary ? 'contained' : 'outlined'}
                color={action.primary ? 'primary' : 'inherit'}
                onClick={action.action}
                startIcon={action.icon ? <span>{action.icon}</span> : undefined}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  py: 1
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Dismiss button */}
        {onDismiss && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="text"
              onClick={onDismiss}
              sx={{
                textTransform: 'none',
                color: 'text.secondary'
              }}
            >
              Close
            </Button>
          </Box>
        )}

        {/* Technical details (for debugging) */}
        {showTechnicalDetails && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Technical Details:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              Code: {error.code}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              Message: {error.message}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChildFriendlyErrorDisplay;