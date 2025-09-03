import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
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
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Assessment as ReportIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as TimeIcon,
  Computer as DeviceIcon,
  Help as HelpIcon,
  TrendingUp as TrendIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { parentalMonitoringApi } from '../../services/api';

interface ChildActivitySummary {
  childId: string;
  childName: string;
  loginSessions: {
    total: number;
    today: number;
    thisWeek: number;
    averageSessionDuration: number;
    lastLogin: Date | null;
  };
  progress: {
    activitiesCompleted: number;
    totalActivities: number;
    completionRate: number;
    averageScore: number;
    timeSpent: number;
  };
  achievements: {
    badgesEarned: number;
    recentBadges: Array<{
      title: string;
      earnedAt: Date;
      type: string;
    }>;
  };
  streaks: {
    currentDailyStreak: number;
    longestStreak: number;
    isActive: boolean;
  };
  helpRequests: {
    total: number;
    thisWeek: number;
    frequentTopics: Array<{
      topic: string;
      count: number;
    }>;
  };
  suspiciousActivity: {
    multipleFailedLogins: boolean;
    unusualLoginTimes: boolean;
    deviceChanges: boolean;
    lastSecurityEvent: Date | null;
  };
}

interface SecurityAlert {
  childId: string;
  childName: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  resolved: boolean;
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
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={`monitoring-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ParentalMonitoringDashboard: React.FC = () => {
  const [childSummaries, setChildSummaries] = useState<ChildActivitySummary[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedChildDetails, setSelectedChildDetails] = useState<ChildActivitySummary | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchSecurityAlerts(selectedChild);
    }
  }, [selectedChild]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summariesData, notificationsData] = await Promise.all([
        parentalMonitoringApi.getActivitySummary(),
        parentalMonitoringApi.getNotifications()
      ]);

      setChildSummaries(summariesData);
      setNotifications(notificationsData);

      if (summariesData.length > 0 && !selectedChild) {
        setSelectedChild(summariesData[0].childId);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityAlerts = async (childId: string) => {
    try {
      const alerts = await parentalMonitoringApi.getSecurityAlerts(childId);
      setSecurityAlerts(alerts);
    } catch (error) {
      console.error('Error fetching security alerts:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChildChange = (event: any) => {
    setSelectedChild(event.target.value);
  };

  const handleViewDetails = (child: ChildActivitySummary) => {
    setSelectedChildDetails(child);
    setDetailsDialogOpen(true);
  };

  const handleSendWeeklyReport = async () => {
    try {
      await parentalMonitoringApi.sendWeeklyReport();
      alert('Weekly report sent successfully!');
    } catch (error) {
      console.error('Error sending weekly report:', error);
      alert('Failed to send weekly report');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Parental Monitoring</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Parental Monitoring Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={handleSendWeeklyReport}
          >
            Send Weekly Report
          </Button>
          <IconButton onClick={fetchData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab 
            label={
              <Badge badgeContent={securityAlerts.length} color="error">
                Security Alerts
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={notifications.filter(n => !n.read).length} color="primary">
                Notifications
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Overview Tab */}
        <Grid container spacing={3}>
          {childSummaries.map((child) => (
            <Grid item xs={12} md={6} lg={4} key={child.childId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {child.childName}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewDetails(child)}
                    >
                      Details
                    </Button>
                  </Box>

                  {/* Security Status */}
                  <Box sx={{ mb: 2 }}>
                    {child.suspiciousActivity.multipleFailedLogins || 
                     child.suspiciousActivity.unusualLoginTimes || 
                     child.suspiciousActivity.deviceChanges ? (
                      <Alert severity="warning" size="small">
                        Security attention needed
                      </Alert>
                    ) : (
                      <Alert severity="success" size="small">
                        All security checks passed
                      </Alert>
                    )}
                  </Box>

                  {/* Quick Stats */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {child.loginSessions.today}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Logins Today
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {child.progress.completionRate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completion Rate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {child.streaks.currentDailyStreak}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Day Streak
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {child.helpRequests.thisWeek}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Help Requests
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Recent Badges */}
                  {child.achievements.recentBadges.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recent Achievements
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {child.achievements.recentBadges.slice(0, 3).map((badge, index) => (
                          <Chip
                            key={index}
                            label={badge.title}
                            size="small"
                            color="primary"
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
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Security Alerts Tab */}
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Child</InputLabel>
            <Select
              value={selectedChild}
              label="Select Child"
              onChange={handleChildChange}
            >
              {childSummaries.map((child) => (
                <MenuItem key={child.childId} value={child.childId}>
                  {child.childName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {securityAlerts.length === 0 ? (
          <Alert severity="success" icon={<CheckIcon />}>
            No security alerts for the selected child. All activity appears normal.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {securityAlerts.map((alert, index) => (
              <Grid item xs={12} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SecurityIcon color={getSeverityColor(alert.severity) as any} />
                        <Box>
                          <Typography variant="h6">
                            {alert.alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {alert.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={alert.severity.toUpperCase()}
                        color={getSeverityColor(alert.severity) as any}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Notifications Tab */}
        {notifications.length === 0 ? (
          <Alert severity="info">
            No notifications available.
          </Alert>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon color={notification.read ? 'disabled' : 'primary'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.createdAt).toLocaleString()}
                    sx={{ opacity: notification.read ? 0.6 : 1 }}
                  />
                  <Chip
                    label={notification.type.replace(/_/g, ' ')}
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </TabPanel>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedChildDetails?.childName} - Detailed Activity Report
        </DialogTitle>
        <DialogContent>
          {selectedChildDetails && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Login Activity</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><TimeIcon /></ListItemIcon>
                    <ListItemText
                      primary="Total Sessions"
                      secondary={selectedChildDetails.loginSessions.total}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TimeIcon /></ListItemIcon>
                    <ListItemText
                      primary="Average Session Duration"
                      secondary={formatDuration(selectedChildDetails.loginSessions.averageSessionDuration)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TimeIcon /></ListItemIcon>
                    <ListItemText
                      primary="Last Login"
                      secondary={
                        selectedChildDetails.loginSessions.lastLogin
                          ? new Date(selectedChildDetails.loginSessions.lastLogin).toLocaleString()
                          : 'Never'
                      }
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Learning Progress</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><TrendIcon /></ListItemIcon>
                    <ListItemText
                      primary="Activities Completed"
                      secondary={`${selectedChildDetails.progress.activitiesCompleted} / ${selectedChildDetails.progress.totalActivities}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendIcon /></ListItemIcon>
                    <ListItemText
                      primary="Average Score"
                      secondary={`${selectedChildDetails.progress.averageScore}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TimeIcon /></ListItemIcon>
                    <ListItemText
                      primary="Total Study Time"
                      secondary={`${Math.round(selectedChildDetails.progress.timeSpent / 60)} hours`}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Help Request Analysis</Typography>
                {selectedChildDetails.helpRequests.frequentTopics.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedChildDetails.helpRequests.frequentTopics.map((topic, index) => (
                      <Chip
                        key={index}
                        label={`${topic.topic} (${topic.count})`}
                        variant="outlined"
                        icon={<HelpIcon />}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No help requests this week</Typography>
                )}
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

export default ParentalMonitoringDashboard;