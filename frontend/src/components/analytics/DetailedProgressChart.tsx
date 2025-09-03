import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';
import { DetailedProgressData } from '../../types/analytics';

interface DetailedProgressChartProps {
  data: DetailedProgressData;
}

type ChartType = 'line' | 'area' | 'bar' | 'composed';
type MetricType = 'completion' | 'score' | 'time' | 'velocity';

const DetailedProgressChart: React.FC<DetailedProgressChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartType>('composed');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('completion');

  // Generate sample time-series data based on the detailed progress data
  // In a real implementation, this would come from the backend
  const generateTimeSeriesData = () => {
    const days = 30;
    const timeSeriesData = [];
    const startDate = new Date(data.timeFrame.start);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Generate realistic sample data based on the overall metrics
      const baseCompletion = data.detailedMetrics.completionRate * 100;
      const baseScore = data.detailedMetrics.averageScore;
      const baseTime = data.detailedMetrics.averageSessionDuration;
      
      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completionRate: Math.max(0, Math.min(100, baseCompletion + (Math.random() - 0.5) * 20)),
        averageScore: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 15)),
        sessionTime: Math.max(0, baseTime + (Math.random() - 0.5) * 20),
        activitiesCompleted: Math.floor(Math.random() * 5),
        helpRequests: Math.floor(Math.random() * 3),
        engagementScore: Math.max(0, Math.min(100, 70 + (Math.random() - 0.5) * 30)),
      });
    }
    
    return timeSeriesData;
  };

  const timeSeriesData = generateTimeSeriesData();

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: ChartType,
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  const handleMetricChange = (event: any) => {
    setSelectedMetric(event.target.value as MetricType);
  };

  const renderChart = () => {
    const commonProps = {
      data: timeSeriesData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedMetric === 'completion' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="#8884d8" 
                  name="Completion Rate (%)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="activitiesCompleted" 
                  stroke="#82ca9d" 
                  name="Activities Completed"
                  strokeWidth={2}
                />
              </>
            )}
            {selectedMetric === 'score' && (
              <Line 
                type="monotone" 
                dataKey="averageScore" 
                stroke="#ffc658" 
                name="Average Score (%)"
                strokeWidth={2}
              />
            )}
            {selectedMetric === 'time' && (
              <Line 
                type="monotone" 
                dataKey="sessionTime" 
                stroke="#ff7300" 
                name="Session Time (min)"
                strokeWidth={2}
              />
            )}
            {selectedMetric === 'velocity' && (
              <Line 
                type="monotone" 
                dataKey="engagementScore" 
                stroke="#8dd1e1" 
                name="Engagement Score"
                strokeWidth={2}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedMetric === 'completion' && (
              <>
                <Area 
                  type="monotone" 
                  dataKey="completionRate" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8"
                  name="Completion Rate (%)"
                />
                <Area 
                  type="monotone" 
                  dataKey="activitiesCompleted" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  name="Activities Completed"
                />
              </>
            )}
            {selectedMetric === 'score' && (
              <Area 
                type="monotone" 
                dataKey="averageScore" 
                stroke="#ffc658" 
                fill="#ffc658"
                name="Average Score (%)"
              />
            )}
            {selectedMetric === 'time' && (
              <Area 
                type="monotone" 
                dataKey="sessionTime" 
                stroke="#ff7300" 
                fill="#ff7300"
                name="Session Time (min)"
              />
            )}
            {selectedMetric === 'velocity' && (
              <Area 
                type="monotone" 
                dataKey="engagementScore" 
                stroke="#8dd1e1" 
                fill="#8dd1e1"
                name="Engagement Score"
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedMetric === 'completion' && (
              <>
                <Bar dataKey="completionRate" fill="#8884d8" name="Completion Rate (%)" />
                <Bar dataKey="activitiesCompleted" fill="#82ca9d" name="Activities Completed" />
              </>
            )}
            {selectedMetric === 'score' && (
              <Bar dataKey="averageScore" fill="#ffc658" name="Average Score (%)" />
            )}
            {selectedMetric === 'time' && (
              <Bar dataKey="sessionTime" fill="#ff7300" name="Session Time (min)" />
            )}
            {selectedMetric === 'velocity' && (
              <Bar dataKey="engagementScore" fill="#8dd1e1" name="Engagement Score" />
            )}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
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
              yAxisId="right"
              type="monotone" 
              dataKey="helpRequests" 
              stroke="#ff7300" 
              name="Help Requests"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Metric</InputLabel>
          <Select
            value={selectedMetric}
            label="Metric"
            onChange={handleMetricChange}
          >
            <MenuItem value="completion">Completion</MenuItem>
            <MenuItem value="score">Performance</MenuItem>
            <MenuItem value="time">Time Spent</MenuItem>
            <MenuItem value="velocity">Engagement</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          size="small"
        >
          <ToggleButton value="line">Line</ToggleButton>
          <ToggleButton value="area">Area</ToggleButton>
          <ToggleButton value="bar">Bar</ToggleButton>
          <ToggleButton value="composed">Combined</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </Box>

      {/* Chart Description */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {selectedMetric === 'completion' && 'Shows daily completion rates and number of activities completed over time.'}
          {selectedMetric === 'score' && 'Displays average performance scores across all completed activities.'}
          {selectedMetric === 'time' && 'Tracks time spent in learning sessions and study duration patterns.'}
          {selectedMetric === 'velocity' && 'Measures engagement levels and learning momentum over time.'}
        </Typography>
      </Box>
    </Box>
  );
};

export default DetailedProgressChart;