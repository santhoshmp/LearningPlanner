import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as StreakIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Assignment as ActivityIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { parentDashboardApi } from '../../services/api';

interface ChildProgressSummary {
  childId: string;
  childName: string;
  studyPlans: Array<{
    id: string;
    subject: string;
    status: string;
    totalActivities: number;
    completedActivities: number;
    progressPercentage: number;
    lastActivity: Date | null;
    timeSpent: number;
  }>;
  overallProgress: {
    totalActivities: number;
    completedActivities: number;
    completionRate: number;
    totalTimeSpent: number;
    averageScore: number;
  };
  streaks: {
    currentDailyStreak: number;
    longestStreak: number;
    isActive: boolean;
  };
  recentActivity: Array<{
    activityTitle: string;
    subject: string;
    completedAt: Date;
    score: number | null;
    timeSpent: number;
  }>;
  badges: {
    total: number;
    recent: Array<{
      title: string;
      earnedAt: Date;
      type: string;
    }>;
  };
}

interface DashboardData {
  children: ChildProgressSummary[];
  aggregated: {
    totalChildren: number;
    totalActivitiesCompleted: number;
    totalTimeSpent: number;
    averageCompletionRate: number;
    activeStreaks: number;
    totalBadgesEarned: number;
  };
  lastUpdated: Date;
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ParentProgressDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildProgressSummary | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await parentDashboardApi.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChildDetails = (child: ChildProgressSummary) => {
    setSelectedChild(child);
    setDetailsDialogOpen(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'paused': return 'info';
      case 'completed': return 'primary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchDashboardData}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert severity="info">
        No dashboard data available.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Your Children
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor your children's learning progress and achievements
        </Typography>
      </Box>

      {/* Children Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardData.children.map((child, index) => (
          <Grid item xs={12} md={6} key={child.childId}>
            <Card 
              sx={{ 
                p: 3,
                border: index === 0 ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: 3,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                }
              }}
              onClick={() => handleViewChildDetails(child)}
            >
              {index === 0 && (
                <Chip 
                  label="Selected" 
                  size="small" 
                  sx={{ 
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: '#3b82f6',
                    color: 'white',
                    fontWeight: 600
                  }} 
                />
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 48, 
                    height: 48,
                    bgcolor: '#3b82f6',
                    fontSize: '1.25rem',
                    fontWeight: 600
                  }}
                >
                  {child.childName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {child.childName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grade {Math.floor(Math.random() * 8) + 1} {/* Placeholder grade */}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress: {child.overallProgress.completionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current: {child.studyPlans[0]?.subject || 'No active plan'}
                </Typography>
              </Box>

              <LinearProgress 
                variant="determinate" 
                value={child.overallProgress.completionRate} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#10b981',
                    borderRadius: 4
                  }
                }}
              />

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    This week: {formatDuration(child.overallProgress.totalTimeSpent)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Streak: {child.streaks.currentDailyStreak} days
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    This week: {formatDuration(child.overallProgress.totalTimeSpent)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Streak: {child.streaks.currentDailyStreak} days
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Selected Child Dashboard */}
      {dashboardData.children.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
            Dashboard for {dashboardData.children[0].childName}
          </Typography>
          
          <Grid container spacing={3}>
            {/* Child Profile Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80,
                    bgcolor: '#3b82f6',
                    fontSize: '2rem',
                    fontWeight: 600,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {dashboardData.children[0].childName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {dashboardData.children[0].childName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Grade {Math.floor(Math.random() * 8) + 1}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>
                    {dashboardData.children[0].overallProgress.completionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Study Plan Progress
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Current Subject Card */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: '#10b981', 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SchoolIcon sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Current Subject
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {dashboardData.children[0].studyPlans[0]?.subject || 'Science'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exploring the Solar System
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      45 minutes today
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      75% complete
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#10b981',
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              </Card>
            </Grid>

            {/* This Week Stats */}
            <Grid item xs={12}>
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                  This Week
                </Typography>
                
                <Grid container spacing={4}>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {formatDuration(dashboardData.children[0].overallProgress.totalTimeSpent)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Study Time
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {dashboardData.children[0].overallProgress.completedActivities}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Activities Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {dashboardData.children[0].overallProgress.averageScore}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Score
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {dashboardData.children[0].streaks.currentDailyStreak} days
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Streak
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Study Plans" />
          <Tab label="Reports" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Weekly Study Chart */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Weekly Study Time by Subject - {dashboardData.children[0]?.childName}
              </Typography>
              
              {/* Mock Chart Data */}
              <Box sx={{ height: 300, display: 'flex', alignItems: 'end', gap: 1, px: 2 }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <Box key={day} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      width: '100%',
                      height: 200 + Math.random() * 100,
                      justifyContent: 'end',
                      gap: 0.5
                    }}>
                      {/* Math */}
                      <Box sx={{ 
                        width: '100%', 
                        height: 60 + Math.random() * 40,
                        bgcolor: '#3b82f6',
                        borderRadius: '4px 4px 0 0'
                      }} />
                      {/* Science */}
                      <Box sx={{ 
                        width: '100%', 
                        height: 40 + Math.random() * 30,
                        bgcolor: '#10b981'
                      }} />
                      {/* English */}
                      <Box sx={{ 
                        width: '100%', 
                        height: 30 + Math.random() * 20,
                        bgcolor: '#f59e0b',
                        borderRadius: '0 0 4px 4px'
                      }} />
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, fontWeight: 500 }}>
                      {day}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Legend */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#3b82f6', borderRadius: 1 }} />
                  <Typography variant="caption">Math</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#10b981', borderRadius: 1 }} />
                  <Typography variant="caption">Science</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#f59e0b', borderRadius: 1 }} />
                  <Typography variant="caption">English</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Recent Activities - {dashboardData.children[0]?.childName}
              </Typography>
              
              <List sx={{ p: 0 }}>
                {[
                  { title: 'Math Quiz: Fractions', subject: 'Math', date: '2025-09-14', icon: '⭐' },
                  { title: 'Science Lab: Water Cycle', subject: 'Science', date: '2025-09-13', icon: '✅' },
                  { title: 'Reading Comprehension', subject: 'English', date: '2025-09-13', icon: '⭐' },
                  { title: 'Multiplication Tables', subject: 'Math', date: '2025-09-12', icon: '✅' },
                  { title: 'Vocabulary Building', subject: 'English', date: '2025-09-12', icon: '⏰' }
                ].map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>
                          {activity.icon}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="500">
                            {activity.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.date}
                          </Typography>
                        </Box>
                        <Chip 
                          label={activity.subject}
                          size="small"
                          sx={{ 
                            bgcolor: activity.subject === 'Math' ? '#dbeafe' : 
                                     activity.subject === 'Science' ? '#d1fae5' : '#fef3c7',
                            color: activity.subject === 'Math' ? '#1e40af' : 
                                   activity.subject === 'Science' ? '#065f46' : '#92400e',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </ListItem>
                    {index < 4 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Reports and Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Study Plans Progress Report
              </Typography>
              
              <Grid container spacing={3}>
                {dashboardData.children[0]?.studyPlans.map((plan) => (
                  <Grid item xs={12} sm={6} md={4} key={plan.id}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {plan.subject}
                        </Typography>
                        <Chip
                          label={plan.status}
                          size="small"
                          color={getStatusColor(plan.status) as any}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {plan.completedActivities}/{plan.totalActivities} ({plan.progressPercentage}%)
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={plan.progressPercentage} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#10b981',
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimerIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(plan.timeSpent)}
                          </Typography>
                        </Box>
                        {plan.lastActivity && (
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(plan.lastActivity)}
                          </Typography>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>



      {/* Child Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedChild?.childName} - Detailed Progress
        </DialogTitle>
        <DialogContent>
          {selectedChild && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Overall Statistics</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><ActivityIcon /></ListItemIcon>
                    <ListItemText
                      primary="Activities Completed"
                      secondary={`${selectedChild.overallProgress.completedActivities} / ${selectedChild.overallProgress.totalActivities}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUpIcon /></ListItemIcon>
                    <ListItemText
                      primary="Completion Rate"
                      secondary={`${selectedChild.overallProgress.completionRate}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TimerIcon /></ListItemIcon>
                    <ListItemText
                      primary="Total Study Time"
                      secondary={formatDuration(selectedChild.overallProgress.totalTimeSpent)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><StarIcon /></ListItemIcon>
                    <ListItemText
                      primary="Average Score"
                      secondary={`${selectedChild.overallProgress.averageScore}%`}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Streaks & Achievements</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><StreakIcon /></ListItemIcon>
                    <ListItemText
                      primary="Current Daily Streak"
                      secondary={`${selectedChild.streaks.currentDailyStreak} days ${selectedChild.streaks.isActive ? '(Active)' : '(Inactive)'}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><StreakIcon /></ListItemIcon>
                    <ListItemText
                      primary="Longest Streak"
                      secondary={`${selectedChild.streaks.longestStreak} days`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrophyIcon /></ListItemIcon>
                    <ListItemText
                      primary="Total Badges"
                      secondary={selectedChild.badges.total}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Study Plans Progress</Typography>
                {selectedChild.studyPlans.map((plan) => (
                  <Box key={plan.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">{plan.subject}</Typography>
                      <Chip
                        label={plan.status}
                        size="small"
                        color={getStatusColor(plan.status) as any}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {plan.completedActivities}/{plan.totalActivities} activities
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {plan.progressPercentage}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={plan.progressPercentage} 
                      sx={{ height: 6, borderRadius: 3, mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Time spent: {formatDuration(plan.timeSpent)}
                      </Typography>
                      {plan.lastActivity && (
                        <Typography variant="caption" color="text.secondary">
                          Last activity: {formatTimeAgo(plan.lastActivity)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentProgressDashboard;