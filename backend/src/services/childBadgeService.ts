import { PrismaClient, Achievement, AchievementType, StreakType } from '@prisma/client';
import { logger } from '../utils/logger';
import { redisService } from './redisService';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  type: AchievementType;
  criteria: BadgeCriteria;
  points: number;
  celebrationConfig: CelebrationConfig;
}

export interface BadgeCriteria {
  type: 'activity_completion' | 'streak' | 'score_threshold' | 'time_based' | 'subject_mastery' | 'help_independence';
  threshold: number;
  subjectId?: string;
  streakType?: StreakType;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  additionalConditions?: Record<string, any>;
}

export interface CelebrationConfig {
  animationType: 'confetti' | 'fireworks' | 'stars' | 'bounce';
  duration: number; // in milliseconds
  soundEffect?: string;
  message: string;
  icon: string;
}

export interface BadgeProgress {
  badgeId: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  estimatedTimeToCompletion?: string;
}

export interface BadgeEligibilityResult {
  eligible: boolean;
  progress: BadgeProgress;
  nextMilestone?: number;
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
  | 'streak'
  | 'excellence'
  | 'persistence'
  | 'independence';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface BadgeAwardResult {
  success: boolean;
  badge?: Achievement;
  alreadyEarned?: boolean;
  error?: string;
}

export class ChildBadgeService {
  private prisma: PrismaClient;
  private badgeDefinitions: Map<string, BadgeDefinition>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.badgeDefinitions = new Map();
    this.initializeBadgeDefinitions();
  }

