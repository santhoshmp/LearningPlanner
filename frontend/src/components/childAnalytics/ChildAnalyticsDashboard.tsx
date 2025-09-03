import React from 'react';
import { Box, Grid, Typography, Container } from '@mui/material';
import LearningStreakDisplay from './LearningStreakDisplay';
import WeeklyProgressChart from './WeeklyProgressChart';
import SubjectMasteryRadar from './SubjectMasteryRadar';
import LearningTimeTracker from './LearningTimeTracker';
import { ChildAnalyticsSummary } from '../../types/childAnalytics';

interface ChildAnalyticsDashboardProps {
  analyticsData: ChildAnalyticsSummary;
}

const ChildAnalyticsDashboard: React.FC<ChildAnalyticsDashboardProps> = ({
  analyticsData
}) => {
  const {
    learningStreaks,
    weeklyProgress,
    subjectMastery,
    timeTracking,
    weeklyGoal,
    totalActivitiesThisWeek,
    overallLevel
  } = analyticsData;

  // Get the daily streak (most common type)
  const dailyStreak = learningStreaks.find(streak => streak.streakType === 'daily') || {
    currentCount: 0,
    longestCount: 0,
    streakType: 'daily' as const,
    lastActivityDate: null,
    isActive: false
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={4} textAlign="center">
        🌟 Your Learning Journey 🌟
      </Typography>

      <Grid container spacing={3}>
        {/* Learning Streak Display */}
        <Grid item xs={12} md={6}>
          <LearningStreakDisplay
            currentStreak={dailyStreak.currentCount}
            longestStreak={dailyStreak.longestCount}
            streakType={dailyStreak.streakType}
            lastActivityDate={dailyStreak.lastActivityDate}
            isActive={dailyStreak.isActive}
          />
        </Grid>

        {/* Learning Time Tracker */}
        <Grid item xs={12} md={6}>
          <LearningTimeTracker
            todayTime={timeTracking.todayTime}
            weeklyTime={timeTracking.weeklyTime}
            monthlyTime={timeTracking.monthlyTime}
            dailyGoal={timeTracking.dailyGoal}
            subjectTimeData={timeTracking.subjectTimeData}
            dailyTimeData={timeTracking.dailyTimeData}
            averageSessionTime={timeTracking.averageSessionTime}
          />
        </Grid>

        {/* Weekly Progress Chart */}
        <Grid item xs={12} md={6}>
          <WeeklyProgressChart
            weeklyData={weeklyProgress}
            weeklyGoal={weeklyGoal}
            totalActivitiesThisWeek={totalActivitiesThisWeek}
          />
        </Grid>

        {/* Subject Mastery Radar */}
        <Grid item xs={12} md={6}>
          <SubjectMasteryRadar
            subjectData={subjectMastery}
            overallLevel={overallLevel}
          />
        </Grid>
      </Grid>

      {/* Motivational Message */}
      <Box mt={4} p={3} sx={{ 
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 3,
        textAlign: 'center',
        color: 'white'
      }}>
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Keep up the amazing work! 🎉
        </Typography>
        <Typography variant="body1">
          Every minute you spend learning makes you smarter and stronger. 
          You're doing fantastic - keep going! 💪✨
        </Typography>
      </Box>
    </Container>
  );
};

export default ChildAnalyticsDashboard;