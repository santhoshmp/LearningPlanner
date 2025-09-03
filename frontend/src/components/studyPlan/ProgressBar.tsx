import React from 'react';
import { Box, Typography, LinearProgress, Grid, Paper } from '@mui/material';
import { AccessTime, CheckCircle } from '@mui/icons-material';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  timeSpent: number; // in seconds
  estimatedDuration: number; // in seconds
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep, 
  totalSteps, 
  timeSpent, 
  estimatedDuration 
}) => {
  const progressPercentage = Math.min(100, Math.round((currentStep / totalSteps) * 100));
  const timePercentage = Math.min(100, Math.round((timeSpent / estimatedDuration) * 100));
  
  // Format time spent as mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Step Progress */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircle color="primary" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Progress
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {currentStep} of {totalSteps} steps
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                }
              }} 
            />
          </Paper>
        </Grid>
        
        {/* Time Progress */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccessTime color="primary" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Time
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {formatTime(timeSpent)} / {formatTime(estimatedDuration)}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={timePercentage} 
              color={timePercentage > 100 ? "error" : "success"}
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                }
              }} 
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProgressBar;