import React from 'react';
import { Box, Typography, Card, CardContent, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Star, CheckCircle } from '@mui/icons-material';

interface WeeklyProgressData {
  day: string;
  dayShort: string;
  activitiesCompleted: number;
  timeSpent: number; // in minutes
  score: number; // average score for the day
  isToday?: boolean;
}

interface WeeklyProgressChartProps {
  weeklyData: WeeklyProgressData[];
  weeklyGoal: number;
  totalActivitiesThisWeek: number;
}

const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  weeklyData,
  weeklyGoal,
  totalActivitiesThisWeek
}) => {
  const theme = useTheme();
  
  const goalProgress = (totalActivitiesThisWeek / weeklyGoal) * 100;
  const isGoalMet = totalActivitiesThisWeek >= weeklyGoal;

  const getBarColor = (entry: WeeklyProgressData, index: number) => {
    if (entry.isToday) return '#ff6b6b';
    if (entry.activitiesCompleted >= 3) return '#4caf50';
    if (entry.activitiesCompleted >= 1) return '#ff9800';
    return '#e0e0e0';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: 2,
            p: 2,
            boxShadow: 2
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" color="primary">
            {data.day}
          </Typography>
          <Typography variant="body2">
            Activities: {data.activitiesCompleted}
          </Typography>
          <Typography variant="body2">
            Time: {data.timeSpent} minutes
          </Typography>
          {data.score > 0 && (
            <Typography variant="body2">
              Avg Score: {data.score}%
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  const getDayEmoji = (dayShort: string, activitiesCompleted: number) => {
    if (activitiesCompleted === 0) return '😴';
    if (activitiesCompleted >= 3) return '🌟';
    if (activitiesCompleted >= 1) return '😊';
    return '😐';
  };

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            This Week's Progress
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {isGoalMet ? (
              <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
            ) : (
              <TrendingUp sx={{ color: '#ff9800', fontSize: 20 }} />
            )}
            <Typography variant="body2" color={isGoalMet ? 'success.main' : 'text.secondary'}>
              {totalActivitiesThisWeek}/{weeklyGoal} activities
            </Typography>
          </Box>
        </Box>

        {/* Goal Progress Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Weekly Goal Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={isGoalMet ? 'success.main' : 'primary'}>
              {Math.round(goalProgress)}%
            </Typography>
          </Box>
          <Box 
            sx={{ 
              height: 8, 
              backgroundColor: '#f0f0f0', 
              borderRadius: 4,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${Math.min(goalProgress, 100)}%`,
                background: isGoalMet 
                  ? 'linear-gradient(90deg, #4caf50, #8bc34a)'
                  : 'linear-gradient(90deg, #2196f3, #03dac6)',
                borderRadius: 4,
                transition: 'width 1s ease-out'
              }}
            />
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height: 200, mb: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="dayShort" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="activitiesCompleted" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {weeklyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Day Summary */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {weeklyData.map((day, index) => (
            <Box key={day.dayShort} textAlign="center">
              <Typography variant="h4" component="div">
                {getDayEmoji(day.dayShort, day.activitiesCompleted)}
              </Typography>
              <Typography 
                variant="caption" 
                color={day.isToday ? 'primary' : 'text.secondary'}
                fontWeight={day.isToday ? 'bold' : 'normal'}
              >
                {day.dayShort}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Encouragement Message */}
        <Box mt={2} p={2} sx={{ backgroundColor: '#f8f9fa', borderRadius: 2 }}>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            {isGoalMet 
              ? "🎉 Amazing! You've reached your weekly goal! Keep up the fantastic work!"
              : `You're doing great! ${weeklyGoal - totalActivitiesThisWeek} more activities to reach your goal! 💪`
            }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeeklyProgressChart;