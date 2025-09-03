import React from 'react';
import { Box, Typography, Card, CardContent, LinearProgress, Chip } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AccessTime, TrendingUp, Timer, School } from '@mui/icons-material';

interface TimeSpentData {
  subject: string;
  timeSpent: number; // in minutes
  percentage: number;
  color: string;
}

interface DailyTimeData {
  date: string;
  timeSpent: number; // in minutes
  day: string;
}

interface LearningTimeTrackerProps {
  todayTime: number; // in minutes
  weeklyTime: number; // in minutes
  monthlyTime: number; // in minutes
  dailyGoal: number; // in minutes
  subjectTimeData: TimeSpentData[];
  dailyTimeData: DailyTimeData[];
  averageSessionTime: number; // in minutes
}

const LearningTimeTracker: React.FC<LearningTimeTrackerProps> = ({
  todayTime,
  weeklyTime,
  monthlyTime,
  dailyGoal,
  subjectTimeData,
  dailyTimeData,
  averageSessionTime
}) => {
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const todayProgress = (todayTime / dailyGoal) * 100;
  const isGoalMet = todayTime >= dailyGoal;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: 2,
            p: 1.5,
            boxShadow: 2
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {data.subject}
          </Typography>
          <Typography variant="body2">
            {formatTime(data.timeSpent)} ({data.percentage}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const getTimeIcon = (time: number) => {
    if (time >= dailyGoal) return '🎯';
    if (time >= dailyGoal * 0.75) return '🔥';
    if (time >= dailyGoal * 0.5) return '⚡';
    if (time > 0) return '🌱';
    return '😴';
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            Learning Time Tracker
          </Typography>
          <Chip 
            icon={<Timer />}
            label={formatTime(todayTime)}
            color={isGoalMet ? 'success' : 'primary'}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        {/* Today's Progress */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Today's Goal Progress {getTimeIcon(todayTime)}
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={isGoalMet ? 'success.main' : 'primary'}>
              {formatTime(todayTime)} / {formatTime(dailyGoal)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(todayProgress, 100)}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: isGoalMet ? '#4caf50' : '#2196f3'
              }
            }}
          />
        </Box> 
       {/* Time Statistics */}
        <Box display="flex" justifyContent="space-around" mb={3}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatTime(weeklyTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This Week
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatTime(monthlyTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This Month
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatTime(averageSessionTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Session
            </Typography>
          </Box>
        </Box>

        {/* Subject Time Distribution */}
        {subjectTimeData.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>
              Time by Subject
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectTimeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                      dataKey="timeSpent"
                    >
                      {subjectTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              <Box flex={1}>
                {subjectTimeData.map((subject, index) => (
                  <Box key={subject.subject} display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: subject.color
                      }}
                    />
                    <Typography variant="body2" flex={1}>
                      {subject.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(subject.timeSpent)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Weekly Trend */}
        {dailyTimeData.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>
              7-Day Learning Trend
            </Typography>
            <Box sx={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#666' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => [formatTime(value), 'Time Spent']}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="timeSpent"
                    stroke="#2196f3"
                    fill="url(#colorGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        {/* Encouragement Message */}
        <Box p={2} sx={{ backgroundColor: '#f8f9fa', borderRadius: 2 }}>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            {isGoalMet 
              ? "🎉 Fantastic! You've reached your daily learning goal!"
              : `You're ${formatTime(dailyGoal - todayTime)} away from your daily goal! Keep going! 💪`
            }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LearningTimeTracker;