  /**
   * Initialize predefined badge definitions
   */
  private initializeBadgeDefinitions(): void {
    const badges: BadgeDefinition[] = [
      // Activity Completion Badges
      {
        id: 'first_activity',
        name: 'First Steps',
        description: 'Complete your first learning activity',
        iconUrl: '/badges/first-steps.svg',
        category: 'completion',
        rarity: 'common',
        type: 'BADGE',
        criteria: {
          type: 'activity_completion',
          threshold: 1
        },
        points: 10,
        celebrationConfig: {
          animationType: 'confetti',
          duration: 3000,
          message: 'Congratulations! You completed your first activity!',
          icon: '🎉'
        }
      },
      {
        id: 'activity_champion',
        name: 'Activity Champion',
        description: 'Complete 10 learning activities',
        iconUrl: '/badges/activity-champion.svg',
        category: 'completion',
        rarity: 'uncommon',
        type: 'BADGE',
        criteria: {
          type: 'activity_completion',
          threshold: 10
        },
        points: 50,
        celebrationConfig: {
          animationType: 'fireworks',
          duration: 4000,
          message: 'Amazing! You are an Activity Champion!',
          icon: '🏆'
        }
      },
      {
        id: 'century_club',
        name: 'Century Club',
        description: 'Complete 100 learning activities',
        iconUrl: '/badges/century-club.svg',
        category: 'completion',
        rarity: 'rare',
        type: 'MILESTONE',
        criteria: {
          type: 'activity_completion',
          threshold: 100
        },
        points: 200,
        celebrationConfig: {
          animationType: 'stars',
          duration: 5000,
          message: 'Incredible! Welcome to the Century Club!',
          icon: '⭐'
        }
      },

      // Streak Badges
      {
        id: 'daily_learner',
        name: 'Daily Learner',
        description: 'Learn for 7 days in a row',
        iconUrl: '/badges/daily-learner.svg',
        category: 'streak',
        rarity: 'common',
        type: 'BADGE',
        criteria: {
          type: 'streak',
          threshold: 7,
          streakType: 'DAILY'
        },
        points: 25,
        celebrationConfig: {
          animationType: 'confetti',
          duration: 3000,
          message: 'Great job! You are a Daily Learner!',
          icon: '🔥'
        }
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 30-day learning streak',
        iconUrl: '/badges/streak-master.svg',
        category: 'streak',
        rarity: 'epic',
        type: 'MILESTONE',
        criteria: {
          type: 'streak',
          threshold: 30,
          streakType: 'DAILY'
        },
        points: 150,
        celebrationConfig: {
          animationType: 'fireworks',
          duration: 5000,
          message: 'Outstanding! You are a true Streak Master!',
          icon: '🔥'
        }
      },

      // Excellence Badges
      {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get a perfect score on an activity',
        iconUrl: '/badges/perfect-score.svg',
        category: 'excellence',
        rarity: 'uncommon',
        type: 'BADGE',
        criteria: {
          type: 'score_threshold',
          threshold: 100
        },
        points: 30,
        celebrationConfig: {
          animationType: 'stars',
          duration: 3000,
          message: 'Perfect! You got a 100% score!',
          icon: '💯'
        }
      },
      {
        id: 'excellence_streak',
        name: 'Excellence Streak',
        description: 'Get perfect scores on 5 activities in a row',
        iconUrl: '/badges/excellence-streak.svg',
        category: 'excellence',
        rarity: 'rare',
        type: 'BADGE',
        criteria: {
          type: 'streak',
          threshold: 5,
          streakType: 'PERFECT_SCORE'
        },
        points: 75,
        celebrationConfig: {
          animationType: 'fireworks',
          duration: 4000,
          message: 'Exceptional! You are on an excellence streak!',
          icon: '🌟'
        }
      },

      // Independence Badges
      {
        id: 'independent_learner',
        name: 'Independent Learner',
        description: 'Complete 5 activities without asking for help',
        iconUrl: '/badges/independent-learner.svg',
        category: 'independence',
        rarity: 'uncommon',
        type: 'BADGE',
        criteria: {
          type: 'help_independence',
          threshold: 5
        },
        points: 40,
        celebrationConfig: {
          animationType: 'bounce',
          duration: 3000,
          message: 'Great job! You are learning independently!',
          icon: '🎯'
        }
      },

      // Subject-Specific Badges
      {
        id: 'math_wizard',
        name: 'Math Wizard',
        description: 'Complete 20 math activities',
        iconUrl: '/badges/math-wizard.svg',
        category: 'math',
        rarity: 'uncommon',
        type: 'BADGE',
        criteria: {
          type: 'subject_mastery',
          threshold: 20,
          subjectId: 'mathematics'
        },
        points: 60,
        celebrationConfig: {
          animationType: 'stars',
          duration: 4000,
          message: 'Magical! You are a Math Wizard!',
          icon: '🧙‍♂️'
        }
      },
      {
        id: 'reading_champion',
        name: 'Reading Champion',
        description: 'Complete 15 reading activities',
        iconUrl: '/badges/reading-champion.svg',
        category: 'reading',
        rarity: 'uncommon',
        type: 'BADGE',
        criteria: {
          type: 'subject_mastery',
          threshold: 15,
          subjectId: 'english'
        },
        points: 55,
        celebrationConfig: {
          animationType: 'confetti',
          duration: 4000,
          message: 'Fantastic! You are a Reading Champion!',
          icon: '📚'
        }
      }
    ];

    badges.forEach(badge => {
      this.badgeDefinitions.set(badge.id, badge);
    });

    logger.info(`Initialized ${badges.length} badge definitions`);
  }

