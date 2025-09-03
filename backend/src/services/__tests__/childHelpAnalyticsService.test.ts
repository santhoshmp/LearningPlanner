import { childHelpAnalyticsService } from '../childHelpAnalyticsService';
import { prisma } from '../../utils/database';

// Mock the database
jest.mock('../../utils/database', () => ({
  prisma: {
    helpRequest: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn()
    },
    parentNotification: {
      findFirst: jest.fn(),
      create: jest.fn()
    },
    childProfile: {
      findUnique: jest.fn()
    }
  }
}));

// Mock the email service
jest.mock('../emailService', () => ({
  emailService: {
    sendEmail: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('childHelpAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChildHelpAnalytics', () => {
    it('should return help analytics for a child', async () => {
      const childId = 'test-child-id';
      const mockHelpRequests = [
        {
          id: '1',
          childId,
          question: 'Test question',
          response: 'Test response',
          timestamp: new Date(),
          context: { subject: 'math' },
          isResolved: true
        },
        {
          id: '2',
          childId,
          question: 'Another question',
          response: 'Another response',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          context: { subject: 'science' },
          isResolved: false
        }
      ];

      mockPrisma.helpRequest.findMany.mockResolvedValue(mockHelpRequests as any);

      const result = await childHelpAnalyticsService.getChildHelpAnalytics(childId);

      expect(result).toEqual({
        totalHelpRequests: 2,
        helpRequestsToday: 1,
        helpRequestsThisWeek: 2,
        frequentTopics: ['math', 'science'],
        averageResponseTime: 2.5,
        mostHelpfulResponses: [mockHelpRequests[0]],
        helpSeekingPattern: 'independent',
        parentNotificationThreshold: 5,
        shouldNotifyParent: false
      });

      expect(mockPrisma.helpRequest.findMany).toHaveBeenCalledWith({
        where: { childId },
        orderBy: { timestamp: 'desc' }
      });
    });

    it('should handle errors gracefully', async () => {
      const childId = 'test-child-id';
      mockPrisma.helpRequest.findMany.mockRejectedValue(new Error('Database error'));

      await expect(childHelpAnalyticsService.getChildHelpAnalytics(childId))
        .rejects.toThrow('Failed to get help analytics');
    });
  });

  describe('getHelpRequestPatterns', () => {
    it('should return help request patterns', async () => {
      const childId = 'test-child-id';
      const mockHelpRequests = [
        {
          id: '1',
          childId,
          question: 'What is this concept?',
          timestamp: new Date(),
          context: { subject: 'math', difficulty: 3 },
          isResolved: true
        }
      ];

      mockPrisma.helpRequest.findMany.mockResolvedValue(mockHelpRequests as any);

      const result = await childHelpAnalyticsService.getHelpRequestPatterns(childId, 'week');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        timeOfDay: expect.any(String),
        subject: 'math',
        difficulty: 3,
        questionType: 'concept',
        wasResolved: true
      });
    });
  });

  describe('markHelpRequestResolved', () => {
    it('should mark help request as resolved', async () => {
      const helpRequestId = 'test-help-request-id';
      const mockHelpRequest = {
        id: helpRequestId,
        context: { existing: 'data' }
      };

      mockPrisma.helpRequest.findUnique.mockResolvedValue(mockHelpRequest as any);
      mockPrisma.helpRequest.update.mockResolvedValue({} as any);

      await childHelpAnalyticsService.markHelpRequestResolved(helpRequestId, true);

      expect(mockPrisma.helpRequest.update).toHaveBeenCalledWith({
        where: { id: helpRequestId },
        data: {
          isResolved: true,
          context: {
            existing: 'data',
            wasHelpful: true,
            resolvedAt: expect.any(String)
          }
        }
      });
    });
  });

  describe('getPersonalizedSuggestions', () => {
    it('should return personalized suggestions based on patterns', async () => {
      const childId = 'test-child-id';
      const subject = 'math';

      // Mock the getHelpRequestPatterns method
      jest.spyOn(childHelpAnalyticsService, 'getHelpRequestPatterns')
        .mockResolvedValue([
          {
            timeOfDay: 'morning',
            subject: 'math',
            difficulty: 2,
            questionType: 'concept',
            wasResolved: true
          },
          {
            timeOfDay: 'afternoon',
            subject: 'math',
            difficulty: 3,
            questionType: 'concept',
            wasResolved: false
          }
        ]);

      const result = await childHelpAnalyticsService.getPersonalizedSuggestions(childId, subject);

      expect(result).toContain('What does this math concept mean?');
      expect(result).toContain('Can you explain this math idea differently?');
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });
});