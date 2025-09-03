import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AuthStats {
  totalEvents: number;
  successfulLogins: number;
  failedLogins: number;
  tokenRefreshes: number;
  childEvents: number;
  parentEvents: number;
  averageLoginDuration: number;
  errorRate: number;
}

interface AuthEvent {
  id: string;
  eventType: string;
  userType: string;
  userId?: string;
  details: string;
  timestamp: string;
}

interface HealthCheck {
  status: 'healthy' | 'warning' | 'error';
  component: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

interface PerformanceMetric {
  id: string;
  operation: string;
  duration: number;
  success: boolean;
  timestamp: string;
  metadata: string;
}

const AuthMonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<AuthStats | null>(null);
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week'>('day');
  const [diagnosticDialogOpen, setDiagnosticDialogOpen] = useState(false);
  const [diagnosticUserId, setDiagnosticUserId] = useState('');
  const [diagnosticIsChild, setDiagnosticIsChild] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes, healthRes, performanceRes] = await Promise.all([
        fetch(`/api/auth-monitoring/stats?timeframe=${timeframe}`),
        fetch('/api/auth-monitoring/events?limit=50'),
        fetch('/api/auth-monitoring/health'),
        fetch('/api/auth-monitoring/performance?limit=50')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.data);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthChecks(healthData.checks);
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json();
        setPerformanceMetrics(performanceData.data);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeframe]);

  const handleDiagnosticSubmit = async () => {
    if (!diagnosticUserId.trim()) return;

    try {
      const response = await fetch(
        `/api/auth-monitoring/diagnose/${diagnosticUserId}?isChild=${diagnosticIsChild}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setDiagnosticResult(result.data);
      }
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (duration: number) => {
    return `${duration.toFixed(0)}ms`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Prepare chart data
  const chartData = performanceMetrics
    .filter(metric => metric.operation.includes('LOGIN'))
    .slice(-20)
    .map(metric => ({
      timestamp: new Date(metric.timestamp).toLocaleTimeString(),
      duration: metric.duration,
      success: metric.success ? 1 : 0
    }));

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Authentication Monitoring Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value as 'hour' | 'day' | 'week')}
            >
              <MenuItem value="hour">Last Hour</MenuItem>
              <MenuItem value="day">Last Day</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<SecurityIcon />}
            onClick={() => setDiagnosticDialogOpen(true)}
          >
            Run Diagnostics
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Events
                </Typography>
                <Typography variant="h4">
                  {stats.totalEvents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h4" color={stats.errorRate < 10 ? 'success.main' : 'error.main'}>
                  {((100 - stats.errorRate)).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Child Events
                </Typography>
                <Typography variant="h4">
                  {stats.childEvents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Login Time
                </Typography>
                <Typography variant="h4">
                  {formatDuration(stats.averageLoginDuration)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* System Health */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Health
          </Typography>
          <Grid container spacing={2}>
            {healthChecks.map((check, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box display="flex" alignItems="center" gap={1}>
                  {getStatusIcon(check.status)}
                  <Box>
                    <Typography variant="subtitle2">
                      {check.component}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {check.message}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Login Performance Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'duration' ? formatDuration(value as number) : value,
                  name === 'duration' ? 'Duration' : 'Success Rate'
                ]} />
                <Line type="monotone" dataKey="duration" stroke="#8884d8" name="duration" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Authentication Events
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>User Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.slice(0, 10).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={event.eventType} 
                        size="small"
                        color={event.eventType.includes('SUCCESS') ? 'success' : 
                               event.eventType.includes('FAILURE') ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.userType} 
                        size="small"
                        color={event.userType === 'CHILD' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      {event.eventType.includes('SUCCESS') ? 
                        <CheckCircleIcon color="success" fontSize="small" /> :
                        event.eventType.includes('FAILURE') ?
                        <ErrorIcon color="error" fontSize="small" /> :
                        <TimelineIcon color="action" fontSize="small" />
                      }
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {JSON.parse(event.details || '{}').errorMessage || 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Diagnostic Dialog */}
      <Dialog open={diagnosticDialogOpen} onClose={() => setDiagnosticDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Run User Session Diagnostics</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="User ID"
              value={diagnosticUserId}
              onChange={(e) => setDiagnosticUserId(e.target.value)}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>User Type</InputLabel>
              <Select
                value={diagnosticIsChild}
                label="User Type"
                onChange={(e) => setDiagnosticIsChild(e.target.value as boolean)}
              >
                <MenuItem value={false}>Parent</MenuItem>
                <MenuItem value={true}>Child</MenuItem>
              </Select>
            </FormControl>
            
            {diagnosticResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Diagnostic Results
                </Typography>
                <Alert severity={diagnosticResult.sessionValid ? 'success' : 'error'} sx={{ mb: 2 }}>
                  Session Status: {diagnosticResult.sessionValid ? 'Valid' : 'Invalid'}
                </Alert>
                
                {diagnosticResult.issues.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Issues Found:
                    </Typography>
                    {diagnosticResult.issues.map((issue: string, index: number) => (
                      <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                        {issue}
                      </Alert>
                    ))}
                  </Box>
                )}
                
                {diagnosticResult.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Recommendations:
                    </Typography>
                    {diagnosticResult.recommendations.map((rec: string, index: number) => (
                      <Alert key={index} severity="info" sx={{ mb: 1 }}>
                        {rec}
                      </Alert>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiagnosticDialogOpen(false)}>
            Close
          </Button>
          <Button onClick={handleDiagnosticSubmit} variant="contained">
            Run Diagnostics
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuthMonitoringDashboard;