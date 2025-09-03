import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Alert,
  Button,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  School,
  Timer,
  EmojiEvents,
  Lightbulb,
  Warning,
  CheckCircle,
  Speed,
  GpsFixed,
} from '@mui/icons-material';
import { analyticsService } from '../../services/analyticsService';
import { ChildProfile } from '../../types/child';
import { 
  TimeFrame, 
  DetailedProgressData, 
  LearningInsight,
  MasteryIndicator,
  LearningVelocity,
  EngagementPattern
} from '../../types/analytics';
import ProgressSummary from './ProgressSummary';
import PerformanceTrendChart from './PerformanceTrendChart';
import SubjectPerformanceChart from './SubjectPerformanceChart';
import AlertsPanel from './AlertsPanel';
import TimeFrameSelector from './TimeFrameSelector';
import DetailedProgressChart from './DetailedProgressChart';
import LearningInsightsPanel from './LearningInsightsPanel';
import ExportReports from './ExportReports';

interface EnhancedAnalyticsDashboardProps {
  children: ChildProfile[];
  selectedChildId?: string;
  onSelectChild: (childId: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedAnalyticsDashboard: React.FC<EnhancedAnalyticsDashboardProps> = ({ 
  children, 
  selectedChildId, 
  onSelectChild 
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const [detailedProgress, setDetailedProgress] = useState<DetailedProgressData | null>(null);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      onSelectChild(children[0].id);
    }
  }, [children, selectedChildId, onSelectChild]);

