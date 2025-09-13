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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Parent Progress Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
          </Typography>
          <Tooltip title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}>
            <IconButton 
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'primary' : 'default'}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Aggregated Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary" fontWeight="bold">
                {dashboardData.aggregated.totalChildren}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Children
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                {dashboardData.aggregated.totalActivitiesCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activities Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main" fontWeight="bold">
                {formatDuration(dashboardData.aggregated.totalTimeSpent)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Study Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main" fontWeight="bold">
                {dashboardData.aggregated.averageCompletionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="error.main" fontWeight="bold">
                {dashboardData.aggregated.activeStreaks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Streaks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="secondary.main" fontWeight="bold">
                {dashboardData.aggregated.totalBadgesEarned}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Badges
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Children Overview" />
          <Tab label="Study Plans Progress" />
          <Tab label="Recent Activity" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Children Overview */}
        <Grid container spacing={3}>
          {dashboardData.children.map((child) => (
            <Grid item xs={12} md={6} lg={4} key={child.childId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {child.childName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold">
                        {child.childName}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewChildDetails(child)}
                    >
                      Details
                    </Button>
                  </Box>

                  {/* Progress Overview */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Overall Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {child.overallProgress.completionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={child.overallProgress.completionRate} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Quick Stats */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="primary">
                          {child.overallProgress.completedActivities}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Activities Done
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="success.main">
                          {child.overallProgress.averageScore}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg Score
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="warning.main">
                          {child.streaks.currentDailyStreak}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Day Streak
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" color="info.main">
                          {formatDuration(child.overallProgress.totalTimeSpent)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Study Time
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Recent Badges */}
                  {child.badges.recent.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recent Achievements
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {child.badges.recent.slice(0, 3).map((badge, index) => (
                          <Chip
                            key={index}
                            label={badge.title}
                            size="small"
                            color="secondary"
                            icon={<TrophyIcon />}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Study Plans Summary */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Active Study Plans ({child.studyPlans.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {child.studyPlans.slice(0, 3).map((plan) => (
                        <Chip
                          key={plan.id}
                          label={`${plan.subject} (${plan.progressPercentage}%)`}
                          size="small"
                          color={getStatusColor(plan.status) as any}
                          variant="outlined"
                        />
                      ))}
                      {child.studyPlans.length > 3 && (
                        <Chip
                          label={`+${child.studyPlans.length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Study Plans Progress */}
        <Grid container spacing={3}>
          {dashboardData.children.map((child) => (
            <Grid item xs={12} key={child.childId}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {child.childName}'s Study Plans
                  </Typography>
                  <Grid container spacing={2}>
                    {child.studyPlans.map((plan) => (
                      <Grid item xs={12} sm={6} md={4} key={plan.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                                sx={{ height: 6, borderRadius: 3 }}
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
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Recent Activity */}
        <Grid container spacing={3}>
          {dashboardData.children.map((child) => (
            <Grid item xs={12} md={6} key={child.childId}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {child.childName}'s Recent Activity
                  </Typography>
                  {child.recentActivity.length === 0 ? (
                    <Alert severity="info">No recent activity</Alert>
                  ) : (
                    <List>
                      {child.recentActivity.map((activity, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemIcon>
                              <ActivityIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={activity.activityTitle}
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {activity.subject} • {formatTimeAgo(activity.completedAt)}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                    {activity.score !== null && (
                                      <Chip
                                        label={`${activity.score}%`}
                                        size="small"
                                        color={activity.score >= 80 ? 'success' : activity.score >= 60 ? 'warning' : 'error'}
                                        icon={<StarIcon />}
                                      />
                                    )}
                                    <Chip
                                      label={formatDuration(activity.timeSpent)}
                                      size="small"
                                      variant="outlined"
                                      icon={<ScheduleIcon />}
                                    />
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < child.recentActivity.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
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