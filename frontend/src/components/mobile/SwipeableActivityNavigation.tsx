/**
 * Swipeable navigation component for activities
 * Optimized for tablet usage in educational settings
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Fade,
  styled,
  alpha
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  SwipeLeft,
  SwipeRight,
  TouchApp
} from '@mui/icons-material';
import { useSwipeGestures, useMobileOptimizations } from '../../hooks/useMobileOptimizations';
import TouchFriendlyButton from './TouchFriendlyButton';

interface Activity {
  id: string;
  title: string;
  description: string;
  progress: number;
  completed: boolean;
  type: 'reading' | 'math' | 'science' | 'art' | 'game';
}

interface SwipeableActivityNavigationProps {
  activities: Activity[];
  currentIndex: number;
  onActivityChange: (index: number) => void;
  onActivityStart: (activity: Activity) => void;
  showSwipeHints?: boolean;
}

const NavigationContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  borderRadius: theme.spacing(2),
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[4]
}));

const ActivityCard = styled(Card)<{ isActive: boolean; offset: number }>(
  ({ theme, isActive, offset }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: `translateX(${offset * 100}%)`,
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut
    }),
    opacity: isActive ? 1 : 0.7,
    scale: isActive ? 1 : 0.95,
    zIndex: isActive ? 2 : 1,
    cursor: 'pointer',
    userSelect: 'none'
  })
);

const SwipeHint = styled(Box)<{ direction: 'left' | 'right'; show: boolean }>(
  ({ theme, direction, show }) => ({
    position: 'absolute',
    top: '50%',
    [direction]: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 2),
    background: alpha(theme.palette.primary.main, 0.9),
    color: theme.palette.primary.contrastText,
    borderRadius: theme.spacing(3),
    opacity: show ? 1 : 0,
    transition: theme.transitions.create(['opacity', 'transform'], {
      duration: theme.transitions.duration.short
    }),
    transform: `translateY(-50%) translateX(${show ? 0 : direction === 'left' ? -20 : 20}px)`,
    zIndex: 10,
    pointerEvents: 'none'
  })
);

const NavigationControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: theme.spacing(2),
  zIndex: 5
}));

const ProgressIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 5
}));

const ActivityTypeIcon = ({ type }: { type: Activity['type'] }) => {
  const icons = {
    reading: '📚',
    math: '🔢',
    science: '🔬',
    art: '🎨',
    game: '🎮'
  };
  
  return <span style={{ fontSize: '2rem' }}>{icons[type]}</span>;
};

export const SwipeableActivityNavigation: React.FC<SwipeableActivityNavigationProps> = ({
  activities,
  currentIndex,
  onActivityChange,
  onActivityStart,
  showSwipeHints = true
}) => {
  const [showHints, setShowHints] = useState(showSwipeHints);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isTablet, animationConfig } = useMobileOptimizations();

  const canGoNext = currentIndex < activities.length - 1;
  const canGoPrevious = currentIndex > 0;

  const handleNext = useCallback(() => {
    if (canGoNext && !isTransitioning) {
      setIsTransitioning(true);
      onActivityChange(currentIndex + 1);
      setTimeout(() => setIsTransitioning(false), animationConfig.duration);
    }
  }, [canGoNext, isTransitioning, currentIndex, onActivityChange, animationConfig.duration]);

  const handlePrevious = useCallback(() => {
    if (canGoPrevious && !isTransitioning) {
      setIsTransitioning(true);
      onActivityChange(currentIndex - 1);
      setTimeout(() => setIsTransitioning(false), animationConfig.duration);
    }
  }, [canGoPrevious, isTransitioning, currentIndex, onActivityChange, animationConfig.duration]);

  const { attachSwipeHandler } = useSwipeGestures({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious
  });

  const handleActivityStart = useCallback(() => {
    const currentActivity = activities[currentIndex];
    if (currentActivity) {
      onActivityStart(currentActivity);
    }
  }, [activities, currentIndex, onActivityStart]);

  // Hide hints after first interaction
  React.useEffect(() => {
    if (showHints) {
      const timer = setTimeout(() => setShowHints(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHints]);

  const currentActivity = activities[currentIndex];

  if (!currentActivity) {
    return null;
  }

  return (
    <NavigationContainer ref={attachSwipeHandler}>
      {/* Progress Indicator */}
      <ProgressIndicator>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="caption" color="text.secondary">
            Activity {currentIndex + 1} of {activities.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(currentActivity.progress)}% Complete
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={currentActivity.progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha('#000', 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4
            }
          }}
        />
      </ProgressIndicator>

      {/* Activity Cards */}
      {activities.map((activity, index) => {
        const offset = index - currentIndex;
        const isActive = index === currentIndex;
        
        return (
          <ActivityCard
            key={activity.id}
            isActive={isActive}
            offset={offset}
            onClick={isActive ? handleActivityStart : undefined}
          >
            <CardContent
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                p: 4
              }}
            >
              <ActivityTypeIcon type={activity.type} />
              
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mt: 2
                }}
              >
                {activity.title}
              </Typography>
              
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                  maxWidth: '80%',
                  mb: 3
                }}
              >
                {activity.description}
              </Typography>

              {activity.completed && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'success.main',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ Completed!
                </Box>
              )}

              {isActive && (
                <TouchFriendlyButton
                  variant="contained"
                  size="large"
                  onClick={handleActivityStart}
                  sx={{ mt: 2 }}
                >
                  <TouchApp sx={{ mr: 1 }} />
                  {activity.completed ? 'Review Activity' : 'Start Activity'}
                </TouchFriendlyButton>
              )}
            </CardContent>
          </ActivityCard>
        );
      })}

      {/* Swipe Hints */}
      {isTablet && showHints && (
        <>
          <Fade in={canGoPrevious}>
            <SwipeHint direction="left" show={canGoPrevious}>
              <SwipeRight />
              <Typography variant="caption">Swipe right for previous</Typography>
            </SwipeHint>
          </Fade>
          
          <Fade in={canGoNext}>
            <SwipeHint direction="right" show={canGoNext}>
              <Typography variant="caption">Swipe left for next</Typography>
              <SwipeLeft />
            </SwipeHint>
          </Fade>
        </>
      )}

      {/* Navigation Controls */}
      <NavigationControls>
        <IconButton
          onClick={handlePrevious}
          disabled={!canGoPrevious || isTransitioning}
          sx={{
            minWidth: 56,
            minHeight: 56,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'background.paper',
              boxShadow: 4
            }
          }}
        >
          <ChevronLeft fontSize="large" />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            px: 2
          }}
        >
          {activities.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? 'primary.main' : 'grey.300',
                transition: 'background-color 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => !isTransitioning && onActivityChange(index)}
            />
          ))}
        </Box>

        <IconButton
          onClick={handleNext}
          disabled={!canGoNext || isTransitioning}
          sx={{
            minWidth: 56,
            minHeight: 56,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'background.paper',
              boxShadow: 4
            }
          }}
        >
          <ChevronRight fontSize="large" />
        </IconButton>
      </NavigationControls>
    </NavigationContainer>
  );
};

export default SwipeableActivityNavigation;