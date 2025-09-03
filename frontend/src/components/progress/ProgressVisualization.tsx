import React from 'react';
import { Box, Typography, Card, CardContent, Grid, useTheme } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, School, Timer, Star } from '@mui/icons-material';

interface ProgressData {
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface SubjectProgress {
  subject: string;
  progress: number;
  color: string;
}

interface WeeklyProgress {
  day: string;
  activities: number;
  timeSpent: number;
}

interface ProgressVisualizationProps {
  overallProgress: ProgressData;
  subjectProgress: SubjectProgress[];
  weeklyProgress: WeeklyProgress[];
  totalActivities: number;
  completedActivities: number;
  totalTimeSpent: number; // in minutes
  averageScore: number;
  streakDays: number;
}

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  overallProgress,
  subjectProgress,
  weeklyProgress,
  totalActivities,
  completedActivities,
  totalTimeSpent,
  averageScore,
  streakDays
}) => {
  const theme = useTheme();

  const pieData = [
    { name: 'Completed', value: overallProgress.completed, color: theme.palette.success.main },
    { name: 'In Progress', value: overallProgress.inProgress, color: theme.palette.warning.main },
    { name: 'Not Started', value: overallProgress.notStarted, color: theme.palette.grey[300] }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1,
            boxShadow: theme.shadows[2]
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const StatCard = ({ icon, title, value, subtitle, color }: any) => (
    <Card sx={{ height: '100%', textAlign: 'center' }}>
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 32 } })}
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
            {value}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<School />}
            title="Activities"
            value={`${completedActivities}/${totalActivities}`}
            subtitle="Completed"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Timer />}
            title="Time Spent"
            value={`${Math.round(totalTimeSpent / 60)}h`}
            subtitle="Learning Time"
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Star />}
            title="Average Score"
            value={`${averageScore}%`}
            subtitle="Great work!"
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUp />}
            title="Streak"
            value={`${streakDays}`}
            subtitle="Days in a row!"
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Overall Progress Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📊 Overall Progress
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" justifyContent="center" gap={2} mt={2}>
                {pieData.map((entry, index) => (
                  <Box key={index} display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: entry.color,
                        borderRadius: '50%'
                      }}
                    />
                    <Typography variant="body2">
                      {entry.name}: {entry.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Subject Progress Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📚 Subject Progress
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="progress" 
                    radius={[4, 4, 0, 0]}
                    fill={theme.palette.primary.main}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Activity Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📈 Weekly Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="activities"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.light}
                    strokeWidth={3}
                    fillOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="timeSpent"
                    stroke={theme.palette.secondary.main}
                    strokeWidth={2}
                    dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <Box display="flex" justifyContent="center" gap={3} mt={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="body2">Activities Completed</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      backgroundColor: theme.palette.secondary.main,
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="body2">Time Spent (minutes)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProgressVisualization;