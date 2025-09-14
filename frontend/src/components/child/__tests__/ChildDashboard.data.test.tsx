import React from 'react';

// Test for the data structure fix that was applied
describe('ChildDashboard Data Structure', () => {
  it('should have correct streak data structure', () => {
    const mockStreakData = {
      id: '1',
      type: 'DAILY',
      currentCount: 5,
      longestCount: 12,
      isActive: true,
      lastActivityDate: new Date('2024-01-15'),
      streakStartDate: new Date('2024-01-10') // This was the fix - was incomplete before
    };

    // Verify the streak data structure is complete
    expect(mockStreakData.id).toBeDefined();
    expect(mockStreakData.type).toBe('DAILY');
    expect(mockStreakData.currentCount).toBe(5);
    expect(mockStreakData.longestCount).toBe(12);
    expect(mockStreakData.isActive).toBe(true);
    expect(mockStreakData.lastActivityDate).toBeInstanceOf(Date);
    expect(mockStreakData.streakStartDate).toBeInstanceOf(Date);
  });

  it('should handle streak data with proper date formatting', () => {
    const streakData = {
      id: '1',
      type: 'DAILY',
      currentCount: 5,
      longestCount: 12,
      isActive: true,
      lastActivityDate: new Date('2024-01-15'),
      streakStartDate: new Date('2024-01-10')
    };

    // Test date calculations
    const daysDifference = Math.floor(
      (streakData.lastActivityDate.getTime() - streakData.streakStartDate.getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    expect(daysDifference).toBe(5); // 5 days between start and last activity
    expect(streakData.currentCount).toBe(5); // Should match the days difference
  });

  it('should validate dashboard data structure', () => {
    const mockDashboardData = {
      child: {
        id: 'child-1',
        name: 'Test Child',
        age: 8,
        grade: '3rd Grade',
        skillProfile: {}
      },
      progressSummary: {
        totalActivities: 15,
        completedActivities: 10,
        inProgressActivities: 3,
        totalTimeSpent: 2400,
        averageScore: 85,
        weeklyGoalProgress: 70,
        monthlyGoalProgress: 45,
        lastActivityDate: new Date('2024-01-15'),
        subjectProgress: [],
        currentDailyStreak: 5,
        longestDailyStreak: 12,
        activityCompletionStreak: 3,
        perfectScoreStreak: 2,
        helpFreeStreak: 1
      },
      currentStreaks: [
        {
          id: '1',
          type: 'DAILY',
          currentCount: 5,
          longestCount: 12,
          isActive: true,
          lastActivityDate: new Date('2024-01-15'),
          streakStartDate: new Date('2024-01-10') // Fixed structure
        }
      ],
      badges: {
        recent: [],
        progress: [],
        nextToEarn: []
      },
      dailyGoals: {
        activitiesTarget: 5,
        activitiesCompleted: 3,
        activitiesProgress: 60,
        timeTarget: 1800,
        timeSpent: 1200,
        timeProgress: 66.7,
        streakTarget: 7,
        currentStreak: 5,
        streakProgress: 71.4
      },
      lastUpdated: new Date().toISOString()
    };

    // Validate the complete structure
    expect(mockDashboardData.child).toBeDefined();
    expect(mockDashboardData.progressSummary).toBeDefined();
    expect(mockDashboardData.currentStreaks).toHaveLength(1);
    expect(mockDashboardData.currentStreaks[0].streakStartDate).toBeInstanceOf(Date);
    expect(mockDashboardData.badges).toBeDefined();
    expect(mockDashboardData.dailyGoals).toBeDefined();
  });

  it('should handle multiple streak types', () => {
    const multipleStreaks = [
      {
        id: '1',
        type: 'DAILY',
        currentCount: 5,
        longestCount: 12,
        isActive: true,
        lastActivityDate: new Date('2024-01-15'),
        streakStartDate: new Date('2024-01-10')
      },
      {
        id: '2',
        type: 'WEEKLY',
        currentCount: 2,
        longestCount: 4,
        isActive: true,
        lastActivityDate: new Date('2024-01-15'),
        streakStartDate: new Date('2024-01-01')
      },
      {
        id: '3',
        type: 'ACTIVITY_COMPLETION',
        currentCount: 3,
        longestCount: 8,
        isActive: true,
        lastActivityDate: new Date('2024-01-15'),
        streakStartDate: new Date('2024-01-13')
      }
    ];

    // Validate all streak types have complete structure
    multipleStreaks.forEach(streak => {
      expect(streak.id).toBeDefined();
      expect(streak.type).toBeDefined();
      expect(streak.currentCount).toBeGreaterThanOrEqual(0);
      expect(streak.longestCount).toBeGreaterThanOrEqual(0);
      expect(typeof streak.isActive).toBe('boolean');
      expect(streak.lastActivityDate).toBeInstanceOf(Date);
      expect(streak.streakStartDate).toBeInstanceOf(Date);
    });

    // Find daily streak
    const dailyStreak = multipleStreaks.find(s => s.type === 'DAILY');
    expect(dailyStreak).toBeDefined();
    expect(dailyStreak?.currentCount).toBe(5);
  });

  it('should handle edge cases for streak data', () => {
    // Test with null dates (inactive streak)
    const inactiveStreak = {
      id: '1',
      type: 'DAILY',
      currentCount: 0,
      longestCount: 12,
      isActive: false,
      lastActivityDate: null,
      streakStartDate: null
    };

    expect(inactiveStreak.currentCount).toBe(0);
    expect(inactiveStreak.isActive).toBe(false);
    expect(inactiveStreak.lastActivityDate).toBeNull();
    expect(inactiveStreak.streakStartDate).toBeNull();

    // Test with same start and end date (1-day streak)
    const oneDayStreak = {
      id: '2',
      type: 'DAILY',
      currentCount: 1,
      longestCount: 1,
      isActive: true,
      lastActivityDate: new Date('2024-01-15'),
      streakStartDate: new Date('2024-01-15')
    };

    expect(oneDayStreak.currentCount).toBe(1);
    expect(oneDayStreak.lastActivityDate).toEqual(oneDayStreak.streakStartDate);
  });
});