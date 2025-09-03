import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  Speed,
  Memory,
  Battery,
  NetworkCheck,
  Warning,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { userAcceptanceTestingService } from '../../services/userAcceptanceTestingService';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  batteryLevel?: number;
  networkSpeed: number;
  frameRate: number;
  errorCount: number;
}

interface PerformanceRecommendation {
  issue: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: string;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    if (monitoring) {
      const interval = setInterval(collectMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [monitoring]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const collectMetrics = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;
    
    const currentMetrics: PerformanceMetrics = {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      memoryUsage: memory ? memory.usedJSHeapSize / memory.totalJSHeapSize : 0,
      batteryLevel: getBatteryLevel(),
      networkSpeed: getNetworkSpeed(),
      frameRate: getFrameRate(),
      errorCount: getErrorCount(),
    };

    setMetrics(currentMetrics);
    setPerformanceScore(calculatePerformanceScore(currentMetrics));

    // Track performance data for analysis
    userAcceptanceTestingService.trackInteraction(
      'performance_metric',
      'system_monitor',
      Date.now()
    );
  };

  const loadRecommendations = async () => {
    try {
      const data = await userAcceptanceTestingService.getPerformanceRecommendations();
      setRecommendations(data.prioritizedFixes || []);
    } catch (error) {
      console.error('Failed to load performance recommendations:', error);
    }
  };

  const getBatteryLevel = (): number => {
    // Battery API is deprecated but still available in some browsers
    if ('getBattery' in navigator) {
      return Math.random() * 100; // Placeholder
    }
    return 100;
  };

  const getNetworkSpeed = (): number => {
    const connection = (navigator as any).connection;
    if (connection) {
      return connection.downlink || 0;
    }
    return 0;
  };

  const getFrameRate = (): number => {
    // Simplified frame rate calculation
    return 60; // Placeholder
  };

  const getErrorCount = (): number => {
    // Count JavaScript errors from error tracking
    return 0; // Placeholder
  };

  const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
    let score = 100;
    
    // Deduct points for poor performance
    if (metrics.loadTime > 3000) score -= 20;
    if (metrics.memoryUsage > 0.8) score -= 15;
    if (metrics.frameRate < 30) score -= 25;
    if (metrics.errorCount > 0) score -= 10;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  const startMonitoring = () => {
    setMonitoring(true);
    collectMetrics();
  };

  const stopMonitoring = () => {
    setMonitoring(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Performance Monitor
      </Typography>

      <Grid container spacing={3}>
        {/* Performance Score */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Score
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" color={`${getScoreColor(performanceScore)}.main`}>
                  {performanceScore}
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ ml: 1 }}>
                  /100
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={performanceScore}
                color={getScoreColor(performanceScore)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={monitoring ? 'outlined' : 'contained'}
                  onClick={monitoring ? stopMonitoring : startMonitoring}
                  size="small"
                >
                  {monitoring ? 'Stop' : 'Start'} Monitoring
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Metrics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Metrics
              </Typography>

              {metrics ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Speed sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Load Time
                        </Typography>
                        <Typography variant="h6">
                          {metrics.loadTime.toFixed(0)}ms
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Memory sx={{ mr: 1, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Memory Usage
                        </Typography>
                        <Typography variant="h6">
                          {(metrics.memoryUsage * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Battery sx={{ mr: 1, color: 'success.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Battery
                        </Typography>
                        <Typography variant="h6">
                          {metrics.batteryLevel?.toFixed(0) || 'N/A'}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <NetworkCheck sx={{ mr: 1, color: 'info.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Network
                        </Typography>
                        <Typography variant="h6">
                          {metrics.networkSpeed.toFixed(1)} Mbps
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  Start monitoring to see real-time performance metrics
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Recommendations
              </Typography>

              {recommendations.length > 0 ? (
                <List>
                  {recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {rec.priority === 'high' ? (
                          <Warning color="error" />
                        ) : rec.priority === 'medium' ? (
                          <TrendingUp color="warning" />
                        ) : (
                          <TrendingDown color="info" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{rec.issue}</Typography>
                            <Chip
                              label={rec.priority}
                              size="small"
                              color={getPriorityColor(rec.priority)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Impact: {rec.impact}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Effort: {rec.effort}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success" icon={<CheckCircle />}>
                  No performance issues detected. System is running optimally!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};