  useEffect(() => {
    const fetchEnhancedAnalyticsData = async () => {
      if (!selectedChildId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [progressData, insights] = await Promise.all([
          analyticsService.getDetailedProgressTracking(selectedChildId, timeFrame),
          analyticsService.getLearningInsights(selectedChildId)
        ]);
        
        setDetailedProgress(progressData);
        setLearningInsights(insights);
      } catch (err) {
        console.error('Failed to fetch enhanced analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEnhancedAnalyticsData();
  }, [selectedChildId, timeFrame]);

  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  const handleChildChange = (event: any) => {
    onSelectChild(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getSelectedChild = () => {
    return children.find(child => child.id === selectedChildId);
  };

  if (loading && !detailedProgress) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button 
            color="inherit" 
            size="small"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  const selectedChild = getSelectedChild();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Enhanced Learning Analytics
          </Typography>
          {selectedChild && (
            <Typography variant="subtitle1" color="text.secondary">
              Detailed insights for {selectedChild.name}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="child-selector-label">Select Child</InputLabel>
            <Select
              labelId="child-selector-label"
              id="childSelector"
              value={selectedChildId}
              label="Select Child"
              onChange={handleChildChange}
              size="small"
            >
              {children.map(child => (
                <MenuItem key={child.id} value={child.id}>
                  {child.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TimeFrameSelector 
            timeFrame={timeFrame} 
            onChange={handleTimeFrameChange} 
          />
        </Box>
      </Box>

      {/* Key Metrics Overview */}
      {detailedProgress && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <School color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Activities</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {detailedProgress.detailedMetrics.activitiesCompleted}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  of {detailedProgress.detailedMetrics.totalActivities} total
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={detailedProgress.detailedMetrics.completionRate * 100}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GpsFixed color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Average Score</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {Math.round(detailedProgress.detailedMetrics.averageScore)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  across all subjects
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Timer color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Study Time</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {Math.round(detailedProgress.detailedMetrics.totalTimeSpent / 60)}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(detailedProgress.detailedMetrics.averageSessionDuration)} min avg session
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmojiEvents color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Streak</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {detailedProgress.detailedMetrics.streakDays}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  consecutive days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Learning Velocity" />
          <Tab label="Mastery Analysis" />
          <Tab label="Insights & Recommendations" />
          <Tab label="Export & Reports" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {detailedProgress && (
              <>
                <Grid item xs={12} lg={8}>
                  <Card>
                    <CardHeader title="Detailed Progress Visualization" />
                    <CardContent>
                      <DetailedProgressChart data={detailedProgress} />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} lg={4}>
                  <AlertsPanel childId={selectedChildId} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Engagement Patterns" />
                    <CardContent>
                      <EngagementPatternsDisplay patterns={detailedProgress.engagementPatterns} />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Content Preferences" />
                    <CardContent>
                      <ContentPreferencesDisplay patterns={detailedProgress.engagementPatterns} />
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* Learning Velocity Tab */}
        <TabPanel value={activeTab} index={1}>
          {detailedProgress && (
            <LearningVelocityDisplay velocity={detailedProgress.learningVelocity} />
          )}
        </TabPanel>

        {/* Mastery Analysis Tab */}
        <TabPanel value={activeTab} index={2}>
          {detailedProgress && (
            <MasteryAnalysisDisplay indicators={detailedProgress.masteryIndicators} />
          )}
        </TabPanel>

        {/* Insights & Recommendations Tab */}
        <TabPanel value={activeTab} index={3}>
          <LearningInsightsPanel insights={learningInsights} />
        </TabPanel>

        {/* Export & Reports Tab */}
        <TabPanel value={activeTab} index={4}>
          <ExportReports 
            childId={selectedChildId}
            timeFrame={timeFrame}
            children={children}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
};

// Helper components for displaying specific data

const EngagementPatternsDisplay: React.FC<{ patterns: EngagementPattern }> = ({ patterns }) => (
  <Box>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      Preferred Study Time
    </Typography>
    <Typography variant="h6" gutterBottom>
      {patterns.preferredTimeOfDay}
    </Typography>
    
    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
      Average Session Length
    </Typography>
    <Typography variant="h6" gutterBottom>
      {Math.round(patterns.averageSessionLength)} minutes
    </Typography>
    
    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
      Break Frequency
    </Typography>
    <Typography variant="h6">
      Every {Math.round(patterns.breakFrequency)} minutes
    </Typography>
  </Box>
);

const ContentPreferencesDisplay: React.FC<{ patterns: EngagementPattern }> = ({ patterns }) => (
  <Box>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      Content Type Preferences
    </Typography>
    
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Videos</Typography>
        <Typography variant="body2">{Math.round(patterns.contentTypePreference.video * 100)}%</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={patterns.contentTypePreference.video * 100}
        sx={{ mb: 1 }}
      />
    </Box>

    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Articles</Typography>
        <Typography variant="body2">{Math.round(patterns.contentTypePreference.article * 100)}%</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={patterns.contentTypePreference.article * 100}
        sx={{ mb: 1 }}
      />
    </Box>

    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Interactive</Typography>
        <Typography variant="body2">{Math.round(patterns.contentTypePreference.interactive * 100)}%</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={patterns.contentTypePreference.interactive * 100}
      />
    </Box>
  </Box>
);

const LearningVelocityDisplay: React.FC<{ velocity: LearningVelocity }> = ({ velocity }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Speed color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Learning Velocity</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Activities per Week
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {velocity.activitiesPerWeek.toFixed(1)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Average Completion Time
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {Math.round(velocity.averageCompletionTime)} min
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Improvement Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                {velocity.improvementRate > 0 ? '+' : ''}{velocity.improvementRate.toFixed(1)}%
              </Typography>
              {velocity.improvementRate > 0 ? (
                <TrendingUp color="success" />
              ) : (
                <TrendingDown color="error" />
              )}
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Consistency Score
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={velocity.consistencyScore * 100}
                sx={{ flexGrow: 1, mr: 2 }}
              />
              <Typography variant="body2">
                {Math.round(velocity.consistencyScore * 100)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Velocity Trend
          </Typography>
          
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Chip 
              label={velocity.trend.toUpperCase()}
              color={
                velocity.trend === 'increasing' ? 'success' : 
                velocity.trend === 'decreasing' ? 'error' : 'default'
              }
              size="large"
              icon={
                velocity.trend === 'increasing' ? <TrendingUp /> :
                velocity.trend === 'decreasing' ? <TrendingDown /> : <Speed />
              }
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {velocity.trend === 'increasing' && 'Learning pace is accelerating'}
            {velocity.trend === 'decreasing' && 'Learning pace is slowing down'}
            {velocity.trend === 'stable' && 'Learning pace is consistent'}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

const MasteryAnalysisDisplay: React.FC<{ indicators: MasteryIndicator[] }> = ({ indicators }) => (
  <Grid container spacing={3}>
    {indicators.map((indicator, index) => (
      <Grid item xs={12} md={6} key={index}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {indicator.subject}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Mastery Level
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={indicator.masteryLevel}
                  sx={{ flexGrow: 1, mr: 2 }}
                />
                <Typography variant="body2">
                  {indicator.masteryLevel}%
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Confidence Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={indicator.confidenceScore * 100}
                  sx={{ flexGrow: 1, mr: 2 }}
                />
                <Typography variant="body2">
                  {Math.round(indicator.confidenceScore * 100)}%
                </Typography>
              </Box>
            </Box>

            {indicator.areasOfStrength.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Strengths
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {indicator.areasOfStrength.map((strength, idx) => (
                    <Chip 
                      key={idx}
                      label={strength}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {indicator.areasForImprovement.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Areas for Improvement
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {indicator.areasForImprovement.map((area, idx) => (
                    <Chip 
                      key={idx}
                      label={area}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export default EnhancedAnalyticsDashboard;