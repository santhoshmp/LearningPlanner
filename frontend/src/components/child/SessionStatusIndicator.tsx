import React, { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  Popover,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Info as InfoIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useChildSessionMonitoring } from '../../hooks/useChildSessionMonitoring';

const SessionStatusIndicator: React.FC = () => {
  const {
    sessionInfo,
    formatDuration,
    updateActivity
  } = useChildSessionMonitoring();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Calculate session progress (assuming 20 minutes max)
  const maxSessionTime = 20 * 60 * 1000; // 20 minutes in milliseconds
  const progress = sessionInfo ? Math.min((sessionInfo.duration / maxSessionTime) * 100, 100) : 0;

  // Determine status color based on session time
  const getStatusColor = () => {
    if (!sessionInfo?.isActive) return 'default';
    if (progress < 50) return 'success';
    if (progress < 80) return 'warning';
    return 'error';
  };

  // Get friendly time remaining message
  const getTimeMessage = () => {
    if (!sessionInfo?.isActive) return 'Not logged in';
    
    const remaining = maxSessionTime - sessionInfo.duration;
    if (remaining <= 0) return 'Session will expire soon';
    
    const remainingMinutes = Math.floor(remaining / (1000 * 60));
    if (remainingMinutes <= 5) return `${remainingMinutes} minutes left`;
    if (remainingMinutes <= 10) return 'Less than 10 minutes left';
    return 'Plenty of time left';
  };

  if (!sessionInfo) {
    return null;
  }

  return (
    <Box>
      <Tooltip title="Click to see session details">
        <Chip
          icon={<TimeIcon />}
          label={sessionInfo.isActive ? formatDuration(sessionInfo.duration) : 'Offline'}
          color={getStatusColor() as any}
          onClick={handleClick}
          size="small"
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Card sx={{ minWidth: 280, maxWidth: 320 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <SecurityIcon color="primary" />
              <Typography variant="h6">
                Your Learning Session
              </Typography>
            </Box>

            {sessionInfo.isActive ? (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    Session Time:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDuration(sessionInfo.duration)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={getStatusColor() as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {getTimeMessage()}
                  </Typography>
                </Box>

                {sessionInfo.loginTime && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Started: {new Date(sessionInfo.loginTime).toLocaleTimeString()}
                  </Typography>
                )}

                {progress > 80 && (
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor: 'warning.light',
                      borderRadius: 1,
                      mt: 1
                    }}
                  >
                    <Typography variant="body2" color="warning.dark">
                      ⏰ Your session will end soon. Save your progress!
                    </Typography>
                  </Box>
                )}

                {progress >= 100 && (
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor: 'error.light',
                      borderRadius: 1,
                      mt: 1
                    }}
                  >
                    <Typography variant="body2" color="error.dark">
                      🚨 Session time is up! You'll be logged out soon.
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  You're not currently logged in to a learning session.
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                mt: 2,
                pt: 1,
                borderTop: 1,
                borderColor: 'divider'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                💡 Tip: Stay active to keep your session going!
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Popover>
    </Box>
  );
};

export default SessionStatusIndicator;