import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material';

interface ActivityNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  canProceed: boolean;
}

const ActivityNavigation: React.FC<ActivityNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  canProceed
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mt: 4
    }}>
      <Button
        onClick={onPrevious}
        disabled={isFirstStep}
        variant="outlined"
        color="primary"
        startIcon={<ArrowBack />}
        sx={{
          borderRadius: 4,
          px: 3,
          py: 1,
          opacity: isFirstStep ? 0.5 : 1
        }}
      >
        Previous
      </Button>
      
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
        Step {currentStep + 1} of {totalSteps}
      </Typography>
      
      <Button
        onClick={onNext}
        disabled={!canProceed}
        variant="contained"
        color="primary"
        endIcon={isLastStep ? <Check /> : <ArrowForward />}
        sx={{
          borderRadius: 4,
          px: 3,
          py: 1,
          opacity: !canProceed ? 0.7 : 1
        }}
      >
        {isLastStep ? 'Complete' : 'Next'}
      </Button>
    </Box>
  );
};

export default ActivityNavigation;