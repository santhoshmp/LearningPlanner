import { describe, it, expect, beforeEach, afterEach, jest, beforeAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Mock external dependencies
jest.mock('@prisma/client');
jest.mock('axios');
jest.mock('uuid');
jest.mock('../utils/logger');
jest.mock('./geminiService');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

// Mock Prisma
const mockPrisma = {
  contentSafetyLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  parentalApprovalRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  studyContent: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);

describe('ContentSafetyService', () => {
  let contentSafetyService: any;

  const mockEnv = {
    CONTENT_SAFETY_API_KEY: 'test-safety-api-key',
    CONTENT_SAFETY_API_URL: 'https://api.contentsafety.test.com',
  };

  beforeAll(() => {
    // Set up environment variables
    Object.assign(process.env, mockEnv);
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset Prisma mocks
    Object.values(mockPrisma).forEach(model => {
      if (typeof model === 'object' && model !== null) {
        Object.values(model).forEach(method => {
          if (typeof method === 'function') {
            (method as jest.Mock).mockReset();
          }
        });
      }
    });

    // Import the service after mocking
    const { contentSafetyService: service } = await import('../contentSafetyService');
    contentSafetyService = service;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkContentSafety', () => {
    it('should approve safe educational content', async () => {
      const safeContent = 'Learn about photosynthesis and how plants make food using sunlight';
      const childAge = 10;

      const result = await contentSafetyService.checkContentSafety(safeContent, childAge);

      expect(result).toEqual({
        isAppropriate: true,
        ageAppropriate: true,
        educationalValue: expect.any(Number),
        concerns: []
      });

      expect(result.educationalValue).toBeGreaterThan(0.5);
    });

    it('should flag inappropriate content with keywords', async () => {
      const inappropriateContent = 'This content contains violence and inappropriate material for children';
      const childAge = 8;

      const result = await contentSafetyService.checkContentSafety(inappropriateContent, childAge);

      expect(result).toEqual({
        isAppropriate: false,
        ageAppropriate: false,
        educationalValue: expect.any(Number),
        concerns: expect.arrayContaining(['violence', 'inappropriate'])
      });

      expect(result.educationalValue).toBeLessThan(0.5);
    });

    it('should handle content with mixed safety signals', async () => {
      const mixedContent = 'Educational content about history including some discussion of war and conflict';
      const childAge = 12;

      const result = await contentSafetyService.checkContentSafety(mixedContent, childAge);

      expect(result.isAppropriate).toBeDefined();
      expect(result.ageAppropriate).toBeDefined();
      expect(result.educationalValue).toBeGreaterThan(0);
      expect(Array.isArray(result.concerns)).toBe(true);
    });

    it('should consider age appropriateness for different age groups', async () => {
      const content = 'Advanced calculus concepts and mathematical proofs';
      
      // Test with young child
      const youngChildResult = await contentSafetyService.checkContentSafety(content, 6);
      expect(youngChildResult.ageAppropriate).toBe(false);

      // Test with teenager
      const teenResult = await contentSafetyService.checkContentSafety(content, 16);
      expect(teenResult.ageAppropriate).toBe(true);
    });

    it('should handle empty or null content', async () => {
      const emptyResult = await contentSafetyService.checkContentSafety('', 10);
      expect(emptyResult.isAppropriate).toBe(false);
      expect(emptyResult.concerns).toContain('empty_content');

      const nullResult = await contentSafetyService.checkContentSafety(null as any, 10);
      expect(nullResult.isAppropriate).toBe(false);
      expect(nullResult.concerns).toContain('invalid_content');
    });
  });

  describe('validateGeminiContent', () => {
    const mockStudyPlan = {
      planId: 'plan-123',
      title: 'Mathematics Study Plan',
      description: 'Learn basic math concepts',
      estimatedDuration: 60,
      activities: [
        {
          id: 'activity-1',
          title: 'Addition Basics',
          description: 'Learn to add numbers',
          type: 'video' as const,
          duration: 15,
          difficulty: 'easy' as const,
          learningObjectives: ['understand addition'],
          content: {
            videoUrl: 'https://example.com/video1',
            thumbnailUrl: 'https://example.com/thumb1.jpg'
          }
        }
      ],
      contentRecommendations: [
        {
          type: 'video' as const,
          title: 'Math Basics Video',
          description: 'Educational video about basic math',
          url: 'https://example.com/math-video',
          duration: 300,
          ageAppropriate: true,
          safetyScore: 0.95,
          source: 'Educational Videos Inc',
          tags: ['math', 'elementary'],
          difficulty: 2
        },
        {
          type: 'article' as const,
          title: 'Inappropriate Article',
          description: 'This article contains violence and inappropriate content',
          url: 'https://example.com/bad-article',
          duration: 600,
          ageAppropriate: false,
          safetyScore: 0.2,
          source: 'Questionable Source',
          tags: ['violence', 'inappropriate'],
          difficulty: 5
        }
      ],
      safetyValidation: {
        overallSafetyScore: 0.85,
        contentFlags: [],
        ageAppropriate: true,
        parentalApprovalRequired: false
      }
    };

    it('should validate and filter Gemini content successfully', async () => {
      const childAge = 8;
      
      // Mock Gemini service validation
      const mockGeminiService = require('./geminiService').geminiService;
      mockGeminiService.validateContentSafety = jest.fn()
        .mockResolvedValueOnce({
          safetyScore: 0.95,
          ageAppropriate: true,
          contentFlags: [],
          recommendation: 'approved'
        })
        .mockResolvedValueOnce({
          safetyScore: 0.2,
          ageAppropriate: false,
          contentFlags: ['inappropriate_content', 'violence'],
          recommendation: 'blocked'
        });

      mockPrisma.contentSafetyLog.create.mockResolvedValue({});

      const result = await contentSafetyService.validateGeminiContent(mockStudyPlan, childAge);

      expect(result).toEqual({
        studyPlan: mockStudyPlan,
        safetyResults: expect.arrayContaining([
          expect.objectContaining({
            safetyScore: 0.95,
            ageAppropriate: true,
            recommendation: 'approved'
          }),
          expect.objectContaining({
            safetyScore: 0.2,
            ageAppropriate: false,
            recommendation: 'blocked'
          })
        ]),
        filteredContent: expect.arrayContaining([
          expect.objectContaining({
            title: 'Math Basics Video',
            safetyScore: 0.95
          })
        ]),
        parentalApprovalRequired: false,
        validationSummary: {
          totalContent: 2,
          approvedContent: 1,
          flaggedContent: 1,
          requiresReview: 0
        }
      });

      expect(result.filteredContent).toHaveLength(1);
      expect(result.filteredContent[0].title).toBe('Math Basics Video');
    });

    it('should require parental approval for questionable content', async () => {
      const questionableStudyPlan = {
        ...mockStudyPlan,
        contentRecommendations: [
          {
            type: 'video' as const,
            title: 'Borderline Content',
            description: 'Content that might need review',
            url: 'https://example.com/borderline',
            duration: 400,
            ageAppropriate: true,
            safetyScore: 0.65, // Borderline safety score
            source: 'Unknown Source',
            tags: ['questionable'],
            difficulty: 3
          }
        ]
      };

      const mockGeminiService = require('./geminiService').geminiService;
      mockGeminiService.validateContentSafety = jest.fn().mockResolvedValue({
        safetyScore: 0.65,
        ageAppropriate: true,
        contentFlags: ['needs_review'],
        recommendation: 'review_required'
      });

      mockPrisma.contentSafetyLog.create.mockResolvedValue({});

      const result = await contentSafetyService.validateGeminiContent(questionableStudyPlan, 10);

      expect(result.parentalApprovalRequired).toBe(true);
      expect(result.validationSummary.requiresReview).toBe(1);
    });

    it('should handle validation errors gracefully', async () => {
      const mockGeminiService = require('./geminiService').geminiService;
      mockGeminiService.validateContentSafety = jest.fn().mockRejectedValue(new Error('Validation API Error'));

      await expect(
        contentSafetyService.validateGeminiContent(mockStudyPlan, 10)
      ).rejects.toThrow('Content validation failed: Validation API Error');
    });
  });

  describe('createParentalApprovalRequest', () => {
    const mockContentData = {
      type: 'video',
      title: 'Test Video',
      description: 'Test description',
      url: 'https://example.com/video'
    };

    const mockSafetyResults = {
      safetyScore: 0.6,
      ageAppropriate: true,
      contentFlags: ['needs_review'],
      recommendation: 'review_required'
    };

    it('should create parental approval request successfully', async () => {
      const mockRequestId = 'approval-request-123';
      mockedUuidv4.mockReturnValue(mockRequestId);

      const mockCreatedRequest = {
        id: mockRequestId,
        childId: 'child-123',
        studyPlanId: 'plan-123',
        contentType: 'content_recommendation',
        contentData: mockContentData,
        safetyResults: mockSafetyResults,
        requestedAt: new Date(),
        status: 'pending'
      };

      mockPrisma.parentalApprovalRequest.create.mockResolvedValue(mockCreatedRequest);

      const result = await contentSafetyService.createParentalApprovalRequest(
        'child-123',
        'plan-123',
        'content_recommendation',
        mockContentData,
        mockSafetyResults
      );

      expect(result).toEqual(mockCreatedRequest);
      expect(mockPrisma.parentalApprovalRequest.create).toHaveBeenCalledWith({
        data: {
          id: mockRequestId,
          childId: 'child-123',
          studyPlanId: 'plan-123',
          contentType: 'content_recommendation',
          contentData: mockContentData,
          safetyResults: mockSafetyResults,
          requestedAt: expect.any(Date),
          status: 'pending'
        }
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.parentalApprovalRequest.create.mockRejectedValue(new Error('Database error'));

      await expect(
        contentSafetyService.createParentalApprovalRequest(
          'child-123',
          'plan-123',
          'content_recommendation',
          mockContentData,
          mockSafetyResults
        )
      ).rejects.toThrow('Failed to create parental approval request: Database error');
    });
  });

  describe('processParentalApproval', () => {
    const mockApprovalRequest = {
      id: 'approval-123',
      childId: 'child-123',
      studyPlanId: 'plan-123',
      contentType: 'content_recommendation',
      contentData: { title: 'Test Content' },
      safetyResults: { safetyScore: 0.6 },
      status: 'pending'
    };

    it('should approve content successfully', async () => {
      mockPrisma.parentalApprovalRequest.findUnique.mockResolvedValue(mockApprovalRequest);
      mockPrisma.parentalApprovalRequest.update.mockResolvedValue({
        ...mockApprovalRequest,
        status: 'approved',
        parentNotes: 'Content approved for educational value'
      });
      mockPrisma.contentSafetyLog.create.mockResolvedValue({});

      const result = await contentSafetyService.processParentalApproval(
        'approval-123',
        'parent-123',
        'approved',
        'Content approved for educational value'
      );

      expect(result.status).toBe('approved');
      expect(result.parentNotes).toBe('Content approved for educational value');
      expect(mockPrisma.parentalApprovalRequest.update).toHaveBeenCalledWith({
        where: { id: 'approval-123' },
        data: {
          status: 'approved',
          parentNotes: 'Content approved for educational value',
          approvedAt: expect.any(Date),
          approvedBy: 'parent-123'
        }
      });
    });

    it('should reject content with reason', async () => {
      mockPrisma.parentalApprovalRequest.findUnique.mockResolvedValue(mockApprovalRequest);
      mockPrisma.parentalApprovalRequest.update.mockResolvedValue({
        ...mockApprovalRequest,
        status: 'rejected',
        parentNotes: 'Not appropriate for child age'
      });
      mockPrisma.contentSafetyLog.create.mockResolvedValue({});

      const result = await contentSafetyService.processParentalApproval(
        'approval-123',
        'parent-123',
        'rejected',
        'Not appropriate for child age'
      );

      expect(result.status).toBe('rejected');
      expect(result.parentNotes).toBe('Not appropriate for child age');
    });

    it('should handle non-existent approval request', async () => {
      mockPrisma.parentalApprovalRequest.findUnique.mockResolvedValue(null);

      await expect(
        contentSafetyService.processParentalApproval(
          'non-existent-123',
          'parent-123',
          'approved',
          'Test note'
        )
      ).rejects.toThrow('Parental approval request not found');
    });

    it('should prevent processing already processed requests', async () => {
      const processedRequest = {
        ...mockApprovalRequest,
        status: 'approved'
      };

      mockPrisma.parentalApprovalRequest.findUnique.mockResolvedValue(processedRequest);

      await expect(
        contentSafetyService.processParentalApproval(
          'approval-123',
          'parent-123',
          'rejected',
          'Changed mind'
        )
      ).rejects.toThrow('Approval request has already been processed');
    });
  });

  describe('getParentalApprovalRequests', () => {
    const mockRequests = [
      {
        id: 'request-1',
        childId: 'child-1',
        studyPlanId: 'plan-1',
        contentType: 'content_recommendation',
        status: 'pending',
        requestedAt: new Date(),
        contentData: { title: 'Test Content 1' }
      },
      {
        id: 'request-2',
        childId: 'child-2',
        studyPlanId: 'plan-2',
        contentType: 'study_plan',
        status: 'approved',
        requestedAt: new Date(),
        contentData: { title: 'Test Content 2' }
      }
    ];

    it('should fetch parental approval requests with filters', async () => {
      mockPrisma.parentalApprovalRequest.findMany.mockResolvedValue(mockRequests);
      mockPrisma.parentalApprovalRequest.count.mockResolvedValue(2);

      const result = await contentSafetyService.getParentalApprovalRequests('parent-123', {
        status: 'pending',
        limit: 10,
        offset: 0
      });

      expect(result).toEqual({
        requests: mockRequests,
        total: 2,
        hasMore: false
      });

      expect(mockPrisma.parentalApprovalRequest.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'pending'
        }),
        orderBy: { requestedAt: 'desc' },
        take: 10,
        skip: 0,
        include: expect.any(Object)
      });
    });

    it('should handle pagination correctly', async () => {
      const manyRequests = Array.from({ length: 15 }, (_, i) => ({
        id: `request-${i}`,
        childId: 'child-1',
        status: 'pending'
      }));

      mockPrisma.parentalApprovalRequest.findMany.mockResolvedValue(manyRequests.slice(0, 10));
      mockPrisma.parentalApprovalRequest.count.mockResolvedValue(15);

      const result = await contentSafetyService.getParentalApprovalRequests('parent-123', {
        limit: 10,
        offset: 0
      });

      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(15);
      expect(result.requests).toHaveLength(10);
    });
  });

  describe('getSafetyLogs', () => {
    const mockLogs = [
      {
        id: 'log-1',
        eventType: 'content_flagged',
        contentId: 'content-1',
        childId: 'child-1',
        safetyScore: 0.3,
        concerns: ['inappropriate_language'],
        timestamp: new Date()
      },
      {
        id: 'log-2',
        eventType: 'content_approved',
        contentId: 'content-2',
        childId: 'child-1',
        safetyScore: 0.95,
        concerns: [],
        timestamp: new Date()
      }
    ];

    it('should fetch safety logs with filters', async () => {
      mockPrisma.contentSafetyLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.contentSafetyLog.count.mockResolvedValue(2);

      const result = await contentSafetyService.getSafetyLogs({
        childId: 'child-1',
        eventType: 'content_flagged',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        limit: 50,
        offset: 0
      });

      expect(result).toEqual({
        logs: mockLogs,
        total: 2
      });

      expect(mockPrisma.contentSafetyLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          childId: 'child-1',
          eventType: 'content_flagged',
          timestamp: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          }
        }),
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0
      });
    });

    it('should handle empty results', async () => {
      mockPrisma.contentSafetyLog.findMany.mockResolvedValue([]);
      mockPrisma.contentSafetyLog.count.mockResolvedValue(0);

      const result = await contentSafetyService.getSafetyLogs({
        childId: 'non-existent-child'
      });

      expect(result.logs).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateContentSafetyStatus', () => {
    it('should update content safety status successfully', async () => {
      const mockUpdatedContent = {
        id: 'content-123',
        safetyStatus: 'approved',
        safetyScore: 0.95,
        lastSafetyCheck: new Date()
      };

      mockPrisma.studyContent.update.mockResolvedValue(mockUpdatedContent);
      mockPrisma.contentSafetyLog.create.mockResolvedValue({});

      const result = await contentSafetyService.updateContentSafetyStatus(
        'content-123',
        'approved',
        0.95,
        []
      );

      expect(result).toEqual(mockUpdatedContent);
      expect(mockPrisma.studyContent.update).toHaveBeenCalledWith({
        where: { id: 'content-123' },
        data: {
          safetyStatus: 'approved',
          safetyScore: 0.95,
          lastSafetyCheck: expect.any(Date)
        }
      });
    });

    it('should log safety status changes', async () => {
      mockPrisma.studyContent.update.mockResolvedValue({});
      mockPrisma.contentSafetyLog.create.mockResolvedValue({});

      await contentSafetyService.updateContentSafetyStatus(
        'content-123',
        'flagged',
        0.2,
        ['inappropriate_content', 'violence']
      );

      expect(mockPrisma.contentSafetyLog.create).toHaveBeenCalledWith({
        data: {
          eventType: 'safety_status_updated',
          contentId: 'content-123',
          safetyScore: 0.2,
          concerns: ['inappropriate_content', 'violence'],
          timestamp: expect.any(Date),
          metadata: {
            newStatus: 'flagged',
            updatedBy: 'system'
          }
        }
      });
    });
  });

  describe('Age Appropriateness Checks', () => {
    it('should correctly categorize content by age groups', () => {
      // Test early childhood (3-6)
      expect(contentSafetyService.getAgeCategory(4)).toBe('EARLY_CHILDHOOD');
      
      // Test elementary (7-10)
      expect(contentSafetyService.getAgeCategory(8)).toBe('ELEMENTARY');
      
      // Test middle school (11-13)
      expect(contentSafetyService.getAgeCategory(12)).toBe('MIDDLE_SCHOOL');
      
      // Test high school (14-18)
      expect(contentSafetyService.getAgeCategory(16)).toBe('HIGH_SCHOOL');
      
      // Test edge cases
      expect(contentSafetyService.getAgeCategory(2)).toBe('EARLY_CHILDHOOD');
      expect(contentSafetyService.getAgeCategory(19)).toBe('HIGH_SCHOOL');
    });

    it('should validate content duration against age limits', () => {
      // Early childhood - max 15 minutes
      expect(contentSafetyService.isValidDurationForAge(10, 4)).toBe(true);
      expect(contentSafetyService.isValidDurationForAge(20, 4)).toBe(false);
      
      // Elementary - max 30 minutes
      expect(contentSafetyService.isValidDurationForAge(25, 8)).toBe(true);
      expect(contentSafetyService.isValidDurationForAge(35, 8)).toBe(false);
      
      // Middle school - max 45 minutes
      expect(contentSafetyService.isValidDurationForAge(40, 12)).toBe(true);
      expect(contentSafetyService.isValidDurationForAge(50, 12)).toBe(false);
      
      // High school - max 60 minutes
      expect(contentSafetyService.isValidDurationForAge(55, 16)).toBe(true);
      expect(contentSafetyService.isValidDurationForAge(65, 16)).toBe(false);
    });

    it('should validate content difficulty against age limits', () => {
      // Early childhood - max difficulty 3
      expect(contentSafetyService.isValidDifficultyForAge(2, 5)).toBe(true);
      expect(contentSafetyService.isValidDifficultyForAge(4, 5)).toBe(false);
      
      // Elementary - max difficulty 5
      expect(contentSafetyService.isValidDifficultyForAge(4, 9)).toBe(true);
      expect(contentSafetyService.isValidDifficultyForAge(6, 9)).toBe(false);
      
      // Middle school - max difficulty 7
      expect(contentSafetyService.isValidDifficultyForAge(6, 13)).toBe(true);
      expect(contentSafetyService.isValidDifficultyForAge(8, 13)).toBe(false);
      
      // High school - max difficulty 10
      expect(contentSafetyService.isValidDifficultyForAge(9, 17)).toBe(true);
      expect(contentSafetyService.isValidDifficultyForAge(11, 17)).toBe(false);
    });
  });
});