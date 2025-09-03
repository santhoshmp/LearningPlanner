import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useChildErrorHandler } from '../../hooks/useChildErrorHandler';
import { ChildFriendlyError, ChildErrorBoundary } from '../common';

interface DashboardData {
  studyPlans: any[];
  progressSummary: any;
  badges: any[];
  streaks: any[];
}

const ChildDashboardWithErrorHandling: React.FC = () => {
  const { currentChild } = useAuth();
  const { currentError, showError, dismissError, handleErrorAction, isErrorVisible } = useChildErrorHandler();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call that might fail
      const response = await fetch('/api/child/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard load failed: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      // Use the child error handler to show a friendly error
      showError(error as Error, {
        activityId: 'dashboard-load',
        sessionId: 'current-session'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivityStart = async (activityId: string) => {
    try {
      const response = await fetch(`/api/child/activities/${activityId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start activity');
      }

      // Navigate to activity
      console.log('Starting activity:', activityId);
    } catch (error) {
      showError(error as Error, {
        activityId,
        sessionId: 'current-session'
      });
    }
  };

  const handleProgressSave = async (progressData: any) => {
    try {
      const response = await fetch('/api/child/progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      console.log('Progress saved successfully');
    } catch (error) {
      showError(error as Error, {
        activityId: progressData.activityId,
        sessionId: 'current-session'
      });
    }
  };

  const handleBadgeRefresh = async () => {
    try {
      const response = await fetch('/api/child/badges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load badges');
      }

      const badges = await response.json();
      setDashboardData(prev => prev ? { ...prev, badges } : null);
    } catch (error) {
      showError(error as Error, {
        sessionId: 'current-session'
      });
    }
  };

  // Custom error action handler that integrates with component logic
  const handleCustomErrorAction = (action: string) => {
    switch (action) {
      case 'retry_save':
        // Retry the last save operation
        console.log('Retrying save operation...');
        break;
      case 'refresh_badges':
        handleBadgeRefresh();
        break;
      case 'retry_activity':
        loadDashboardData();
        break;
      default:
        // Use the default error handler for other actions
        handleErrorAction(action);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your awesome dashboard! 🚀
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <ChildErrorBoundary
      childAge={currentChild?.age}
      childId={currentChild?.id}
      onError={(error, errorInfo) => {
        console.error('Dashboard Error Boundary caught error:', error, errorInfo);
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Show child-friendly error if one exists */}
        {isErrorVisible && currentError && (
          <ChildFriendlyError
            error={currentError}
            onAction={handleCustomErrorAction}
            onDismiss={dismissError}
            autoHide={currentError.severity === 'info'}
          />
        )}

        {/* Dashboard Header */}
        <Box mb={4}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
            Welcome back, {currentChild?.name}! 🌟
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Ready to continue your learning adventure?
          </Typography>
        </Box>

        {/* Dashboard Content */}
        <Grid container spacing={3}>
          {/* Study Plans Section */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                  📚 Your Study Plans
                </Typography>
                
                {dashboardData?.studyPlans?.length ? (
                  <Grid container spacing={2}>
                    {dashboardData.studyPlans.map((plan: any) => (
                      <Grid item xs={12} sm={6} key={plan.id}>
                        <Card 
                          sx={{ 
                            borderRadius: 2, 
                            cursor: 'pointer',
                            '&:hover': { transform: 'translateY(-2px)' },
                            transition: 'transform 0.2s ease'
                          }}
                          onClick={() => handleActivityStart(plan.id)}
                        >
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {plan.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Progress: {plan.progressPercentage || 0}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary">
                      🎯 No study plans yet!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Ask your parent to create some fun learning activities for you!
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Progress & Badges Section */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  🏆 Your Achievements
                </Typography>
                
                <Button
                  variant="outlined"
                  onClick={handleBadgeRefresh}
                  sx={{ mb: 2 }}
                >
                  🔄 Refresh Badges
                </Button>

                {dashboardData?.badges?.length ? (
                  <Box>
                    {dashboardData.badges.slice(0, 3).map((badge: any, index: number) => (
                      <Box key={index} display="flex" alignItems="center" mb={1}>
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          🏅
                        </Typography>
                        <Typography variant="body2">
                          {badge.name || `Achievement ${index + 1}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Keep learning to earn your first badge! 🌟
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Test Error Buttons for Demo */}
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  🧪 Test Error Handling
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const error = new Error('Network connection failed');
                      error.name = 'NetworkError';
                      showError(error);
                    }}
                  >
                    Test Network Error
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const error = new Error('Failed to save progress');
                      error.name = 'ProgressError';
                      showError(error);
                    }}
                  >
                    Test Progress Error
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const error = new Error('Badge system unavailable');
                      error.name = 'BadgeError';
                      showError(error);
                    }}
                  >
                    Test Badge Error
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ChildErrorBoundary>
  );
};

export default ChildDashboardWithErrorHandling;