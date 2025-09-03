import { Achievement } from './activity';

export interface GamificationState {
  points: number;
  level: number;
  achievements: Achievement[];
  streaks: StreakInfo;
  recentMilestones: Achievement[];
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface PointsTransaction {
  id: string;
  childId: string;
  amount: number;
  reason: string;
  timestamp: string;
  category?: string;
}

export interface LevelInfo {
  level: number;
  pointsRequired: number;
  title: string;
}

export const LEVEL_THRESHOLDS: LevelInfo[] = [
  { level: 1, pointsRequired: 0, title: 'Beginner' },
  { level: 2, pointsRequired: 100, title: 'Explorer' },
  { level: 3, pointsRequired: 250, title: 'Adventurer' },
  { level: 4, pointsRequired: 500, title: 'Scholar' },
  { level: 5, pointsRequired: 1000, title: 'Master' },
  { level: 6, pointsRequired: 2000, title: 'Champion' },
  { level: 7, pointsRequired: 3500, title: 'Genius' },
  { level: 8, pointsRequired: 5000, title: 'Wizard' },
  { level: 9, pointsRequired: 7500, title: 'Sage' },
  { level: 10, pointsRequired: 10000, title: 'Legend' },
];

export interface CelebrationConfig {
  type: 'achievement' | 'level' | 'streak' | 'milestone' | 'badge';
  title: string;
  message: string;
  icon: string;
  animation: 'confetti' | 'fireworks' | 'stars' | 'bounce';
  sound?: string;
}

export type BadgeCategory = 
  | 'math' 
  | 'science' 
  | 'reading' 
  | 'writing' 
  | 'social' 
  | 'art' 
  | 'music' 
  | 'completion' 
  | 'streak';

export interface BadgeProgress {
  category: BadgeCategory;
  earned: number;
  total: number;
  nextBadge?: {
    name: string;
    description: string;
    requiredPoints: number;
    currentPoints: number;
  };
}

export interface AchievementRarity {
  label: string;
  color: string;
  percentOwned: number;
}