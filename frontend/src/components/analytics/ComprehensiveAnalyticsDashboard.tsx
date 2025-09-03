import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Checkbox,
  FormGroup,
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
  FilterList,
  Refresh,
  ExpandMore,
  Visibility,
  VisibilityOff,
  Download,
  Share,
  Settings,
  Analytics,
  Assessment,
  Timeline,
} from '@mui/icons-material';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import { masterDataService } from '../../services/masterDataService';
import { ChildProfile } from '../../types/child';
import { TimeFrame } from '../../types/analytics';
import TimeFrameSelector from './TimeFrameSelector';
import ExportReports from './ExportReports';
import LearningInsightsPanel from './LearningInsightsPanel';
import InteractiveProgressChart from './InteractiveProgressChart';

interface ComprehensiveAnalyticsDashboardProps {
  children: ChildProfile[];
  selectedChildId?: string;
  onSelectChild: (childId: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface AnalyticsFilters {
  subjects: string[];
  difficultyLevels: number[];
  showComparison: boolean;
  chartType: 'line' | 'area' | 'bar' | 'composed';
  timeGranularity: 'daily' | 'weekly' | 'monthly';
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`comprehensive-analytics-tabpanel-${index}`}
      aria-labelledby={`comprehensive-analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ComprehensiveAnalyticsDashboard: React.FC<ComprehensiveAnalyticsDashboardProps> = ({ 
  children, 
  selectedChildId, 
  onSelectChild 
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [subjectBreakdown, setSubjectBreakdown] = useState<any[]>([]);
  const [skillVisualization, setSkillVisualization] = useState<any>(null);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [filters, setFilters] = useState<AnalyticsFilters>({
    subjects: [],
    difficultyLevels: [1, 2, 3, 4, 5],
    showComparison: true,
    chartType: 'composed',
    timeGranularity: 'daily'
  });

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      onSelectChild(children[0].id);
    }
  }, [children, selectedChildId, onSelectChild]);

  const fetchComprehensiveData = useCallback(async () => {
    if (!selectedChildId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [
        comprehensive,
        timeSeries,
        subjects,
        skills,
        masterDataSubjects
      ] = await Promise.all([
        analyticsService.getComprehensiveDashboardData(selectedChildId, timeFrame),
        analyticsService.getTimeSeriesData(selectedChildId, timeFrame),
        analyticsService.getSubjectProgressBreakdown(selectedChildId, timeFrame),
        analyticsService.getSkillVisualizationData(selectedChildId),
        masterDataService.getAllSubjects()
      ]);
      
      setDashboardData(comprehensive);
      setTimeSeriesData(timeSeries);
      setSubjectBreakdown(subjects);
      setSkillVisualization(skills);
      setAvailableSubjects(masterDataSubjects);
      
      // Initialize filters with available subjects
      if (filters.subjects.length === 0 && masterDataSubjects.length > 0) {
        setFilters(prev => ({
          ...prev,
          subjects: masterDataSubjects.slice(0, 5).map(s => s.id) // Select first 5 subjects by default
        }));
      }
    } catch (err) {
      console.error('Failed to fetch comprehensive analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, timeFrame, filters.subjects.length]);

  useEffect(() => {
    fetchComprehensiveData();
  }, [fetchComprehensiveData]);

  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  const handleChildChange = (event: any) => {
    onSelectChild(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComprehensiveData();
    setRefreshing(false);
  };

  const handleFilterChange = (filterType: keyof AnalyticsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getSelectedChild = () => {
    return children.find(child => child.id === selectedChildId);
  };

  const getFilteredTimeSeriesData = () => {
    if (!timeSeriesData || filters.subjects.length === 0) return timeSeriesData;
    
    // Apply subject filtering to time series data
    return timeSeriesData.map(dataPoint => {
      // This is a simplified filter - in reality, you'd need more complex filtering
      return dataPoint;
    });
  };

  const renderOverviewMetrics = () => {
    if (!dashboardData?.overview) return null;

    const overview = dashboardData.overview;
    
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Activities</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {overview.detailedMetrics?.basic?.completedActivities || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {overview.detailedMetrics?.basic?.totalActivities || 0} total
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(overview.detailedMetrics?.basic?.completionRate || 0) * 100}
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
                {Math.round(overview.detailedMetrics?.performance?.averageScore || 0)}%
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
                {Math.round((overview.detailedMetrics?.basic?.totalTimeSpent || 0) / 60)}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(overview.detailedMetrics?.basic?.averageTimePerActivity || 0)} min avg
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Learning Velocity</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {(overview.learningVelocity?.velocity || 0).toFixed(2)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {overview.learningVelocity?.trend === 'improving' ? (
                  <TrendingUp color="success" sx={{ mr: 1 }} />
                ) : overview.learningVelocity?.trend === 'declining' ? (
                  <TrendingDown color="error" sx={{ mr: 1 }} />
                ) : (
                  <Speed color="info" sx={{ mr: 1 }} />
                )}
                <Typography variant="body2" color="text.secondary">
                  {overview.learningVelocity?.trend || 'stable'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderInteractiveChart = () => {
    const filteredData = getFilteredTimeSeriesData();
    
    if (!filteredData || filteredData.length === 0) {
      return (
        <Alert severity="info">
          No data available for the selected time period and filters.
        </Alert>
      );
    }

    const chartProps = {
      data: filteredData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (filters.chartType) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="completionRate" 
              stroke="#8884d8" 
              name="Completion Rate (%)"
              strokeWidth={2}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="averageScore" 
              stroke="#82ca9d" 
              name="Average Score (%)"
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="activitiesCompleted" 
              stroke="#ffc658" 
              name="Activities Completed"
              strokeWidth={2}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="completionRate" 
              stackId="1"
              stroke="#8884d8" 
              fill="#8884d8"
              name="Completion Rate (%)"
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="averageScore" 
              stackId="1"
              stroke="#82ca9d" 
              fill="#82ca9d"
              name="Average Score (%)"
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="activitiesCompleted" fill="#8884d8" name="Activities Completed" />
            <Bar dataKey="sessionTime" fill="#82ca9d" name="Session Time (min)" />
          </BarChart>
        );

      case 'composed':
      default:
        return (
          <ComposedChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip />
            <Legend />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="completionRate" 
              fill="#8884d8" 
              stroke="#8884d8"
              name="Completion Rate (%)"
              fillOpacity={0.3}
            />
            <Bar 
              yAxisId="right"
              dataKey="activitiesCompleted" 
              fill="#82ca9d" 
              name="Activities Completed"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="averageScore" 
              stroke="#ffc658" 
              name="Average Score (%)"
              strokeWidth={2}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="engagementScore" 
              stroke="#ff7300" 
              name="Engagement Score"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </ComposedChart>
        );
    }
  };

  const renderSubjectRadarChart = () => {
    if (!skillVisualization?.skillRadarChart) return null;

    const radarData = skillVisualization.skillRadarChart.labels.map((label: string, index: number) => ({
      subject: label,
      proficiency: skillVisualization.skillRadarChart.datasets[0]?.data[index] || 0,
      fullMark: 100
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Proficiency"
            dataKey="proficiency"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderSubjectBreakdownChart = () => {
    if (!subjectBreakdown || subjectBreakdown.length === 0) return null;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={subjectBreakdown}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ subjectName, overallProgress }) => `${subjectName}: ${overallProgress.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="overallProgress"
          >
            {subjectBreakdown.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderAdvancedFilters = () => (
    <Accordion expanded={filtersExpanded} onChange={() => setFiltersExpanded(!filtersExpanded)}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterList sx={{ mr: 1 }} />
          <Typography variant="h6">Advanced Filters</Typography>
          <Chip 
            label={`${filters.subjects.length} subjects selected`}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Subjects
            </Typography>
            <FormGroup>
              {availableSubjects.map(subject => (
                <FormControlLabel
                  key={subject.id}
                  control={
                    <Checkbox
                      checked={filters.subjects.includes(subject.id)}
                      onChange={(e) => {
                        const newSubjects = e.target.checked
                          ? [...filters.subjects, subject.id]
                          : filters.subjects.filter(s => s !== subject.id);
                        handleFilterChange('subjects', newSubjects);
                      }}
                    />
                  }
                  label={subject.displayName}
                />
              ))}
            </FormGroup>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Difficulty Levels
            </Typography>
            <Slider
              value={filters.difficultyLevels}
              onChange={(_, newValue) => handleFilterChange('difficultyLevels', newValue)}
              valueLabelDisplay="auto"
              min={1}
              max={5}
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
              ]}
              sx={{ mt: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={filters.chartType}
                label="Chart Type"
                onChange={(e) => handleFilterChange('chartType', e.target.value)}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="composed">Combined Chart</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Time Granularity</InputLabel>
              <Select
                value={filters.timeGranularity}
                label="Time Granularity"
                onChange={(e) => handleFilterChange('timeGranularity', e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showComparison}
                  onChange={(e) => handleFilterChange('showComparison', e.target.checked)}
                />
              }
              label="Show Period Comparison"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  if (loading && !dashboardData) {
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
            onClick={handleRefresh}
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
            Comprehensive Learning Analytics
          </Typography>
          {selectedChild && (
            <Typography variant="subtitle1" color="text.secondary">
              Advanced insights for {selectedChild.name}
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

          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={handleRefresh}
              disabled={refreshing}
              color="primary"
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Metrics */}
      {renderOverviewMetrics()}

      {/* Advanced Filters */}
      {renderAdvancedFilters()}

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Analytics />} label="Interactive Charts" />
          <Tab icon={<Assessment />} label="Subject Analysis" />
          <Tab icon={<Timeline />} label="Skill Proficiency" />
          <Tab icon={<Lightbulb />} label="AI Insights" />
          <Tab icon={<Download />} label="Export & Reports" />
        </Tabs>

        {/* Interactive Charts Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <InteractiveProgressChart
                data={getFilteredTimeSeriesData()}
                timeFrame={timeFrame}
                onTimeFrameChange={handleTimeFrameChange}
                loading={loading}
                error={error}
                showComparison={filters.showComparison}
                comparisonData={dashboardData?.comparativeAnalysis?.periodComparison ? [] : undefined}
              />
            </Grid>

            {filters.showComparison && dashboardData?.comparativeAnalysis && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Period-over-Period Comparison" />
                  <CardContent>
                    <Grid container spacing={2}>
                      {Object.entries(dashboardData.comparativeAnalysis.periodComparison).map(([metric, data]: [string, any]) => (
                        <Grid item xs={12} sm={6} md={3} key={metric}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Typography>
                            <Typography variant="h6">
                              {data.current?.toFixed(2) || 'N/A'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                              {data.change > 0 ? (
                                <TrendingUp color="success" sx={{ mr: 1 }} />
                              ) : data.change < 0 ? (
                                <TrendingDown color="error" sx={{ mr: 1 }} />
                              ) : (
                                <Speed color="info" sx={{ mr: 1 }} />
                              )}
                              <Typography 
                                variant="body2" 
                                color={data.change > 0 ? 'success.main' : data.change < 0 ? 'error.main' : 'text.secondary'}
                              >
                                {data.change > 0 ? '+' : ''}{data.change?.toFixed(2) || '0'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Subject Analysis Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Subject Progress Distribution" />
                <CardContent>
                  {renderSubjectBreakdownChart()}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Subject Details" />
                <CardContent>
                  <List>
                    {subjectBreakdown.slice(0, 5).map((subject, index) => (
                      <React.Fragment key={subject.subjectId}>
                        <ListItem>
                          <ListItemIcon>
                            <School color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={subject.subjectName}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Progress: {subject.overallProgress.toFixed(1)}% | 
                                  Score: {subject.averageScore.toFixed(1)}% | 
                                  Time: {Math.round(subject.timeSpent / 60)}h
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={subject.overallProgress}
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                            }
                          />
                          <Chip 
                            label={subject.proficiencyLevel}
                            size="small"
                            color={
                              subject.proficiencyLevel === 'mastered' ? 'success' :
                              subject.proficiencyLevel === 'proficient' ? 'primary' :
                              subject.proficiencyLevel === 'developing' ? 'warning' : 'default'
                            }
                          />
                        </ListItem>
                        {index < Math.min(subjectBreakdown.length, 5) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Skill Proficiency Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Skill Proficiency Radar" />
                <CardContent>
                  {renderSubjectRadarChart()}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Proficiency Levels" />
                <CardContent>
                  {skillVisualization?.subjectProficiencies?.map((proficiency: any, index: number) => (
                    <Box key={proficiency.subjectId} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {proficiency.subjectName}
                        </Typography>
                        <Chip 
                          label={proficiency.proficiencyLevel}
                          size="small"
                          color={
                            proficiency.proficiencyLevel === 'mastered' ? 'success' :
                            proficiency.proficiencyLevel === 'proficient' ? 'primary' :
                            proficiency.proficiencyLevel === 'developing' ? 'warning' : 'default'
                          }
                        />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={proficiency.proficiencyScore}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {proficiency.proficiencyScore.toFixed(1)}% proficiency
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* AI Insights Tab */}
        <TabPanel value={activeTab} index={3}>
          <LearningInsightsPanel insights={dashboardData?.insights || []} />
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

export default ComprehensiveAnalyticsDashboard;