  /**
   * Check badge eligibility for a child after an activity completion
   */
  async checkBadgeEligibility(childId: string, sessionId?: string): Promise<BadgeAwardResult[]> {
    try {
      const results: BadgeAwardResult[] = [];
      
      // Check cache for existing achievements first
      const cacheKey = `child_achievements:${childId}`;
      let existingAchievements = await redisService.getCacheObject<Achievement[]>(cacheKey);
      
      if (!existingAchievements) {
        // Get child's current achievements to avoid duplicates
        existingAchievements = await this.prisma.achievement.findMany({
          where: { childId },
          select: { id: true, type: true, title: true, createdAt: true }
        });
        
        // Cache for 5 minutes
        await redisService.setCacheObject(cacheKey, existingAchievements, 5 * 60);
      }

      const existingBadgeIds = new Set(
        existingAchievements
          .filter(a => a.type === 'BADGE' || a.type === 'MILESTONE')
          .map(a => this.getBadgeIdFromTitle(a.title))
      );

      // Check each badge definition
      for (const [badgeId, badgeDefinition] of this.badgeDefinitions) {
        if (existingBadgeIds.has(badgeId)) {
          continue; // Already earned
        }

        const eligibilityResult = await this.checkSingleBadgeEligibility(childId, badgeDefinition);
        
        if (eligibilityResult.eligible) {
          const awardResult = await this.awardBadge(childId, badgeDefinition, sessionId);
          results.push(awardResult);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error checking badge eligibility:', error);
      return [];
    }
  }

  /**
   * Check eligibility for a specific badge
   */
  private async checkSingleBadgeEligibility(
    childId: string, 
    badgeDefinition: BadgeDefinition
  ): Promise<BadgeEligibilityResult> {
    try {
      const { criteria } = badgeDefinition;
      let currentValue = 0;
      let eligible = false;

      switch (criteria.type) {
        case 'activity_completion':
          currentValue = await this.getCompletedActivitiesCount(childId, criteria.subjectId);
          eligible = currentValue >= criteria.threshold;
          break;

        case 'streak':
          currentValue = await this.getCurrentStreakCount(childId, criteria.streakType!);
          eligible = currentValue >= criteria.threshold;
          break;

        case 'score_threshold':
          const hasHighScore = await this.hasAchievedScoreThreshold(childId, criteria.threshold);
          currentValue = hasHighScore ? criteria.threshold : 0;
          eligible = hasHighScore;
          break;

        case 'help_independence':
          currentValue = await this.getHelpFreeActivitiesCount(childId);
          eligible = currentValue >= criteria.threshold;
          break;

        case 'subject_mastery':
          currentValue = await this.getSubjectActivitiesCount(childId, criteria.subjectId!);
          eligible = currentValue >= criteria.threshold;
          break;

        default:
          logger.warn(`Unknown badge criteria type: ${criteria.type}`);
          break;
      }

      const progressPercentage = Math.min((currentValue / criteria.threshold) * 100, 100);

      return {
        eligible,
        progress: {
          badgeId: badgeDefinition.id,
          currentValue,
          targetValue: criteria.threshold,
          progressPercentage,
          estimatedTimeToCompletion: this.estimateTimeToCompletion(
            currentValue, 
            criteria.threshold, 
            criteria.type
          )
        }
      };
    } catch (error) {
      logger.error(`Error checking badge eligibility for ${badgeDefinition.id}:`, error);
      return {
        eligible: false,
        progress: {
          badgeId: badgeDefinition.id,
          currentValue: 0,
          targetValue: badgeDefinition.criteria.threshold,
          progressPercentage: 0
        }
      };
    }
  }

  /**
   * Award a badge to a child
   */
  private async awardBadge(
    childId: string, 
    badgeDefinition: BadgeDefinition, 
    sessionId?: string
  ): Promise<BadgeAwardResult> {
    try {
      // Check if badge already exists
      const existingBadge = await this.prisma.achievement.findFirst({
        where: {
          childId,
          title: badgeDefinition.name,
          type: badgeDefinition.type
        }
      });

      if (existingBadge) {
        return {
          success: false,
          alreadyEarned: true,
          badge: existingBadge
        };
      }

      // Create the achievement record
      const achievement = await this.prisma.achievement.create({
        data: {
          childId,
          type: badgeDefinition.type,
          title: badgeDefinition.name,
          description: badgeDefinition.description,
          iconUrl: badgeDefinition.iconUrl,
          points: badgeDefinition.points,
          celebrationShown: false,
          parentNotified: false,
          earnedInSession: sessionId
        }
      });

      // Update session badge count if session provided
      if (sessionId) {
        await this.updateSessionBadgeCount(sessionId);
      }

      // Log the badge award
      logger.info(`Badge awarded: ${badgeDefinition.name} to child ${childId}`);

      // Invalidate badge-related caches
      await this.invalidateBadgeCache(childId);

      // Send parental notification for achievement
      try {
        const { parentalNotificationService } = await import('./parentalNotificationService');
        await parentalNotificationService.sendAchievementNotification(childId, achievement.id);
      } catch (notificationError) {
        logger.error('Error sending achievement notification:', notificationError);
        // Don't fail badge awarding if notification fails
      }

      return {
        success: true,
        badge: achievement
      };
    } catch (error) {
      logger.error(`Error awarding badge ${badgeDefinition.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get badge progress for all badges for a child
   */
  async getBadgeProgress(childId: string): Promise<BadgeProgress[]> {
    try {
      const progressList: BadgeProgress[] = [];

      // Get existing achievements to filter out earned badges
      const existingAchievements = await this.prisma.achievement.findMany({
        where: { childId },
        select: { title: true, type: true }
      });

      const earnedBadgeIds = new Set(
        existingAchievements
          .filter(a => a.type === 'BADGE' || a.type === 'MILESTONE')
          .map(a => this.getBadgeIdFromTitle(a.title))
      );

      // Check progress for each badge definition
      for (const [badgeId, badgeDefinition] of this.badgeDefinitions) {
        if (earnedBadgeIds.has(badgeId)) {
          // Badge already earned, show 100% progress
          progressList.push({
            badgeId,
            currentValue: badgeDefinition.criteria.threshold,
            targetValue: badgeDefinition.criteria.threshold,
            progressPercentage: 100
          });
        } else {
          const eligibilityResult = await this.checkSingleBadgeEligibility(childId, badgeDefinition);
          progressList.push(eligibilityResult.progress);
        }
      }

      return progressList;
    } catch (error) {
      logger.error('Error getting badge progress:', error);
      return [];
    }
  }

  /**
   * Get badges by category
   */
  getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
    return Array.from(this.badgeDefinitions.values())
      .filter(badge => badge.category === category);
  }

  /**
   * Get badges by rarity
   */
  getBadgesByRarity(rarity: BadgeRarity): BadgeDefinition[] {
    return Array.from(this.badgeDefinitions.values())
      .filter(badge => badge.rarity === rarity);
  }

  /**
   * Get celebration configuration for a badge
   */
  getCelebrationConfig(badgeId: string): CelebrationConfig | null {
    const badge = this.badgeDefinitions.get(badgeId);
    return badge ? badge.celebrationConfig : null;
  }

  /**
   * Mark celebration as shown for an achievement
   */
  async markCelebrationShown(achievementId: string): Promise<void> {
    try {
      await this.prisma.achievement.update({
        where: { id: achievementId },
        data: { celebrationShown: true }
      });
    } catch (error) {
      logger.error('Error marking celebration as shown:', error);
    }
  }

  /**
   * Get next badges a child can earn (closest to completion)
   */
  async getNextBadges(childId: string, limit: number = 3): Promise<BadgeProgress[]> {
    try {
      const allProgress = await this.getBadgeProgress(childId);
      
      // Filter out completed badges and sort by progress percentage
      return allProgress
        .filter(progress => progress.progressPercentage < 100)
        .sort((a, b) => b.progressPercentage - a.progressPercentage)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting next badges:', error);
      return [];
    }
  }

  // Helper methods for badge criteria checking

  private async getCompletedActivitiesCount(childId: string, subjectId?: string): Promise<number> {
    // Check cache first
    const cacheKey = `completed_activities:${childId}:${subjectId || 'all'}`;
    const cachedCount = await redisService.get(cacheKey);
    
    if (cachedCount !== null) {
      return parseInt(cachedCount, 10);
    }

    const whereClause: any = {
      childId,
      status: 'COMPLETED'
    };

    if (subjectId) {
      // Optimized query with proper joins
      whereClause.activity = {
        plan: {
          subject: subjectId
        }
      };
    }

    const count = await this.prisma.progressRecord.count({
      where: whereClause
    });

    // Cache for 2 minutes
    await redisService.set(cacheKey, count.toString(), 2 * 60);

    return count;
  }

  private async getCurrentStreakCount(childId: string, streakType: StreakType): Promise<number> {
    // Check cache first
    const cacheKey = `streak_count:${childId}:${streakType}`;
    const cachedCount = await redisService.get(cacheKey);
    
    if (cachedCount !== null) {
      return parseInt(cachedCount, 10);
    }

    const streak = await this.prisma.learningStreak.findUnique({
      where: {
        childId_streakType: {
          childId,
          streakType
        }
      },
      select: { currentCount: true }
    });

    const count = streak?.currentCount || 0;
    
    // Cache for 1 minute
    await redisService.set(cacheKey, count.toString(), 60);

    return count;
  }

  private async hasAchievedScoreThreshold(childId: string, threshold: number): Promise<boolean> {
    // Check cache first
    const cacheKey = `score_threshold:${childId}:${threshold}`;
    const cachedResult = await redisService.get(cacheKey);
    
    if (cachedResult !== null) {
      return cachedResult === 'true';
    }

    const record = await this.prisma.progressRecord.findFirst({
      where: {
        childId,
        score: {
          gte: threshold
        }
      },
      select: { id: true }
    });

    const hasAchieved = !!record;
    
    // Cache for 5 minutes
    await redisService.set(cacheKey, hasAchieved.toString(), 5 * 60);

    return hasAchieved;
  }

  private async getHelpFreeActivitiesCount(childId: string): Promise<number> {
    // Check cache first
    const cacheKey = `help_free_activities:${childId}`;
    const cachedCount = await redisService.get(cacheKey);
    
    if (cachedCount !== null) {
      return parseInt(cachedCount, 10);
    }

    const count = await this.prisma.progressRecord.count({
      where: {
        childId,
        status: 'COMPLETED',
        helpRequestsCount: 0
      }
    });

    // Cache for 2 minutes
    await redisService.set(cacheKey, count.toString(), 2 * 60);

    return count;
  }

  private async getSubjectActivitiesCount(childId: string, subjectId: string): Promise<number> {
    // Check cache first
    const cacheKey = `subject_activities:${childId}:${subjectId}`;
    const cachedCount = await redisService.get(cacheKey);
    
    if (cachedCount !== null) {
      return parseInt(cachedCount, 10);
    }

    // Optimized query with proper joins
    const count = await this.prisma.progressRecord.count({
      where: {
        childId,
        status: 'COMPLETED',
        activity: {
          plan: {
            subject: subjectId
          }
        }
      }
    });

    // Cache for 2 minutes
    await redisService.set(cacheKey, count.toString(), 2 * 60);

    return count;
  }

  private async updateSessionBadgeCount(sessionId: string): Promise<void> {
    try {
      await this.prisma.childLoginSession.update({
        where: { id: sessionId },
        data: {
          badgesEarned: {
            increment: 1
          }
        }
      });
    } catch (error) {
      logger.error('Error updating session badge count:', error);
    }
  }

  private getBadgeIdFromTitle(title: string): string {
    // Convert title back to badge ID (this is a simple implementation)
    return title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  private estimateTimeToCompletion(
    currentValue: number, 
    targetValue: number, 
    criteriaType: string
  ): string | undefined {
    const remaining = targetValue - currentValue;
    
    if (remaining <= 0) return undefined;

    switch (criteriaType) {
      case 'activity_completion':
        return `${remaining} more activities`;
      case 'streak':
        return `${remaining} more days`;
      case 'subject_mastery':
        return `${remaining} more ${criteriaType.split('_')[0]} activities`;
      default:
        return `${remaining} more to go`;
    }
  }

  /**
   * Get all badge definitions
   */
  getAllBadgeDefinitions(): BadgeDefinition[] {
    return Array.from(this.badgeDefinitions.values());
  }

  /**
   * Get badge definition by ID
   */
  getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
    return this.badgeDefinitions.get(badgeId);
  }

  /**
   * Invalidate all badge-related cache for a child
   */
  private async invalidateBadgeCache(childId: string): Promise<void> {
    try {
      // Invalidate achievements cache
      await redisService.del(`child_achievements:${childId}`);
      
      // Invalidate activity counts cache
      await redisService.deletePattern(`completed_activities:${childId}:*`);
      await redisService.deletePattern(`subject_activities:${childId}:*`);
      await redisService.del(`help_free_activities:${childId}`);
      
      // Invalidate streak counts cache
      await redisService.deletePattern(`streak_count:${childId}:*`);
      
      // Invalidate score threshold cache
      await redisService.deletePattern(`score_threshold:${childId}:*`);
      
      // Invalidate badge progress cache
      await redisService.del(`badge_progress:${childId}`);
      
      logger.debug(`Invalidated badge cache for child ${childId}`);
    } catch (error) {
      logger.error('Error invalidating badge cache:', error);
    }
  }

  /**
   * Warm up badge cache for a child
   */
  async warmBadgeCache(childId: string): Promise<void> {
    try {
      // Pre-load badge progress
      await this.getBadgeProgress(childId);
      
      // Pre-load common badge criteria data
      await Promise.all([
        this.getCompletedActivitiesCount(childId),
        this.getHelpFreeActivitiesCount(childId),
        this.getCurrentStreakCount(childId, StreakType.DAILY),
        this.hasAchievedScoreThreshold(childId, 100)
      ]);
      
      logger.info(`Warmed badge cache for child ${childId}`);
    } catch (error) {
      logger.error('Error warming badge cache:', error);
    }
  }
}