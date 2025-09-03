import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Chip,
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
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  CheckCircle,
  Error,
  Timer,
  Person,
  Child,
} from '@mui/icons-material';
import { userAcceptanceTestingService } from '../../services/userAcceptanceTestingService';

interface TestScenario {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
  maxTime: number; // in seconds
  difficulty: 'easy' | 'medium' | 'hard';
  ageGroup: '5-8' | '9-12' | '13-18' | 'parent';
}

interface TestResult {
  scenarioId: string;
  completed: boolean;
  timeSpent: number;
  errors: number;
  userRating: number;
  feedback: string;
  struggles: string[];
}

const TEST_SCENARIOS: TestScenario[] = [
  // Parent scenarios
  {
    id: 'parent_create_profile',
    title: 'Create Child Profile',
    description: 'Create a new child profile with basic information',
    expectedOutcome: 'Child profile is created successfully',
    maxTime: 180,
    difficulty: 'easy',
    ageGroup: 'parent',
  },
  {
    id: 'parent_monitor_progress',
    title: 'Monitor Child Progress',
    description: 'View child\'s learning progress and achievements',
    expectedOutcome: 'Progress dashboard displays child\'s data clearly',
    maxTime: 120,
    difficulty: 'easy',
    ageGroup: 'parent',
  },
  {
    id: 'parent_safety_settings',
    title: 'Configure Safety Settings',
    description: 'Set up parental controls and safety preferences',
    expectedOutcome: 'Safety settings are configured and saved',
    maxTime: 240,
    difficulty: 'medium',
    ageGroup: 'parent',
  },
  
  // Child scenarios (5-8 years)
  {
    id: 'child_young_login',
    title: 'Login with PIN',
    description: 'Log in using a 4-digit PIN code',
    expectedOutcome: 'Successfully logged in to child dashboard',
    maxTime: 60,
    difficulty: 'easy',
    ageGroup: '5-8',
  },
  {
    id: 'child_young_activity',
    title: 'Complete Simple Activity',
    description: 'Start and complete a basic learning activity',
    expectedOutcome: 'Activity completed with celebration animation',
    maxTime: 300,
    difficulty: 'easy',
    ageGroup: '5-8',
  },
  {
    id: 'child_young_badges',
    title: 'View Earned Badges',
    description: 'Navigate to badge collection and view earned badges',
    expectedOutcome: 'Badge collection displays with earned badges highlighted',
    maxTime: 90,
    difficulty: 'easy',
    ageGroup: '5-8',
  },

  // Child scenarios (9-12 years)
  {
    id: 'child_mid_dashboard',
    title: 'Navigate Dashboard',
    description: 'Explore the dashboard and understand progress indicators',
    expectedOutcome: 'User can identify current progress and next activities',
    maxTime: 120,
    difficulty: 'medium',
    ageGroup: '9-12',
  },
  {
    id: 'child_mid_streak',
    title: 'Maintain Learning Streak',
    description: 'Complete activities to maintain daily learning streak',
    expectedOutcome: 'Learning streak is updated and displayed',
    maxTime: 180,
    difficulty: 'medium',
    ageGroup: '9-12',
  },

  // Child scenarios (13-18 years)
  {
    id: 'child_teen_analytics',
    title: 'Analyze Progress Data',
    description: 'Review detailed progress analytics and insights',
    expectedOutcome: 'User understands their learning patterns and areas for improvement',
    maxTime: 240,
    difficulty: 'hard',
    ageGroup: '13-18',
  },
  {
    id: 'child_teen_goals',
    title: 'Set Learning Goals',
    description: 'Create and manage personal learning objectives',
    expectedOutcome: 'Learning goals are set and tracked',
    maxTime: 300,
    difficulty: 'hard',
    ageGroup: '13-18',
  },
];

interface UsabilityTestRunnerProps {
  userType: 'parent' | 'child';
  childAge?: number;
}

export const UsabilityTestRunner: React.FC<UsabilityTestRunnerProps> = ({
  userType,
  childAge,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentScenario, setCurrentScenario] = useState<TestScenario | null>(null);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [testRunning, setTestRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState({
    rating: 0,
    feedback: '',
    struggles: [] as string[],
  });

  const getAgeGroup = (): '5-8' | '9-12' | '13-18' | 'parent' => {
    if (userType === 'parent') return 'parent';
    if (childAge && childAge <= 8) return '5-8';
    if (childAge && childAge <= 12) return '9-12';
    return '13-18';
  };

  const relevantScenarios = TEST_SCENARIOS.filter(
    scenario => scenario.ageGroup === getAgeGroup()
  );

  useEffect(() => {
    if (relevantScenarios.length > 0) {
      setCurrentScenario(relevantScenarios[0]);
    }
  }, []);

  const startTest = async () => {
    try {
      const newSessionId = await userAcceptanceTestingService.startTestingSession(userType, childAge);
      setSessionId(newSessionId);
      setTestRunning(true);
      setTestStartTime(Date.now());
      setActiveStep(0);
      setTestResults([]);
      
      if (relevantScenarios[0]) {
        setCurrentScenario(relevantScenarios[0]);
      }
    } catch (error) {
      console.error('Failed to start usability test:', error);
    }
  };

  const completeScenario = (success: boolean) => {
    if (!currentScenario) return;

    const timeSpent = (Date.now() - testStartTime) / 1000;
    const result: TestResult = {
      scenarioId: currentScenario.id,
      completed: success,
      timeSpent,
      errors: 0, // This would be tracked during the test
      userRating: 0, // Will be set in feedback
      feedback: '',
      struggles: [],
    };

    setTestResults(prev => [...prev, result]);
    setFeedbackOpen(true);

    // Track the interaction
    userAcceptanceTestingService.trackInteraction(
      'scenario_completed',
      currentScenario.id,
      timeSpent
    );
  };

  const submitScenarioFeedback = () => {
    if (testResults.length > 0) {
      const lastResult = testResults[testResults.length - 1];
      const updatedResult = {
        ...lastResult,
        userRating: currentFeedback.rating,
        feedback: currentFeedback.feedback,
        struggles: currentFeedback.struggles,
      };

      setTestResults(prev => [
        ...prev.slice(0, -1),
        updatedResult,
      ]);
    }

    setFeedbackOpen(false);
    setCurrentFeedback({ rating: 0, feedback: '', struggles: [] });

    // Move to next scenario
    const nextIndex = activeStep + 1;
    if (nextIndex < relevantScenarios.length) {
      setActiveStep(nextIndex);
      setCurrentScenario(relevantScenarios[nextIndex]);
      setTestStartTime(Date.now());
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    try {
      const completedTasks = testResults
        .filter(result => result.completed)
        .map(result => result.scenarioId);

      await userAcceptanceTestingService.endTestingSession(
        sessionId,
        completedTasks,
        'Usability test completed'
      );

      setTestRunning(false);
      setCurrentScenario(null);
    } catch (error) {
      console.error('Failed to finish test:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getCompletionRate = () => {
    if (testResults.length === 0) return 0;
    const completed = testResults.filter(result => result.completed).length;
    return (completed / testResults.length) * 100;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Usability Test Runner
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        {userType === 'parent' ? 'Parent' : `Child (Age ${childAge})`} Testing Session
      </Typography>

      {!testRunning ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Overview
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This test includes {relevantScenarios.length} scenarios designed for your user type.
              Each scenario will be timed and you'll provide feedback after completion.
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={startTest}
                size="large"
              >
                Start Usability Test
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Overview */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Progress
              </Typography>
              
              <LinearProgress
                variant="determinate"
                value={(activeStep / relevantScenarios.length) * 100}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                Scenario {activeStep + 1} of {relevantScenarios.length} • 
                Completion Rate: {getCompletionRate().toFixed(0)}%
              </Typography>
            </CardContent>
          </Card>

          {/* Current Scenario */}
          {currentScenario && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {currentScenario.title}
                  </Typography>
                  <Chip
                    label={currentScenario.difficulty}
                    color={getDifficultyColor(currentScenario.difficulty) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body1" gutterBottom>
                  {currentScenario.description}
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Expected Outcome:</strong> {currentScenario.expectedOutcome}
                </Alert>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Maximum time: {currentScenario.maxTime} seconds
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => completeScenario(true)}
                  >
                    Completed Successfully
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Error />}
                    onClick={() => completeScenario(false)}
                  >
                    Could Not Complete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Test Results Summary */}
          {testResults.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Completed Scenarios
                </Typography>
                
                <List>
                  {testResults.map((result, index) => {
                    const scenario = relevantScenarios.find(s => s.id === result.scenarioId);
                    return (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {result.completed ? (
                            <CheckCircle color="success" />
                          ) : (
                            <Error color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={scenario?.title}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Time: {result.timeSpent.toFixed(1)}s • 
                                Rating: {result.userRating}/5
                              </Typography>
                              {result.feedback && (
                                <Typography variant="body2" color="text.secondary">
                                  {result.feedback}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Scenario Feedback Dialog */}
      <Dialog open={feedbackOpen} onClose={() => {}} maxWidth="md" fullWidth>
        <DialogTitle>Scenario Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography component="legend" gutterBottom>
              How would you rate this scenario?
            </Typography>
            <Rating
              value={currentFeedback.rating}
              onChange={(_, value) => setCurrentFeedback(prev => ({ ...prev, rating: value || 0 }))}
              size="large"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Feedback"
              value={currentFeedback.feedback}
              onChange={(e) => setCurrentFeedback(prev => ({ ...prev, feedback: e.target.value }))}
              sx={{ mb: 3 }}
            />

            <Typography variant="body2" gutterBottom>
              What did you struggle with? (Select all that apply)
            </Typography>
            
            {[
              'Finding the right button/link',
              'Understanding the interface',
              'Loading time was too slow',
              'Text was too small/hard to read',
              'Instructions were unclear',
              'Animation was distracting',
              'Other technical issues',
            ].map((struggle) => (
              <Box key={struggle} sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={currentFeedback.struggles.includes(struggle)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCurrentFeedback(prev => ({
                        ...prev,
                        struggles: [...prev.struggles, struggle],
                      }));
                    } else {
                      setCurrentFeedback(prev => ({
                        ...prev,
                        struggles: prev.struggles.filter(s => s !== struggle),
                      }));
                    }
                  }}
                />
                <Typography variant="body2">{struggle}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={submitScenarioFeedback} variant="contained">
            Continue to Next Scenario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};