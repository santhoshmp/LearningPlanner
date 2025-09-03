import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Chip,
  Grid,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Feedback,
  Analytics,
  TrendingUp,
  Speed,
  EmojiEvents,
  BugReport,
} from '@mui/icons-material';
import { userAcceptanceTestingService, UserFeedback, UsabilityMetrics } from '../../services/userAcceptanceTestingService';

interface UserTestingDashboardProps {
  userType: 'parent' | 'child';
  childAge?: number;
}

export const UserTestingDashboard: React.FC<UserTestingDashboardProps> = ({
  userType,
  childAge,
}) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [currentTasks, setCurrentTasks] = useState<string[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [metrics, setMetrics] = useState<UsabilityMetrics | null>(null);
  const [feedback, setFeedback] = useState({
    category: 'usability' as const,
    rating: 0,
    feedback: '',
    suggestions: '',
  });

  useEffect(() => {
    loadMetrics();
    checkActiveSession();
  }, []);

  const loadMetrics = async () => {
    try {
      const metricsData = await userAcceptanceTestingService.getUsabilityMetrics();
      if (!Array.isArray(metricsData)) {
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const checkActiveSession = () => {
    const sessionData = localStorage.getItem('uat_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setSessionActive(true);
      setSessionId(session.sessionId);
      setCurrentTasks(session.tasks || []);
    }
  };

  const startSession = async () => {
    try {
      const newSessionId = await userAcceptanceTestingService.startTestingSession(userType, childAge);
      setSessionId(newSessionId);
      setSessionActive(true);
      setCompletedTasks([]);
      
      // Load tasks for this session
      const sessionData = JSON.parse(localStorage.getItem('uat_session') || '{}');
      setCurrentTasks(sessionData.tasks || []);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      await userAcceptanceTestingService.endTestingSession(
        sessionId,
        completedTasks,
        feedback.feedback
      );
      setSessionActive(false);
      setSessionId('');
      setCompletedTasks([]);
      setCurrentTasks([]);
      setFeedbackOpen(true);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const toggleTaskCompletion = (task: string) => {
    setCompletedTasks(prev => 
      prev.includes(task) 
        ? prev.filter(t => t !== task)
        : [...prev, task]
    );

    // Track interaction
    userAcceptanceTestingService.trackInteraction(
      'task_toggle',
      task,
      Date.now()
    );
  };

  const submitFeedback = async () => {
    try {
      await userAcceptanceTestingService.submitFeedback({
        userId: 'test_user',
        userType,
        childAge,
        testingSession: sessionId,
        category: feedback.category,
        rating: feedback.rating,
        feedback: feedback.feedback,
        suggestions: feedback.suggestions.split('\n').filter(s => s.trim()),
        completedTasks,
        struggledTasks: currentTasks.filter(task => !completedTasks.includes(task)),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenSize: `${screen.width}x${screen.height}`,
          isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
          touchCapable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        },
        sessionDuration: 0, // Will be calculated by service
      });

      setFeedbackOpen(false);
      setFeedback({
        category: 'usability',
        rating: 0,
        feedback: '',
        suggestions: '',
      });
      
      // Reload metrics
      loadMetrics();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const getTaskDisplayName = (task: string): string => {
    const taskNames: Record<string, string> = {
      create_child_profile: 'Create Child Profile',
      set_up_study_plan: 'Set Up Study Plan',
      monitor_child_progress: 'Monitor Child Progress',
      review_safety_settings: 'Review Safety Settings',
      check_analytics_dashboard: 'Check Analytics Dashboard',
      manage_parental_controls: 'Manage Parental Controls',
      login_with_pin: 'Login with PIN',
      login_with_credentials: 'Login with Credentials',
      independent_login: 'Independent Login',
      view_dashboard: 'View Dashboard',
      navigate_dashboard: 'Navigate Dashboard',
      start_activity: 'Start Learning Activity',
      complete_simple_task: 'Complete Simple Task',
      complete_study_activity: 'Complete Study Activity',
      complete_complex_activities: 'Complete Complex Activities',
      view_badges: 'View Badges',
      earn_badge: 'Earn a Badge',
      track_progress: 'Track Progress',
      analyze_progress: 'Analyze Progress',
      view_learning_streak: 'View Learning Streak',
      ask_for_help: 'Ask for Help',
      use_help_system: 'Use Help System',
      customize_settings: 'Customize Settings',
      use_advanced_features: 'Use Advanced Features',
      manage_study_plans: 'Manage Study Plans',
    };
    return taskNames[task] || task;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Acceptance Testing Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Session Control */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Testing Session
              </Typography>
              
              {!sessionActive ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Start a new testing session to begin collecting usability data
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={startSession}
                    fullWidth
                  >
                    Start Testing Session
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Session Active: {sessionId}
                  </Alert>
                  
                  <Typography variant="body2" gutterBottom>
                    Progress: {completedTasks.length} / {currentTasks.length} tasks completed
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={(completedTasks.length / currentTasks.length) * 100}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Stop />}
                    onClick={endSession}
                    fullWidth
                  >
                    End Session & Submit Feedback
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Current Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Metrics
              </Typography>
              
              {metrics ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2">
                      Task Completion: {(metrics.taskCompletionRate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Speed sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="body2">
                      Avg Task Time: {metrics.averageTaskTime.toFixed(1)}s
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BugReport sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="body2">
                      Error Rate: {(metrics.errorRate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      Satisfaction: {metrics.satisfactionScore.toFixed(1)}/5
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No metrics available yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Task List */}
        {sessionActive && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Testing Tasks
                </Typography>
                
                <List>
                  {currentTasks.map((task) => (
                    <ListItem key={task} button onClick={() => toggleTaskCompletion(task)}>
                      <ListItemIcon>
                        <Checkbox
                          checked={completedTasks.includes(task)}
                          onChange={() => toggleTaskCompletion(task)}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={getTaskDisplayName(task)}
                        secondary={completedTasks.includes(task) ? 'Completed' : 'Pending'}
                      />
                      {completedTasks.includes(task) && (
                        <Chip label="Done" color="success" size="small" />
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Session Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Feedback Category</InputLabel>
              <Select
                value={feedback.category}
                onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value as any }))}
              >
                <MenuItem value="usability">Usability</MenuItem>
                <MenuItem value="engagement">Engagement</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="badge_system">Badge System</MenuItem>
                <MenuItem value="interface">Interface Design</MenuItem>
                <MenuItem value="safety">Safety Features</MenuItem>
              </Select>
            </FormControl>

            <Typography component="legend" gutterBottom>
              Overall Rating
            </Typography>
            <Rating
              value={feedback.rating}
              onChange={(_, value) => setFeedback(prev => ({ ...prev, rating: value || 0 }))}
              size="large"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Detailed Feedback"
              value={feedback.feedback}
              onChange={(e) => setFeedback(prev => ({ ...prev, feedback: e.target.value }))}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Suggestions for Improvement"
              placeholder="Enter each suggestion on a new line"
              value={feedback.suggestions}
              onChange={(e) => setFeedback(prev => ({ ...prev, suggestions: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackOpen(false)}>Cancel</Button>
          <Button onClick={submitFeedback} variant="contained">
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};