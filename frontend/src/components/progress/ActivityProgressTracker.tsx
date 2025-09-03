import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress, Card, CardContent, Chip, IconButton, Alert } from '@mui/material';
import { PlayArrow, Pause, CheckCircle, HelpOutline, Sync, Warning } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRealTimeProgress } from '../../hooks/useRealTimeProgress';
import RealTimeProgressIndicator from './RealTimeProgressIndicator';

interface ActivityProgressTrackerProps {
  activityId: string;
  childId: string;
  activityTitle: string;
  currentProgress: number; // 0-100
  totalSteps: number;
  currentStep: number;
  isActive: boolean;
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
  onPause: () => void;
  onResume: () => void;
  onHelpRequest: () => void;
  timeSpent: number; // in seconds
  estimatedTimeRemaining?: number; // in seconds
  showRealTimeIndicator?: boolean;
}

export const ActivityProgressTracker: React.FC<ActivityProgressTrackerProps> = ({
  activityId,
  childId,
  activityTitle,
  currentProgress,
  totalSteps,
  currentStep,
  isActive,
  onProgressUpdate,
  onComplete,
  onPause,
  onResume,
  onHelpRequest,
  timeSpent,
  estimatedTimeRemaining,
  showRealTimeIndicator = true
}) => {
  const theme = useTheme();
  const [localProgress, setLocalProgress] = useState(currentProgress);
  const [isCompleted, setIsCompleted] = useState(currentProgress >= 100);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [lastSyncedProgress, setLastSyncedProgress] = useState(currentProgress);

  const {
    updateProgress,
    getProgress,
    isConnected,
    isOnline,
    offlineQueueSize
  } = useRealTimeProgress(childId);

  // Sync with real-time service
  useEffect(() => {
    const syncedProgress = getProgress(activityId);
    if (syncedProgress && syncedProgress.progress !== localProgress) {
      setLocalProgress(syncedProgress.progress);
      setLastSyncedProgress(syncedProgress.progress);
      setIsCompleted(syncedProgress.progress >= 100);
      setHasUnsyncedChanges(false);
      onProgressUpdate(syncedProgress.progress);
    }
  }, [activityId, getProgress, isConnected, localProgress, onProgressUpdate]);

  useEffect(() => {
    setLocalProgress(currentProgress);
    setIsCompleted(currentProgress >= 100);
    if (Math.abs(currentProgress - lastSyncedProgress) > 1) {
      setHasUnsyncedChanges(true);
      // Auto-sync progress changes
      handleProgressSync(currentProgress);
    }
  }, [currentProgress]);

  const handleProgressSync = useCallback(async (progress: number) => {
    try {
      await updateProgress(activityId, progress, {
        timeSpent,
        isActive,
        currentStep,
        totalSteps,
        timestamp: new Date(),
        action: isActive ? 'progress_update' : 'progress_save'
      });
      setLastSyncedProgress(progress);
      setHasUnsyncedChanges(false);
    } catch (error) {
      console.error('Failed to sync progress:', error);
      setHasUnsyncedChanges(true);
    }
  }, [activityId, timeSpent, isActive, currentStep, totalSteps, updateProgress]);

  const handleManualSync = useCallback(async () => {
    if (hasUnsyncedChanges) {
      await handleProgressSync(localProgress);
    }
  }, [hasUnsyncedChanges, localProgress, handleProgressSync]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = async () => {
    if (isCompleted) return;
    
    if (isActive) {
      onPause();
      // Sync pause event
      await updateProgress(activityId, localProgress, {
        timeSpent,
        isActive: false,
        currentStep,
        totalSteps,
        timestamp: new Date(),
        action: 'pause'
      }).catch(console.error);
    } else {
      onResume();
      // Sync resume event
      await updateProgress(activityId, localProgress, {
        timeSpent,
        isActive: true,
        currentStep,
        totalSteps,
        timestamp: new Date(),
        action: 'resume'
      }).catch(console.error);
    }
  };

  const progressColor = isCompleted ? 'success' : isActive ? 'primary' : 'secondary';
  const progressVariant = isActive ? 'indeterminate' : 'determinate';

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: isActive ? `2px solid ${theme.palette.primary.main}` : 'none',
        boxShadow: isActive ? theme.shadows[4] : theme.shadows[1],
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
            {activityTitle}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {hasUnsyncedChanges && (
              <IconButton size="small" onClick={handleManualSync} color="warning">
                <Warning />
              </IconButton>
            )}
            <Chip 
              label={`${currentStep}/${totalSteps}`}
              size="small"
              color={isCompleted ? 'success' : 'primary'}
            />
            {isCompleted && (
              <CheckCircle color="success" sx={{ fontSize: 24 }} />
            )}
          </Box>
        </Box>

        <Box mb={2}>
          <LinearProgress
            variant={progressVariant}
            value={localProgress}
            color={progressColor}
            sx={{
              height: 8,
              borderRadius: 4,
              opacity: hasUnsyncedChanges ? 0.7 : 1,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                transition: 'transform 0.4s ease'
              }
            }}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="body2" color="text.secondary">
              {Math.round(localProgress)}% Complete
              {hasUnsyncedChanges && (
                <Chip 
                  label="Not synced" 
                  size="small" 
                  color="warning" 
                  variant="outlined"
                  sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Time: {formatTime(timeSpent)}
              {estimatedTimeRemaining && (
                <span> • {formatTime(estimatedTimeRemaining)} left</span>
              )}
            </Typography>
          </Box>
        </Box>

        {/* Real-time sync indicator */}
        {showRealTimeIndicator && (
          <Box mb={2}>
            <RealTimeProgressIndicator 
              childId={childId} 
              showDetails={false}
            />
          </Box>
        )}

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              onClick={handleProgressClick}
              disabled={isCompleted}
              color="primary"
              size="large"
              sx={{
                backgroundColor: isActive ? theme.palette.primary.light : 'transparent',
                '&:hover': {
                  backgroundColor: isActive ? theme.palette.primary.main : theme.palette.action.hover
                }
              }}
            >
              {isActive ? <Pause /> : <PlayArrow />}
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {isCompleted ? 'Completed!' : isActive ? 'In Progress' : 'Paused'}
            </Typography>
          </Box>

          <IconButton
            onClick={onHelpRequest}
            color="secondary"
            size="medium"
            sx={{
              '&:hover': {
                backgroundColor: theme.palette.secondary.light
              }
            }}
          >
            <HelpOutline />
          </IconButton>
        </Box>

        {hasUnsyncedChanges && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Progress changes haven't been synced yet. 
            {isOnline ? ' They will sync automatically.' : ' Will sync when back online.'}
          </Alert>
        )}

        {!isOnline && offlineQueueSize > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You're offline. {offlineQueueSize} progress updates are queued for sync.
          </Alert>
        )}

        {isCompleted && (
          <Box 
            mt={2} 
            p={2} 
            sx={{ 
              backgroundColor: theme.palette.success.light,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" color="success.dark" sx={{ fontWeight: 600 }}>
              🎉 Great job! You completed this activity!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityProgressTracker;