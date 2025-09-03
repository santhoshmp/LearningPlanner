import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  Slider,
  Button,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Brush,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ZoomIn,
  ZoomOut,
  Refresh,
  Settings,
  Fullscreen,
  Download,
  Share,
} from '@mui/icons-material';
import { TimeFrame } from '../../types/analytics';

interface InteractiveProgressChartProps {
  data: any[];
  timeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  loading?: boolean;
  error?: string | null;
  showComparison?: boolean;
  comparisonData?: any[];
}

type ChartType = 'line' | 'area' | 'bar' | 'composed';
type MetricType = 'completion' | 'score' | 'time' | 'engagement' | 'velocity';
type TimeGranularity = 'daily' | 'weekly' | 'monthly';

interface ChartSettings {
  chartType: ChartType;
  selectedMetrics: MetricType[];
  timeGranularity: TimeGranularity;
  showTrendLines: boolean;
  showMovingAverage: boolean;
  movingAveragePeriod: number;
  showBrush: boolean;
  showGrid: boolean;
  showLegend: boolean;
  smoothLines: boolean;
  fillOpacity: number;
}

const InteractiveProgressChart: React.FC<InteractiveProgressChartProps> = ({
  data,
  timeFrame,
  onTimeFrameChange,
  loading = false,
  error = null,
  showComparison = false,
  comparisonData = []
}) => {
  const [settings, setSettings] = useState<ChartSettings>({
    chartType: 'composed',
    selectedMetrics: ['completion', 'score', 'engagement'],
    timeGranularity: 'daily',
    showTrendLines: true,
    showMovingAverage: false,
    movingAveragePeriod: 7,
    showBrush: true,
    showGrid: true,
    showLegend: true,
    smoothLines: true,
    fillOpacity: 0.3
  });

  const [zoomDomain, setZoomDomain] = useState<{ left?: string; right?: string }>({});
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Process data based on time granularity
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    switch (settings.timeGranularity) {
      case 'weekly':
        return aggregateDataByWeek(data);
      case 'monthly':
        return aggregateDataByMonth(data);
      default:
        return data;
    }
  }, [data, settings.timeGranularity]);

  // Calculate moving averages
  const dataWithMovingAverages = useMemo(() => {
    if (!settings.showMovingAverage || processedData.length === 0) return processedData;

    return processedData.map((item, index) => {
      const start = Math.max(0, index - settings.movingAveragePeriod + 1);
      const slice = processedData.slice(start, index + 1);
      
      const movingAverages: any = {};
      settings.selectedMetrics.forEach(metric => {
        const values = slice.map(d => getMetricValue(d, metric)).filter(v => v !== null);
        movingAverages[`${metric}MA`] = values.length > 0 ? 
          values.reduce((sum, val) => sum + val, 0) / values.length : null;
      });

      return { ...item, ...movingAverages };
    });
  }, [processedData, settings.showMovingAverage, settings.movingAveragePeriod, settings.selectedMetrics]);

  // Calculate trend lines
  const trendLines = useMemo(() => {
    if (!settings.showTrendLines || dataWithMovingAverages.length < 2) return {};

    const trends: any = {};
    settings.selectedMetrics.forEach(metric => {
      const values = dataWithMovingAverages.map((d, i) => ({ x: i, y: getMetricValue(d, metric) }))
        .filter(point => point.y !== null);
      
      if (values.length >= 2) {
        const trend = calculateLinearRegression(values);
        trends[metric] = trend;
      }
    });

    return trends;
  }, [dataWithMovingAverages, settings.showTrendLines, settings.selectedMetrics]);

  const handleSettingChange = (setting: keyof ChartSettings, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleMetricToggle = (metric: MetricType) => {
    const newMetrics = settings.selectedMetrics.includes(metric)
      ? settings.selectedMetrics.filter(m => m !== metric)
      : [...settings.selectedMetrics, metric];
    
    handleSettingChange('selectedMetrics', newMetrics);
  };

  const handleZoom = (domain: any) => {
    if (domain) {
      setZoomDomain({ left: domain.left, right: domain.right });
    } else {
      setZoomDomain({});
    }
  };

  const resetZoom = () => {
    setZoomDomain({});
  };

  const getMetricValue = (dataPoint: any, metric: MetricType): number | null => {
    switch (metric) {
      case 'completion':
        return dataPoint.completionRate || 0;
      case 'score':
        return dataPoint.averageScore || 0;
      case 'time':
        return dataPoint.sessionTime || 0;
      case 'engagement':
        return dataPoint.engagementScore || 0;
      case 'velocity':
        return dataPoint.learningVelocity || 0;
      default:
        return null;
    }
  };

  const getMetricColor = (metric: MetricType): string => {
    const colors = {
      completion: '#8884d8',
      score: '#82ca9d',
      time: '#ffc658',
      engagement: '#ff7300',
      velocity: '#8dd1e1'
    };
    return colors[metric] || '#8884d8';
  };

  const getMetricLabel = (metric: MetricType): string => {
    const labels = {
      completion: 'Completion Rate (%)',
      score: 'Average Score (%)',
      time: 'Session Time (min)',
      engagement: 'Engagement Score',
      velocity: 'Learning Velocity'
    };
    return labels[metric] || metric;
  };

  const renderChart = () => {
    if (!dataWithMovingAverages || dataWithMovingAverages.length === 0) {
      return (
        <Alert severity="info">
          No data available for the selected time period and metrics.
        </Alert>
      );
    }

    const commonProps = {
      data: dataWithMovingAverages,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
      onClick: (data: any) => setSelectedDataPoint(data?.activePayload?.[0]?.payload),
    };

    const renderMetricLines = () => {
      return settings.selectedMetrics.map(metric => {
        const color = getMetricColor(metric);
        const label = getMetricLabel(metric);

        switch (settings.chartType) {
          case 'line':
            return (
              <Line
                key={metric}
                type={settings.smoothLines ? "monotone" : "linear"}
                dataKey={metric === 'completion' ? 'completionRate' : 
                         metric === 'score' ? 'averageScore' :
                         metric === 'time' ? 'sessionTime' :
                         metric === 'engagement' ? 'engagementScore' : 'learningVelocity'}
                stroke={color}
                strokeWidth={2}
                name={label}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            );

          case 'area':
            return (
              <Area
                key={metric}
                type={settings.smoothLines ? "monotone" : "linear"}
                dataKey={metric === 'completion' ? 'completionRate' : 
                         metric === 'score' ? 'averageScore' :
                         metric === 'time' ? 'sessionTime' :
                         metric === 'engagement' ? 'engagementScore' : 'learningVelocity'}
                stroke={color}
                fill={color}
                fillOpacity={settings.fillOpacity}
                name={label}
              />
            );

          case 'bar':
            return (
              <Bar
                key={metric}
                dataKey={metric === 'completion' ? 'completionRate' : 
                         metric === 'score' ? 'averageScore' :
                         metric === 'time' ? 'sessionTime' :
                         metric === 'engagement' ? 'engagementScore' : 'learningVelocity'}
                fill={color}
                name={label}
              />
            );

          default:
            return null;
        }
      });
    };

    const renderMovingAverageLines = () => {
      if (!settings.showMovingAverage) return null;

      return settings.selectedMetrics.map(metric => (
        <Line
          key={`${metric}-ma`}
          type="monotone"
          dataKey={`${metric}MA`}
          stroke={getMetricColor(metric)}
          strokeWidth={1}
          strokeDasharray="5 5"
          name={`${getMetricLabel(metric)} (${settings.movingAveragePeriod}-period MA)`}
          dot={false}
        />
      ));
    };

    const renderTrendLines = () => {
      if (!settings.showTrendLines) return null;

      return Object.entries(trendLines).map(([metric, trend]: [string, any]) => {
        if (!trend) return null;

        const startY = trend.slope * 0 + trend.intercept;
        const endY = trend.slope * (dataWithMovingAverages.length - 1) + trend.intercept;

        return (
          <ReferenceLine
            key={`trend-${metric}`}
            segment={[
              { x: 0, y: startY },
              { x: dataWithMovingAverages.length - 1, y: endY }
            ]}
            stroke={getMetricColor(metric as MetricType)}
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        );
      });
    };

    switch (settings.chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="dateFormatted" 
              domain={zoomDomain.left ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
            />
            <YAxis />
            <RechartsTooltip 
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: any, name: string) => [
                typeof value === 'number' ? value.toFixed(2) : value,
                name
              ]}
            />
            {settings.showLegend && <Legend />}
            {renderMetricLines()}
            {renderMovingAverageLines()}
            {renderTrendLines()}
            {settings.showBrush && (
              <Brush 
                dataKey="dateFormatted" 
                height={30}
                onChange={handleZoom}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="dateFormatted"
              domain={zoomDomain.left ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
            />
            <YAxis />
            <RechartsTooltip />
            {settings.showLegend && <Legend />}
            {renderMetricLines()}
            {settings.showBrush && (
              <Brush 
                dataKey="dateFormatted" 
                height={30}
                onChange={handleZoom}
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="dateFormatted"
              domain={zoomDomain.left ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
            />
            <YAxis />
            <RechartsTooltip />
            {settings.showLegend && <Legend />}
            {renderMetricLines()}
            {settings.showBrush && (
              <Brush 
                dataKey="dateFormatted" 
                height={30}
                onChange={handleZoom}
              />
            )}
          </BarChart>
        );

      case 'composed':
      default:
        return (
          <ComposedChart {...commonProps}>
            {settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="dateFormatted"
              domain={zoomDomain.left ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip />
            {settings.showLegend && <Legend />}
            
            {/* Areas for completion and engagement */}
            {settings.selectedMetrics.includes('completion') && (
              <Area
                yAxisId="left"
                type={settings.smoothLines ? "monotone" : "linear"}
                dataKey="completionRate"
                fill="#8884d8"
                stroke="#8884d8"
                fillOpacity={settings.fillOpacity}
                name="Completion Rate (%)"
              />
            )}
            
            {/* Bars for activities and time */}
            {settings.selectedMetrics.includes('time') && (
              <Bar
                yAxisId="right"
                dataKey="sessionTime"
                fill="#ffc658"
                name="Session Time (min)"
              />
            )}
            
            {/* Lines for scores and engagement */}
            {settings.selectedMetrics.includes('score') && (
              <Line
                yAxisId="left"
                type={settings.smoothLines ? "monotone" : "linear"}
                dataKey="averageScore"
                stroke="#82ca9d"
                strokeWidth={2}
                name="Average Score (%)"
                dot={{ r: 4 }}
              />
            )}
            
            {settings.selectedMetrics.includes('engagement') && (
              <Line
                yAxisId="left"
                type={settings.smoothLines ? "monotone" : "linear"}
                dataKey="engagementScore"
                stroke="#ff7300"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Engagement Score"
                dot={{ r: 4 }}
              />
            )}

            {renderMovingAverageLines()}
            {renderTrendLines()}
            
            {settings.showBrush && (
              <Brush 
                dataKey="dateFormatted" 
                height={30}
                onChange={handleZoom}
              />
            )}
          </ComposedChart>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading chart data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: fullscreen ? '100vh' : 'auto' }}>
      <CardHeader
        title="Interactive Progress Analytics"
        subheader={`${dataWithMovingAverages.length} data points | ${settings.selectedMetrics.length} metrics selected`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Reset Zoom">
              <IconButton onClick={resetZoom} disabled={!zoomDomain.left}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fullscreen">
              <IconButton onClick={() => setFullscreen(!fullscreen)}>
                <Fullscreen />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      
      <CardContent>
        {/* Chart Controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={settings.chartType}
                label="Chart Type"
                onChange={(e) => handleSettingChange('chartType', e.target.value)}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="composed">Combined Chart</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Granularity</InputLabel>
              <Select
                value={settings.timeGranularity}
                label="Time Granularity"
                onChange={(e) => handleSettingChange('timeGranularity', e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Metrics to Display
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(['completion', 'score', 'time', 'engagement', 'velocity'] as MetricType[]).map(metric => (
                <Chip
                  key={metric}
                  label={getMetricLabel(metric)}
                  onClick={() => handleMetricToggle(metric)}
                  color={settings.selectedMetrics.includes(metric) ? 'primary' : 'default'}
                  variant={settings.selectedMetrics.includes(metric) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Advanced Settings */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showTrendLines}
                  onChange={(e) => handleSettingChange('showTrendLines', e.target.checked)}
                />
              }
              label="Trend Lines"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showMovingAverage}
                  onChange={(e) => handleSettingChange('showMovingAverage', e.target.checked)}
                />
              }
              label="Moving Average"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showBrush}
                  onChange={(e) => handleSettingChange('showBrush', e.target.checked)}
                />
              }
              label="Zoom Brush"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.smoothLines}
                  onChange={(e) => handleSettingChange('smoothLines', e.target.checked)}
                />
              }
              label="Smooth Lines"
            />
          </Grid>

          {settings.showMovingAverage && (
            <Grid item xs={12} md={4}>
              <Typography variant="body2" gutterBottom>
                Moving Average Period: {settings.movingAveragePeriod} days
              </Typography>
              <Slider
                value={settings.movingAveragePeriod}
                onChange={(_, value) => handleSettingChange('movingAveragePeriod', value)}
                min={3}
                max={30}
                step={1}
                marks={[
                  { value: 3, label: '3' },
                  { value: 7, label: '7' },
                  { value: 14, label: '14' },
                  { value: 30, label: '30' },
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
          )}
        </Grid>

        {/* Chart */}
        <Box sx={{ width: '100%', height: fullscreen ? 'calc(100vh - 300px)' : 500 }}>
          <ResponsiveContainer>
            {renderChart()}
          </ResponsiveContainer>
        </Box>

        {/* Selected Data Point Info */}
        {selectedDataPoint && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Data Point: {selectedDataPoint.dateFormatted}
            </Typography>
            <Grid container spacing={2}>
              {settings.selectedMetrics.map(metric => {
                const value = getMetricValue(selectedDataPoint, metric);
                return (
                  <Grid item xs={6} md={3} key={metric}>
                    <Typography variant="body2" color="text.secondary">
                      {getMetricLabel(metric)}
                    </Typography>
                    <Typography variant="h6">
                      {value !== null ? value.toFixed(2) : 'N/A'}
                      {metric === 'completion' || metric === 'score' ? '%' : 
                       metric === 'time' ? ' min' : ''}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Helper functions
function aggregateDataByWeek(data: any[]): any[] {
  const weeklyData = new Map();
  
  data.forEach(item => {
    const date = new Date(item.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, {
        date: weekKey,
        dateFormatted: `Week of ${weekStart.toLocaleDateString()}`,
        items: []
      });
    }
    
    weeklyData.get(weekKey).items.push(item);
  });
  
  return Array.from(weeklyData.values()).map(week => {
    const items = week.items;
    return {
      ...week,
      completionRate: items.reduce((sum: number, item: any) => sum + (item.completionRate || 0), 0) / items.length,
      averageScore: items.reduce((sum: number, item: any) => sum + (item.averageScore || 0), 0) / items.length,
      sessionTime: items.reduce((sum: number, item: any) => sum + (item.sessionTime || 0), 0),
      engagementScore: items.reduce((sum: number, item: any) => sum + (item.engagementScore || 0), 0) / items.length,
      activitiesCompleted: items.reduce((sum: number, item: any) => sum + (item.activitiesCompleted || 0), 0),
    };
  });
}

function aggregateDataByMonth(data: any[]): any[] {
  const monthlyData = new Map();
  
  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        date: monthKey,
        dateFormatted: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        items: []
      });
    }
    
    monthlyData.get(monthKey).items.push(item);
  });
  
  return Array.from(monthlyData.values()).map(month => {
    const items = month.items;
    return {
      ...month,
      completionRate: items.reduce((sum: number, item: any) => sum + (item.completionRate || 0), 0) / items.length,
      averageScore: items.reduce((sum: number, item: any) => sum + (item.averageScore || 0), 0) / items.length,
      sessionTime: items.reduce((sum: number, item: any) => sum + (item.sessionTime || 0), 0),
      engagementScore: items.reduce((sum: number, item: any) => sum + (item.engagementScore || 0), 0) / items.length,
      activitiesCompleted: items.reduce((sum: number, item: any) => sum + (item.activitiesCompleted || 0), 0),
    };
  });
}

function calculateLinearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0 };
  
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { 
    slope: isNaN(slope) ? 0 : slope, 
    intercept: isNaN(intercept) ? 0 : intercept 
  };
}

export default InteractiveProgressChart;