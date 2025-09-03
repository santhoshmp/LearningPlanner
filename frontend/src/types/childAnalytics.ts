// Learning Streak Types
export interface LearningStreak {
  id: string;
  childId: string;
  streakType: 'daily' | 'weekly' | 'activity_completion' | 'perfect_score' | 'help_free';
  currentCount: number;
  longestCount: number;
  lastActivityDate: Date | null;
  streakStartDate: Date | null;
  isActive: boolean;
  milestones: StreakMilestone[];
}

export interface StreakMilestone {
  count: number;
  achievedAt: Date;
  badgeAwarded?: string;
}

// Weekly Progress Types
export interface WeeklyProgressData {
  day: string;
  dayShort: string;
  activitiesCompleted: number;
  timeSpent: number; // in minutes
  score: number; // average score for the day
  isToday?: boolean;
}

// Subject Mastery Types
export interface SubjectMasteryData {
  subject: string;
  proficiency: number; // 0-100
  activitiesCompleted: number;
  averageScore: number;
  timeSpent: number; // in hours
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

// Learning Time Types
export interface TimeSpentData {
  subject: string;
  timeSpent: number; // in minutes
  percentage: number;
  color: string;
}

export interface DailyTimeData {
  date: string;
  timeSpent: number; // in minutes
  day: string;
}

// Child Analytics Summary
export interface ChildAnalyticsSummary {
  childId: string;
  learningStreaks: LearningStreak[];
  weeklyProgress: WeeklyProgressData[];
  subjectMastery: SubjectMasteryData[];
  timeTracking: {
    todayTime: number;
    weeklyTime: number;
    monthlyTime: number;
    dailyGoal: number;
    subjectTimeData: TimeSpentData[];
    dailyTimeData: DailyTimeData[];
    averageSessionTime: number;
  };
  weeklyGoal: number;
  totalActivitiesThisWeek: number;
  overallLevel: string;
}