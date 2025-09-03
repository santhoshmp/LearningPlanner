import { Achievement } from '../types/activity';
import { 
  GamificationState, 
  StreakInfo, 
  LEVEL_THRESHOLDS, 
  CelebrationConfig, 
  BadgeCategory,
  PointsTransaction
} from '../types/gamification';
import api from './api';

class GamificationService {
  // Get the current gamification state for a child
  async getGamificationState(childId: string): Promise<GamificationState> {
    try {
      const response = await api.get(`/gamification/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch gamification state:', error);
      // Return default state if API fails
      return this.getDefaultGamificationState();
    }
  }

  // Get achievements for a child
  async getAchievements(childId: string): Promise<Achievement[]> {
    try {
      const response = await api.get(`/gamification/${childId}/achievements`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      return [];
    }
  }

  // Get achievements by category
  async getAchievementsByCategory(childId: string, category: BadgeCategory): Promise<Achievement[]> {
    try {
      const response = await api.get(`/gamification/${childId}/achievements?category=${category}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${category} achievements:`, error);
      return [];
    }
  }

  // Get streak information for a child
  async getStreakInfo(childId: string): Promise<StreakInfo> {
    try {
      const response = await api.get(`/gamification/${childId}/streak`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch streak info:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null
      };
    }
  }

  // Get points for a child
  async getPoints(childId: string): Promise<number> {
    try {
      const response = await api.get(`/gamification/${childId}/points`);
      return response.data.points;
    } catch (error) {
      console.error('Failed to fetch points:', error);
      return 0;
    }
  }

  // Get points history/transactions for a child
  async getPointsHistory(childId: string, limit: number = 10): Promise<PointsTransaction[]> {
    try {
      const response = await api.get(`/gamification/${childId}/points/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch points history:', error);
      return [];
    }
  }

  // Calculate level based on points
  calculateLevel(points: number): { level: number; title: string; progress: number; pointsToNextLevel: number } {
    let currentLevel = LEVEL_THRESHOLDS[0];
    let nextLevel = LEVEL_THRESHOLDS[1];
    
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      if (points < LEVEL_THRESHOLDS[i].pointsRequired) {
        currentLevel = LEVEL_THRESHOLDS[i - 1];
        nextLevel = LEVEL_THRESHOLDS[i];
        break;
      }
      
      if (i === LEVEL_THRESHOLDS.length - 1) {
        currentLevel = LEVEL_THRESHOLDS[i];
        nextLevel = { 
          level: currentLevel.level + 1, 
          pointsRequired: Math.round(currentLevel.pointsRequired * 1.5), 
          title: 'Master Legend' 
        };
      }
    }
    
    const pointsForCurrentLevel = currentLevel.pointsRequired;
    const pointsForNextLevel = nextLevel.pointsRequired;
    const pointsNeeded = pointsForNextLevel - pointsForCurrentLevel;
    const pointsEarned = points - pointsForCurrentLevel;
    const pointsToNextLevel = pointsForNextLevel - points;
    const progress = Math.min(100, Math.floor((pointsEarned / pointsNeeded) * 100));
    
    return {
      level: currentLevel.level,
      title: currentLevel.title,
      progress,
      pointsToNextLevel
    };
  }

  // Get badge progress for a specific category
  async getBadgeProgress(childId: string, category: BadgeCategory): Promise<{earned: number, total: number}> {
    try {
      const response = await api.get(`/gamification/${childId}/badges/progress?category=${category}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch badge progress for ${category}:`, error);
      return { earned: 0, total: 5 }; // Default values
    }
  }

  // Get celebration configuration for different achievements
  getCelebrationConfig(achievement: Achievement): CelebrationConfig {
    switch (achievement.type) {
      case 'badge':
        return {
          type: 'badge',
          title: 'New Badge Earned!',
          message: achievement.description,
          icon: '🏅',
          animation: 'confetti'
        };
      case 'milestone':
        return {
          type: 'milestone',
          title: 'Milestone Reached!',
          message: achievement.description,
          icon: '🏆',
          animation: 'fireworks',
          sound: 'milestone'
        };
      case 'streak':
        return {
          type: 'streak',
          title: 'Streak Achievement!',
          message: achievement.description,
          icon: '🔥',
          animation: 'stars'
        };
      default:
        return {
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: achievement.description,
          icon: '🌟',
          animation: 'bounce'
        };
    }
  }

  // Format points with appropriate suffix (K for thousands, M for millions)
  formatPoints(points: number): string {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    } else {
      return points.toString();
    }
  }

  // Get achievement rarity label based on percentage of users who have it
  getAchievementRarity(percentOwned: number): {label: string; color: string} {
    if (percentOwned < 1) {
      return { label: 'Legendary', color: '#FF6D00' }; // Deep Orange
    } else if (percentOwned < 5) {
      return { label: 'Epic', color: '#AA00FF' }; // Purple
    } else if (percentOwned < 15) {
      return { label: 'Rare', color: '#2962FF' }; // Blue
    } else if (percentOwned < 40) {
      return { label: 'Uncommon', color: '#00C853' }; // Green
    } else {
      return { label: 'Common', color: '#757575' }; // Grey
    }
  }

  // Get default gamification state (for new users or when API fails)
  private getDefaultGamificationState(): GamificationState {
    return {
      points: 0,
      level: 1,
      achievements: [],
      streaks: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null
      },
      recentMilestones: []
    };
  }
}

export const gamificationService = new GamificationService();