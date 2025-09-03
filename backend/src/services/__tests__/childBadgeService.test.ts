import { PrismaClient, AchievementType, StreakType } from '@prisma/client';
import { ChildBadgeService, BadgeDefinition, BadgeCategory, BadgeRarity } from '../childBadgeService';
import { logger } from '../../utils/logger';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock Prisma Client
const mockPrisma = {
  achievement: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  progressRecord: {
    count: jest.fn(),
    findFirst: jest.fn()
  },
  learningStreak: {
    findUnique: jest.fn()
  },
  childLoginSession: {
    update: jest.fn()
  }
} as unknown as PrismaClient;

describe('ChildBadgeService', () => {
  let badgeService: ChildBadgeService;
  const testChildId = 'test-child-id';
  const testSessionId = 'test-session-id';

  beforeEach(() => {
    badgeService = new ChildBadgeService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Badge Definitions', () => {
    it('should initialize with predefined badge definitions', () => {
      const allBadges = badgeService.getAllBadgeDefinitions();
      expect(allBadges.length).toBeGreaterThan(0);
      
      // Check for specific badges
      const firstStepsBadge = allBadges.find(b => b.id === 'first_activity');
      expect(firstStepsBadge).toBeDefined();
      expect(firstStepsBadge?.name).toBe('First Steps');
      expect(firstStepsBadge?.category).toBe('completion');
      expect(firstStepsBadge?.rarity).toBe('common');
    });

    it('should get badge definition by ID', () => {
      const badge = badgeService.getBadgeDefinition('first_activity');
      expect(badge).toBeDefined();
      expect(badge?.name).toBe('First Steps');
    });

    it('should return undefined for non-existent badge ID', () => {
      const badge = badgeService.getBadgeDefinition('non-existent');
      expect(badge).toBeUndefined();
    });

    it('should get badges by category', () => {
      const completionBadges = badgeService.getBadgesByCategory('completion');
      expect(completionBadges.length).toBeGreaterThan(0);
      expect(completionBadges.every(b => b.category === 'completion')).toBe(true);
    });

    it('should get badges by rarity', () => {
      const commonBadges = badgeService.getBadgesByRarity('common');
      expect(commonBadges.length).toBeGreaterThan(0);
      expect(commonBadges.every(b => b.rarity === 'common')).toBe(true);
    });
  });

  describe('Badge Eligibility Checking', () => {
    beforeEach(() => {
      // Mock existing achievements (none by default)
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);
    });

    it('should check eligibility for activity completion badge', async () => {
      // Mock 1 completed activity
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.learningStreak.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.create as jest.Mock).mockResolvedValue({
        id: 'test-achievement',
        childId: testChildId,
        type: 'BADGE',
        title: 'First Steps',
        description: 'Complete your first learning activity',
        iconUrl: '/badges/first-steps.svg',
        points: 10,
        earnedAt: new Date(),
        celebrationShown: false,
        parentNotified: false,
        earnedInSession: null
      });

      const results = await badgeService.checkBadgeEligibility(testChildId);
      
      // Should award "First Steps" badge
      expect(results.length).toBeGreaterThan(0);
      const firstStepsResult = results.find(r => r.badge?.title === 'First Steps');
      expect(firstStepsResult?.success).toBe(true);
    });

    it('should not award badge if already earned', async () => {
      // Mock existing achievement
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        {
          type: 'BADGE',
          title: 'First Steps'
        }
      ]);

      const results = await badgeService.checkBadgeEligibility(testChildId);
      
      // Should not award already earned badge
      const firstStepsResult = results.find(r => r.badge?.title === 'First Steps');
      expect(firstStepsResult).toBeUndefined();
    });

    it('should check streak badge eligibility', async () => {
      // Mock 7-day streak
      (mockPrisma.learningStreak.findUnique as jest.Mock).mockResolvedValue({
        currentCount: 7,
        streakType: 'DAILY'
      });
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.create as jest.Mock).mockResolvedValue({
        id: 'test-achievement',
        childId: testChildId,
        type: 'BADGE',
        title: 'Daily Learner',
        description: 'Learn for 7 days in a row',
        iconUrl: '/badges/daily-learner.svg',
        points: 25,
        earnedAt: new Date(),
        celebrationShown: false,
        parentNotified: false,
        earnedInSession: null
      });

      const results = await badgeService.checkBadgeEligibility(testChildId);
      
      // Should award "Daily Learner" badge
      const dailyLearnerResult = results.find(r => r.badge?.title === 'Daily Learner');
      expect(dailyLearnerResult?.success).toBe(true);
    });

    it('should check perfect score badge eligibility', async () => {
      // Mock perfect score record
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue({
        score: 100
      });
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.learningStreak.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.create as jest.Mock).mockResolvedValue({
        id: 'test-achievement',
        childId: testChildId,
        type: 'BADGE',
        title: 'Perfect Score',
        description: 'Get a perfect score on an activity',
        iconUrl: '/badges/perfect-score.svg',
        points: 30,
        earnedAt: new Date(),
        celebrationShown: false,
        parentNotified: false,
        earnedInSession: null
      });

      const results = await badgeService.checkBadgeEligibility(testChildId);
      
      // Should award "Perfect Score" badge
      const perfectScoreResult = results.find(r => r.badge?.title === 'Perfect Score');
      expect(perfectScoreResult?.success).toBe(true);
    });
  });

  describe('Badge Awarding', () => {
    it('should successfully award a new badge', async () => {
      const mockAchievement = {
        id: 'achievement-id',
        childId: testChildId,
        type: 'BADGE' as AchievementType,
        title: 'First Steps',
        description: 'Complete your first learning activity',
        iconUrl: '/badges/first-steps.svg',
        points: 10,
        earnedAt: new Date(),
        celebrationShown: false,
        parentNotified: false,
        earnedInSession: testSessionId
      };

      (mockPrisma.achievement.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.create as jest.Mock).mockResolvedValue(mockAchievement);
      (mockPrisma.childLoginSession.update as jest.Mock).mockResolvedValue({});

      // Mock eligibility check
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const results = await badgeService.checkBadgeEligibility(testChildId, testSessionId);
      
      const successfulResult = results.find(r => r.success);
      expect(successfulResult).toBeDefined();
      expect(successfulResult?.badge?.title).toBe('First Steps');
      expect(mockPrisma.childLoginSession.update).toHaveBeenCalledWith({
        where: { id: testSessionId },
        data: { badgesEarned: { increment: 1 } }
      });
    });

    it('should handle already earned badge', async () => {
      const existingAchievement = {
        id: 'existing-id',
        title: 'First Steps',
        type: 'BADGE' as AchievementType
      };

      (mockPrisma.achievement.findFirst as jest.Mock).mockResolvedValue(existingAchievement);

      // This would be tested through the private method, but we can test the overall flow
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([existingAchievement]);
      
      const results = await badgeService.checkBadgeEligibility(testChildId);
      
      // Should not create duplicate badge
      expect(mockPrisma.achievement.create).not.toHaveBeenCalled();
    });
  });

  describe('Badge Progress Tracking', () => {
    it('should get badge progress for all badges', async () => {
      // Mock no existing achievements
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);
      
      // Mock progress data
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.learningStreak.findUnique as jest.Mock).mockResolvedValue({
        currentCount: 3
      });

      const progress = await badgeService.getBadgeProgress(testChildId);
      
      expect(progress.length).toBeGreaterThan(0);
      
      // Check specific progress
      const firstActivityProgress = progress.find(p => p.badgeId === 'first_activity');
      expect(firstActivityProgress).toBeDefined();
      expect(firstActivityProgress?.currentValue).toBe(5);
      expect(firstActivityProgress?.targetValue).toBe(1);
      expect(firstActivityProgress?.progressPercentage).toBe(100);
    });

    it('should show 100% progress for earned badges', async () => {
      // Mock existing achievement
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        {
          title: 'First Steps',
          type: 'BADGE'
        }
      ]);

      const progress = await badgeService.getBadgeProgress(testChildId);
      
      const firstActivityProgress = progress.find(p => p.badgeId === 'first_activity');
      expect(firstActivityProgress?.progressPercentage).toBe(100);
    });

    it('should get next badges to earn', async () => {
      // Mock progress data
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.progressRecord.count as jest.Mock).mockResolvedValue(8);
      (mockPrisma.progressRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.learningStreak.findUnique as jest.Mock).mockResolvedValue({
        currentCount: 5
      });

      const nextBadges = await badgeService.getNextBadges(testChildId, 2);
      
      expect(nextBadges.length).toBeLessThanOrEqual(2);
      expect(nextBadges.every(b => b.progressPercentage < 100)).toBe(true);
      
      // Should be sorted by progress percentage (descending)
      if (nextBadges.length > 1) {
        expect(nextBadges[0].progressPercentage).toBeGreaterThanOrEqual(nextBadges[1].progressPercentage);
      }
    });
  });

  describe('Celebration Management', () => {
    it('should get celebration config for a badge', () => {
      const config = badgeService.getCelebrationConfig('first_activity');
      
      expect(config).toBeDefined();
      expect(config?.animationType).toBe('confetti');
      expect(config?.duration).toBe(3000);
      expect(config?.message).toContain('Congratulations');
    });

    it('should return null for non-existent badge celebration config', () => {
      const config = badgeService.getCelebrationConfig('non-existent');
      expect(config).toBeNull();
    });

    it('should mark celebration as shown', async () => {
      const achievementId = 'test-achievement-id';
      
      (mockPrisma.achievement.update as jest.Mock).mockResolvedValue({});

      await badgeService.markCelebrationShown(achievementId);
      
      expect(mockPrisma.achievement.update).toHaveBeenCalledWith({
        where: { id: achievementId },
        data: { celebrationShown: true }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in eligibility check', async () => {
      (mockPrisma.achievement.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const results = await badgeService.checkBadgeEligibility(testChildId);
      
      expect(results).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('Error checking badge eligibility:', expect.any(Error));
    });

    it('should handle errors in badge progress tracking', async () => {
      (mockPrisma.achievement.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const progress = await badgeService.getBadgeProgress(testChildId);
      
      expect(progress).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('Error getting badge progress:', expect.any(Error));
    });

    it('should handle errors in celebration marking', async () => {
      (mockPrisma.achievement.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await badgeService.markCelebrationShown('test-id');
      
      expect(logger.error).toHaveBeenCalledWith('Error marking celebration as shown:', expect.any(Error));
    });
  });

  describe('Badge Categories and Rarity', () => {
    it('should have badges in all expected categories', () => {
      const allBadges = badgeService.getAllBadgeDefinitions();
      const categories = new Set(allBadges.map(b => b.category));
      
      expect(categories.has('completion')).toBe(true);
      expect(categories.has('streak')).toBe(true);
      expect(categories.has('excellence')).toBe(true);
      expect(categories.has('independence')).toBe(true);
      expect(categories.has('math')).toBe(true);
      expect(categories.has('reading')).toBe(true);
    });

    it('should have badges of different rarities', () => {
      const allBadges = badgeService.getAllBadgeDefinitions();
      const rarities = new Set(allBadges.map(b => b.rarity));
      
      expect(rarities.has('common')).toBe(true);
      expect(rarities.has('uncommon')).toBe(true);
      expect(rarities.has('rare')).toBe(true);
      expect(rarities.has('epic')).toBe(true);
    });

    it('should have appropriate point values for different rarities', () => {
      const allBadges = badgeService.getAllBadgeDefinitions();
      
      const commonBadges = allBadges.filter(b => b.rarity === 'common');
      const rareBadges = allBadges.filter(b => b.rarity === 'rare');
      
      if (commonBadges.length > 0 && rareBadges.length > 0) {
        const avgCommonPoints = commonBadges.reduce((sum, b) => sum + b.points, 0) / commonBadges.length;
        const avgRarePoints = rareBadges.reduce((sum, b) => sum + b.points, 0) / rareBadges.length;
        
        expect(avgRarePoints).toBeGreaterThan(avgCommonPoints);
      }
    });
  });
});