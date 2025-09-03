import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LearningStreakDisplay from '../LearningStreakDisplay';
import WeeklyProgressChart from '../WeeklyProgressChart';
import SubjectMasteryRadar from '../SubjectMasteryRadar';
import LearningTimeTracker from '../LearningTimeTracker';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('Child Analytics Components', () => {
  test('LearningStreakDisplay renders without crashing', () => {
    const props = {
      currentStreak: 5,
      longestStreak: 10,
      streakType: 'daily' as const,
      lastActivityDate: new Date(),
      isActive: true
    };

    render(
      <TestWrapper>
        <LearningStreakDisplay {...props} />
      </TestWrapper>
    );
  });

  test('WeeklyProgressChart renders without crashing', () => {
    const weeklyData = [
      { day: 'Monday', dayShort: 'Mon', activitiesCompleted: 2, timeSpent: 30, score: 85 },
      { day: 'Tuesday', dayShort: 'Tue', activitiesCompleted: 1, timeSpent: 20, score: 90 },
    ];

    const props = {
      weeklyData,
      weeklyGoal: 10,
      totalActivitiesThisWeek: 3
    };

    render(
      <TestWrapper>
        <WeeklyProgressChart {...props} />
      </TestWrapper>
    );
  });

  test('SubjectMasteryRadar renders without crashing', () => {
    const subjectData = [
      {
        subject: 'Math',
        proficiency: 75,
        activitiesCompleted: 10,
        averageScore: 85,
        timeSpent: 5,
        level: 'Advanced' as const
      }
    ];

    const props = {
      subjectData,
      overallLevel: 'Advanced'
    };

    render(
      <TestWrapper>
        <SubjectMasteryRadar {...props} />
      </TestWrapper>
    );
  });

  test('LearningTimeTracker renders without crashing', () => {
    const props = {
      todayTime: 45,
      weeklyTime: 200,
      monthlyTime: 800,
      dailyGoal: 60,
      subjectTimeData: [
        { subject: 'Math', timeSpent: 30, percentage: 50, color: '#ff6b6b' }
      ],
      dailyTimeData: [
        { date: '2024-01-01', timeSpent: 45, day: 'Mon' }
      ],
      averageSessionTime: 25
    };

    render(
      <TestWrapper>
        <LearningTimeTracker {...props} />
      </TestWrapper>
    );
  });
});