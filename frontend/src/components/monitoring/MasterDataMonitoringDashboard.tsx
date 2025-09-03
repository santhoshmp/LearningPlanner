import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Alert,
  AlertTitle,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  components: HealthCheckResult[];
  issues: DataQualityIssue[];
  metrics: SystemMetrics;
}

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  details?: any;
  timestamp: Date;
  responseTime?: number;
}

interface DataQualityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity: string;
  entityId: string;
  field?: string;
  message: string;
  suggestedFix: string;
  detectedAt: Date;
}

interface SystemMetrics {
  database: {
    connectionCount: number;
    activeQueries: number;
    cacheHitRatio: number;
    tableStats: { table: string; rowCount: number; size: string }[];
  };
  cache: {
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    evictionRate: number;
  };
  masterData: {
    totalGrades: number;
    totalSubjects: number;
    totalTopics: number;
    totalResources: number;
    activeResources: number;
    validatedResources: number;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

interface PerformanceReport {
  timeframe: string;
  totalOperations: number;
  averageResponseTime: number;
  cacheHitRate: number;
  slowestOperations: any[];
  mostFrequentOperations: any[];
  errorRate: number;
  recommendations: string[];
  generatedAt: Date;
}

interface ResourceCheck {
  resourceId: string;
  url: string;
  status: 'available' | 'unavailable' | 'moved' | 'restricted' | 'timeout';
  responseCode?: number;
  responseTime?: number;
  lastChecked: Date;
  errorMessage?: string;
  redirectUrl?: string;
}

const MasterDataMonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [resourceChecks, setResourceChecks] = useState<ResourceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(60); // minutes
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<HealthCheckResult | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const [statusResponse, performanceResponse, resourceResponse] = await Promise.all([
        fetch('/api/monitoring/health'),
        fetch(`/api/monitoring/performance?timeframe=${selectedTimeframe * 60000}`),
        fetch('/api/monitoring/resources/availability')
      ]);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData.data);
      }

      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setPerformanceReport(performanceData.data.report);
      }

      if (resourceResponse.ok) {
        const resourceData = await resourceResponse.json();
        setResourceChecks(resourceData.data.results);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleCacheWarmup = async () => {
    try {
      const response = await fetch('/api/monitoring/cache/warmup', { method: 'POST' });
      if (response.ok) {
        // Show success message
        loadDashboardData();
      }
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  };

  const handleCacheClear = async () => {
    try {
      const response = await fetch('/api/monitoring/cache/invalidate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (response.ok) {
        // Show success message
        loadDashboardData();
      }
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  };

  const handleResourceCheck = async () => {
    try {
      const response = await fetch('/api/monitoring/resources/check', { method: 'POST' });
      if (response.ok) {
        // Show success message
        loadDashboardData();
      }
    } catch (error) {
      console.error('Resource check failed:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/monitoring/export?timeframe=${selectedTimeframe * 60000}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <ErrorIcon color="disabled" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Master Data Monitoring
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
          >
            Export Report
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* System Status Overview */}
      {systemStatus && (
        <Alert 
          severity={getStatusColor(systemStatus.overall) as any}
          sx={{ mb: 3 }}
          icon={getStatusIcon(systemStatus.overall)}
        >
          <AlertTitle>System Status: {systemStatus.overall.toUpperCase()}</AlertTitle>
          {systemStatus.issues.length > 0 && (
            <Typography variant="body2">
              {systemStatus.issues.length} data quality issues detected
            </Typography>
          )}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Data Quality" />
          <Tab label="Resources" />
          <Tab label="Cache" />
          <Tab label="Database" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* System Metrics Cards */}
          {systemStatus && (
            <>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <StorageIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Master Data</Typography>
                    </Box>
                    <Typography variant="h4" color="primary">
                      {systemStatus.metrics.masterData.totalGrades + 
                       systemStatus.metrics.masterData.totalSubjects + 
                       systemStatus.metrics.masterData.totalTopics}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Entities
                    </Typography>
                    <Box mt={2}>
                      <Typography variant="caption">
                        {systemStatus.metrics.masterData.totalGrades} grades, {' '}
                        {systemStatus.metrics.masterData.totalSubjects} subjects, {' '}
                        {systemStatus.metrics.masterData.totalTopics} topics
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <CloudIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Resources</Typography>
                    </Box>
                    <Typography variant="h4" color="primary">
                      {systemStatus.metrics.masterData.activeResources}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Resources
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(systemStatus.metrics.masterData.validatedResources / 
                              systemStatus.metrics.masterData.totalResources) * 100}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption">
                      {systemStatus.metrics.masterData.validatedResources} validated
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <SpeedIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Cache</Typography>
                    </Box>
                    <Typography variant="h4" color="primary">
                      {systemStatus.metrics.cache.hitRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hit Rate
                    </Typography>
                    <Box mt={2}>
                      <Typography variant="caption">
                        {systemStatus.metrics.cache.totalKeys} keys, {' '}
                        {systemStatus.metrics.cache.memoryUsage}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <TimelineIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Performance</Typography>
                    </Box>
                    <Typography variant="h4" color="primary">
                      {systemStatus.metrics.performance.averageResponseTime.toFixed(0)}ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response Time
                    </Typography>
                    <Box mt={2}>
                      <Typography variant="caption">
                        {(systemStatus.metrics.performance.errorRate * 100).toFixed(2)}% error rate
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Component Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Component Health Status
                </Typography>
                <Grid container spacing={2}>
                  {systemStatus?.components.map((component, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        p={2} 
                        border={1} 
                        borderColor="divider" 
                        borderRadius={1}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedComponent(component);
                          setShowDetailsDialog(true);
                        }}
                      >
                        {getStatusIcon(component.status)}
                        <Box ml={2} flex={1}>
                          <Typography variant="subtitle1">
                            {component.component.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {component.message}
                          </Typography>
                          {component.responseTime && (
                            <Typography variant="caption">
                              Response: {component.responseTime}ms
                            </Typography>
                          )}
                        </Box>
                        <Chip 
                          label={component.status} 
                          color={getStatusColor(component.status) as any}
                          size="small"
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && performanceReport && (
        <Grid container spacing={3}>
          {/* Performance Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Summary ({performanceReport.timeframe})
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="h4" color="primary">
                      {performanceReport.totalOperations}
                    </Typography>
                    <Typography variant="body2">Total Operations</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="h4" color="primary">
                      {performanceReport.averageResponseTime.toFixed(2)}ms
                    </Typography>
                    <Typography variant="body2">Avg Response Time</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="h4" color="primary">
                      {(performanceReport.cacheHitRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">Cache Hit Rate</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="h4" color="primary">
                      {(performanceReport.errorRate * 100).toFixed(2)}%
                    </Typography>
                    <Typography variant="body2">Error Rate</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Slowest Operations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Slowest Operations
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Operation</TableCell>
                        <TableCell align="right">Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceReport.slowestOperations.slice(0, 10).map((op, index) => (
                        <TableRow key={index}>
                          <TableCell>{op.operationType}</TableCell>
                          <TableCell align="right">{formatDuration(op.duration)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Most Frequent Operations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Most Frequent Operations
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Operation</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Avg Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceReport.mostFrequentOperations.slice(0, 10).map((op, index) => (
                        <TableRow key={index}>
                          <TableCell>{op.operation}</TableCell>
                          <TableCell align="right">{op.count}</TableCell>
                          <TableCell align="right">{formatDuration(op.avgDuration)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Recommendations
                </Typography>
                {performanceReport.recommendations.map((rec, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 1 }}>
                    {rec}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Data Quality Issues */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Data Quality Issues
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {/* Trigger data quality check */}}
                  >
                    Run Check
                  </Button>
                </Box>
                
                {systemStatus?.issues.length === 0 ? (
                  <Alert severity="success">
                    No data quality issues detected
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Severity</TableCell>
                          <TableCell>Entity</TableCell>
                          <TableCell>Issue</TableCell>
                          <TableCell>Suggested Fix</TableCell>
                          <TableCell>Detected</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {systemStatus?.issues.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                label={issue.severity} 
                                color={getSeverityColor(issue.severity) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{issue.entity}</TableCell>
                            <TableCell>{issue.message}</TableCell>
                            <TableCell>{issue.suggestedFix}</TableCell>
                            <TableCell>
                              {new Date(issue.detectedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* Resource Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Resource Availability
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleResourceCheck}
                  >
                    Check Resources
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>URL</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Response Time</TableCell>
                        <TableCell>Last Checked</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resourceChecks.slice(0, 20).map((check, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {check.url.length > 50 ? `${check.url.substring(0, 50)}...` : check.url}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={check.status} 
                              color={check.status === 'available' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {check.responseTime ? `${check.responseTime}ms` : '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(check.lastChecked).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {check.errorMessage || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          {/* Cache Management */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Cache Management
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleCacheWarmup}
                    >
                      Warm Up
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      onClick={handleCacheClear}
                    >
                      Clear Cache
                    </Button>
                  </Box>
                </Box>
                
                {systemStatus && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="h4" color="primary">
                        {systemStatus.metrics.cache.totalKeys}
                      </Typography>
                      <Typography variant="body2">Total Keys</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="h4" color="primary">
                        {systemStatus.metrics.cache.memoryUsage}
                      </Typography>
                      <Typography variant="body2">Memory Usage</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="h4" color="primary">
                        {systemStatus.metrics.cache.hitRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">Hit Rate</Typography>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 5 && (
        <Grid container spacing={3}>
          {/* Database Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Database Status
                </Typography>
                
                {systemStatus && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="h4" color="primary">
                        {systemStatus.metrics.database.connectionCount}
                      </Typography>
                      <Typography variant="body2">Active Connections</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="h4" color="primary">
                        {systemStatus.metrics.database.activeQueries}
                      </Typography>
                      <Typography variant="body2">Active Queries</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="h4" color="primary">
                        {systemStatus.metrics.database.cacheHitRatio.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">DB Cache Hit Ratio</Typography>
                    </Grid>
                  </Grid>
                )}

                {/* Table Statistics */}
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Table Statistics
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Table</TableCell>
                          <TableCell align="right">Row Count</TableCell>
                          <TableCell align="right">Size</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {systemStatus?.metrics.database.tableStats.map((table, index) => (
                          <TableRow key={index}>
                            <TableCell>{table.table}</TableCell>
                            <TableCell align="right">{table.rowCount.toLocaleString()}</TableCell>
                            <TableCell align="right">{table.size}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Component Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Component Details: {selectedComponent?.component}
        </DialogTitle>
        <DialogContent>
          {selectedComponent && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Status: <Chip 
                  label={selectedComponent.status} 
                  color={getStatusColor(selectedComponent.status) as any}
                  size="small"
                />
              </Typography>
              <Typography variant="body1" gutterBottom>
                Message: {selectedComponent.message}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Response Time: {selectedComponent.responseTime}ms
              </Typography>
              <Typography variant="body1" gutterBottom>
                Timestamp: {new Date(selectedComponent.timestamp).toLocaleString()}
              </Typography>
              
              {selectedComponent.details && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Details:
                  </Typography>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '16px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px'
                  }}>
                    {JSON.stringify(selectedComponent.details, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MasterDataMonitoringDashboard;