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
} from '@mui/material';
import { analyticsApi } from '../../services/api';
import { ChildProfile } from '../../types/child';
import { ProgressReport, TimeFrame, PerformanceTrend, SubjectPerformance } from '../../types/analytics';
import ProgressSummary from './ProgressSummary';
import PerformanceTrendChart from './PerformanceTrendChart';
import SubjectPerformanceChart from './SubjectPerformanceChart';
import AlertsPanel from './AlertsPanel';
import TimeFrameSelector from './TimeFrameSelector';

interface AnalyticsDashboardProps {
  children: ChildProfile[];
  selectedChildId?: string;
  onSelectChild: (childId: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  children, 
  selectedChildId, 
  onSelectChild 
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  
  const [progressReport, setProgressReport] = useState<ProgressReport | null>(null);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      onSelectChild(children[0].id);
    }
  }, [children, selectedChildId, onSelectChild]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!selectedChildId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [report, trends, subjects] = await Promise.all([
          analyticsApi.getProgressReport(selectedChildId, timeFrame),
          analyticsApi.getPerformanceTrends(selectedChildId, timeFrame),
          analyticsApi.getSubjectPerformance(selectedChildId)
        ]);
        
        setProgressReport(report);
        setPerformanceTrends(trends);
        setSubjectPerformance(subjects);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [selectedChildId, timeFrame]);

  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  const handleChildChange = (event: any) => {
    onSelectChild(event.target.value);
  };

  if (loading && !progressReport) {
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

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h5" fontWeight="bold">
          Learning Analytics Dashboard
        </Typography>
        
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

      {progressReport && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardHeader title="Progress Summary" />
              <CardContent>
                <ProgressSummary report={progressReport} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <AlertsPanel childId={selectedChildId} />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {performanceTrends.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Performance Trends" />
              <CardContent>
                <PerformanceTrendChart trends={performanceTrends} />
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {subjectPerformance.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Subject Performance" />
              <CardContent>
                <SubjectPerformanceChart subjects={subjectPerformance} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;