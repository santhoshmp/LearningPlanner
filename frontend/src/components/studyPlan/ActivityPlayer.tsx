import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container, 
  IconButton, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Fade
} from '@mui/material';
import { ArrowBack, Pause, PlayArrow, Help } from '@mui/icons-material';
import { StudyActivity } from '../../types/studyPlan';
import { ActivityProgress, ActivityState, ActivitySubmission } from '../../types/activity';
import { activityApi, studyPlanApi, claudeApi } from '../../services/api';
import { gamificationService } from '../../services/gamificationService';
import { CelebrationConfig } from '../../types/gamification';
import ProgressBar from './ProgressBar';
import ActivityContent from './ActivityContent';
import ActivityNavigation from './ActivityNavigation';
import HelpButton from './HelpButton';
import ActivityCompletionModal from './ActivityCompletionModal';
import CelebrationAnimation from './CelebrationAnimation';
import { useTheme } from '../../theme/ThemeContext';

const ActivityPlayer: React.FC = () => {
  const { planId, activityId } = useParams<{ planId: string; activityId?: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<{
    id: string;
    childId: string;
    childProfile?: {
      id: string;
      name: string;
      age: number;
    };
    activities: StudyActivity[];
  } | null>(null);
  const [currentActivity, setCurrentActivity] = useState<StudyActivity | null>(null);
  const [activityProgress, setActivityProgress] = useState<ActivityProgress | null>(null);
  const [activityState, setActivityState] = useState<ActivityState>({
    currentStep: 0,
    totalSteps: 0,
    answers: {},
    startTime: Date.now(),
    elapsedTime: 0,
    isPaused: false
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);
  const [celebration, setCelebration] = useState<CelebrationConfig | null>(null);

  // Timer for tracking time spent
  useEffect(() => {
    let interval: number | null = null;
    
    if (!activityState.isPaused && currentActivity) {
      interval = window.setInterval(() => {
        setActivityState(prev => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activityState.isPaused, currentActivity]);

  // Load plan and activity data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!planId) {
          throw new Error('Plan ID is required');
        }
        
        // Load the study plan
        const planData = await studyPlanApi.getPlan(planId);
        setPlan(planData);
        
        // Determine which activity to load
        let targetActivityId = activityId;
        if (!targetActivityId && planData.activities.length > 0) {
          // If no activity ID is provided, load the first activity or the first incomplete one
          const incompleteActivity = planData.activities.find((activity: StudyActivity) => {
            // This would require backend integration to check completion status
            // For now, just load the first activity
            return true;
          });
          
          targetActivityId = incompleteActivity?.id || planData.activities[0].id;
          navigate(`/child/plan/${planId}/activity/${targetActivityId}`, { replace: true });
        }
        
        if (targetActivityId) {
          // Load the activity
          const activity = planData.activities.find((a: StudyActivity) => a.id === targetActivityId);
          if (!activity) {
            throw new Error('Activity not found');
          }
          
          setCurrentActivity(activity);
          
          // Try to load existing progress
          try {
            const progress = await activityApi.getActivityProgress(targetActivityId);
            setActivityProgress(progress);
            
            // If activity was in progress, restore state
            if (progress.status === 'in_progress') {
              // This would require storing and retrieving the actual state from the backend
              // For now, just set the start time based on the progress
              setActivityState(prev => ({
                ...prev,
                startTime: Date.now() - (progress.timeSpent * 1000),
                elapsedTime: progress.timeSpent
              }));
            } else if (progress.status === 'not_started') {
              // Start the activity
              await activityApi.startActivity(targetActivityId);
            }
          } catch (err) {
            // If no progress exists, create a new progress record
            await activityApi.startActivity(targetActivityId);
          }
          
          // Set total steps based on activity content
          setActivityState(prev => ({
            ...prev,
            totalSteps: activity.content.type === 'quiz' 
              ? activity.content.data.questions.length 
              : 1
          }));
        }
      } catch (err: any) {
        console.error('Failed to load activity:', err);
        setError(err.message || 'Failed to load activity');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [planId, activityId, navigate]);

  // Save progress periodically
  useEffect(() => {
    const saveProgressInterval = window.setInterval(() => {
      if (currentActivity && activityProgress && !activityState.isPaused) {
        saveProgress();
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(saveProgressInterval);
  }, [currentActivity, activityProgress, activityState]);

  // Save progress when component unmounts
  useEffect(() => {
    return () => {
      if (currentActivity && activityProgress) {
        saveProgress();
      }
    };
  }, [currentActivity, activityProgress]);

  const saveProgress = useCallback(async () => {
    if (!currentActivity || !activityProgress) return;
    
    try {
      await activityApi.updateProgress(currentActivity.id, {
        status: 'in_progress',
        timeSpent: activityState.elapsedTime,
        lastInteractionAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  }, [currentActivity, activityProgress, activityState.elapsedTime]);

  const handleAnswerChange = (stepIndex: number, answer: any) => {
    setActivityState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [stepIndex]: answer
      }
    }));
  };

  const handleNextStep = () => {
    if (activityState.currentStep < activityState.totalSteps - 1) {
      setActivityState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    } else {
      handleActivityCompletion();
    }
  };

  const handlePrevStep = () => {
    if (activityState.currentStep > 0) {
      setActivityState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const handlePause = () => {
    setActivityState(prev => ({
      ...prev,
      isPaused: true
    }));
    saveProgress();
  };

  const handleResume = () => {
    setActivityState(prev => ({
      ...prev,
      isPaused: false
    }));
  };

  const handleRequestHelp = async (question: string) => {
    if (!currentActivity || !plan) return Promise.reject(new Error('No activity loaded'));
    
    try {
      // Use the Claude AI service for help requests
      const helpRequest = await claudeApi.requestHelp({
        question,
        activityId: currentActivity.id,
        childAge: plan.childProfile?.age || 10, // Default to 10 if age is not available
        activityContext: {
          title: currentActivity.title,
          subject: currentActivity.subject || 'general',
          currentStep: activityState.currentStep,
          currentContent: currentActivity.content?.data?.[activityState.currentStep]
        }
      });
      return helpRequest;
    } catch (err) {
      console.error('Failed to request help from Claude:', err);
      throw err;
    }
  };

  const handleActivityCompletion = async () => {
    if (!currentActivity) return;
    
    try {
      const submission: ActivitySubmission = {
        activityId: currentActivity.id,
        answers: activityState.answers,
        timeSpent: activityState.elapsedTime,
        helpRequests: [] // In a real implementation, we would track help requests
      };
      
      const result = await activityApi.submitActivity(currentActivity.id, submission);
      setCompletionResult(result);
      
      // Check if any achievements were earned
      if (result.achievements && result.achievements.length > 0) {
        // Find the most significant achievement (milestone > badge > streak)
        const significantAchievement = result.achievements.find(a => a.type === 'milestone') || 
                                      result.achievements.find(a => a.type === 'badge') || 
                                      result.achievements[0];
        
        // Get celebration config for the achievement
        const celebrationConfig = gamificationService.getCelebrationConfig(significantAchievement);
        setCelebration(celebrationConfig);
        
        // Show celebration animation before completion modal
        setTimeout(() => {
          setCelebration(null);
          setShowCompletionModal(true);
        }, 3000); // Show celebration for 3 seconds
      } else {
        // No achievements, show completion modal directly
        setShowCompletionModal(true);
      }
    } catch (err) {
      console.error('Failed to submit activity:', err);
    }
  };

  const handleContinue = () => {
    setShowCompletionModal(false);
    
    // Navigate to the next activity if available
    if (completionResult?.nextActivityId) {
      navigate(`/child/plan/${planId}/activity/${completionResult.nextActivityId}`);
    } else {
      // Otherwise, go back to the dashboard
      navigate('/child/dashboard');
    }
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: theme.palette.primary.light
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
            Loading your activity...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" sx={{ fontSize: '4rem', mb: 2 }}>😕</Typography>
            <Typography variant="h4" gutterBottom>Oops! Something went wrong</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>{error}</Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/child/dashboard')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!currentActivity) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="warning.main" sx={{ fontSize: '4rem', mb: 2 }}>🔍</Typography>
            <Typography variant="h4" gutterBottom>Activity Not Found</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              We couldn't find the activity you're looking for.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/child/dashboard')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper 
        elevation={4} 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          borderRadius: { xs: 0, sm: '0 0 24px 24px' }
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ py: 2, px: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                color="inherit" 
                onClick={() => navigate('/child/dashboard')}
                sx={{ mr: 1 }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                {currentActivity.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <HelpButton 
                onRequestHelp={handleRequestHelp}
                activityId={currentActivity.id}
                childAge={plan?.childProfile?.age || 10}
                activityContext={{
                  title: currentActivity.title,
                  subject: currentActivity.subject || 'general',
                  currentStep: activityState.currentStep,
                  currentContent: currentActivity.content?.data?.[activityState.currentStep]
                }}
              />
              {activityState.isPaused ? (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={handleResume}
                  size="small"
                >
                  Resume
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<Pause />}
                  onClick={handlePause}
                  size="small"
                >
                  Pause
                </Button>
              )}
            </Box>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Card elevation={3} sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" component="h2" gutterBottom color="primary">
              {currentActivity.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {currentActivity.description}
            </Typography>

            {/* Progress Bar */}
            <Box sx={{ my: 3 }}>
              <ProgressBar 
                currentStep={activityState.currentStep + 1} 
                totalSteps={activityState.totalSteps} 
                timeSpent={activityState.elapsedTime}
                estimatedDuration={currentActivity.estimatedDuration}
              />
            </Box>

            {/* Activity Content */}
            <Box sx={{ my: 4 }}>
              <ActivityContent 
                activity={currentActivity}
                currentStep={activityState.currentStep}
                answers={activityState.answers}
                onAnswerChange={(answer) => handleAnswerChange(activityState.currentStep, answer)}
              />
            </Box>

            {/* Navigation Controls */}
            <Box sx={{ mt: 4 }}>
              <ActivityNavigation 
                currentStep={activityState.currentStep}
                totalSteps={activityState.totalSteps}
                onPrevious={handlePrevStep}
                onNext={handleNextStep}
                canProceed={activityState.answers[activityState.currentStep] !== undefined}
              />
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Celebration Animation */}
      {celebration && (
        <CelebrationAnimation 
          config={celebration}
          onComplete={() => setCelebration(null)}
        />
      )}
      
      {/* Completion Modal */}
      {showCompletionModal && completionResult && (
        <ActivityCompletionModal
          score={completionResult.score}
          feedback={completionResult.feedback}
          achievements={completionResult.achievements || []}
          onContinue={handleContinue}
        />
      )}
    </Box>
  );
};

export default ActivityPlayer;