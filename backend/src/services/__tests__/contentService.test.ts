// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../utils/logger');

import { PrismaClient } from '@prisma/client';
import { contentService, CreateContentData, UpdateContentData, ContentInteractionData } from '../contentService';
import { logger } from '../../utils/logger';

// Create mock prisma instance
const mockPrisma = {
  studyContent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
  studyActivity: {
    findUnique: jest.fn(),
  },
  childProfile: {
    findUnique: jest.fn(),
  },
  contentInteraction: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

// Mock PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

describe('ContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createContent', () => {
    const mockContentData: CreateContentData = {
      activityId: 'activity-1',
      contentType: 'video',
      title: 'Test Video',
      description: 'A test video for learning',
      contentUrl: 'https://example.com/video.mp4',
      duration: 300,
      difficultyLevel: 3,
    };

    it('should create content successfully', async () => {
      const mockActivity = { id: 'activity-1', title: 'Test Activity' };
      const mockCreatedContent = {
        id: 'content-1',
        ...mockContentData,
        safetyRating: 'safe',
        ageAppropriateMin: 5,
        ageAppropriateMax: 18,
      };

      mockPrisma.studyActivity.findUnique.mockResolvedValue(mockActivity);
      mockPrisma.studyContent.create.mockResolvedValue(mockCreatedContent);

      const result = await contentService.createContent(mockContentData);

      expect(mockPrisma.studyActivity.findUnique).toHaveBeenCalledWith({
        where: { id: 'activity-1' }
      });
      expect(mockPrisma.studyContent.create).toHaveBeenCalledWith({
        data: {
          ...mockContentData,
          safetyRating: 'safe',
          difficultyLevel: 3,
          ageAppropriateMin: 5,
          ageAppropriateMax: 18,
        }
      });
      expect(result).toEqual(mockCreatedContent);
      expect(logger.info).toHaveBeenCalledWith('Content created successfully', expect.any(Object));
    });

    it('should throw error if activity not found', async () => {
      mockPrisma.studyActivity.findUnique.mockResolvedValue(null);

      await expect(contentService.createContent(mockContentData)).rejects.toThrow('Activity not found');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should flag content with suspicious keywords for review', async () => {
      const suspiciousContent = {
        ...mockContentData,
        title: 'Dangerous Activity',
        description: 'This contains violence'
      };

      const mockActivity = { id: 'activity-1', title: 'Test Activity' };
      const mockCreatedContent = {
        id: 'content-1',
        ...suspiciousContent,
        safetyRating: 'review_needed',
      };

      mockPrisma.studyActivity.findUnique.mockResolvedValue(mockActivity);
      mockPrisma.studyContent.create.mockResolvedValue(mockCreatedContent);

      const result = await contentService.createContent(suspiciousContent);

      expect(result.safetyRating).toBe('review_needed');
      expect(logger.warn).toHaveBeenCalledWith('Content flagged for review', expect.any(Object));
    });
  });

  describe('getContentById', () => {
    it('should return content with relations', async () => {
      const mockContent = {
        id: 'content-1',
        title: 'Test Content',
        activity: {
          id: 'activity-1',
          plan: {
            id: 'plan-1',
            child: { id: 'child-1', name: 'Test Child' }
          }
        },
        contentInteractions: []
      };

      mockPrisma.studyContent.findUnique.mockResolvedValue(mockContent);

      const result = await contentService.getContentById('content-1');

      expect(mockPrisma.studyContent.findUnique).toHaveBeenCalledWith({
        where: { id: 'content-1' },
        include: {
          activity: {
            include: {
              plan: {
                include: {
                  child: true
                }
              }
            }
          },
          contentInteractions: true
        }
      });
      expect(result).toEqual(mockContent);
    });

    it('should return null if content not found', async () => {
      mockPrisma.studyContent.findUnique.mockResolvedValue(null);

      const result = await contentService.getContentById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getContent', () => {
    it('should return paginated content with filters', async () => {
      const mockContent = [
        { id: 'content-1', title: 'Content 1' },
        { id: 'content-2', title: 'Content 2' }
      ];

      mockPrisma.studyContent.findMany.mockResolvedValue(mockContent);
      mockPrisma.studyContent.count.mockResolvedValue(10);

      const filters = {
        contentType: 'video',
        safetyRating: 'safe',
        difficultyLevel: 3
      };

      const result = await contentService.getContent(filters, 1, 5);

      expect(mockPrisma.studyContent.findMany).toHaveBeenCalledWith({
        where: {
          contentType: 'video',
          safetyRating: 'safe',
          difficultyLevel: 3
        },
        include: {
          activity: true,
          contentInteractions: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 5
      });

      expect(result).toEqual({
        content: mockContent,
        total: 10,
        pages: 2
      });
    });

    it('should handle age range filters', async () => {
      const mockContent = [{ id: 'content-1', title: 'Content 1' }];

      mockPrisma.studyContent.findMany.mockResolvedValue(mockContent);
      mockPrisma.studyContent.count.mockResolvedValue(1);

      const filters = {
        ageRange: { min: 8, max: 12 }
      };

      await contentService.getContent(filters);

      expect(mockPrisma.studyContent.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { ageAppropriateMin: { lte: 12 } },
            { ageAppropriateMax: { gte: 8 } }
          ]
        },
        include: {
          activity: true,
          contentInteractions: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('updateContent', () => {
    const updateData: UpdateContentData = {
      title: 'Updated Title',
      description: 'Updated description'
    };

    it('should update content successfully', async () => {
      const existingContent = {
        id: 'content-1',
        title: 'Old Title',
        contentUrl: 'https://example.com/old.mp4',
        safetyRating: 'safe'
      };

      const updatedContent = {
        ...existingContent,
        ...updateData
      };

      mockPrisma.studyContent.findUnique.mockResolvedValue(existingContent);
      mockPrisma.studyContent.update.mockResolvedValue(updatedContent);

      const result = await contentService.updateContent('content-1', updateData);

      expect(mockPrisma.studyContent.update).toHaveBeenCalledWith({
        where: { id: 'content-1' },
        data: {
          ...updateData,
          safetyRating: 'safe'
        }
      });
      expect(result).toEqual(updatedContent);
      expect(logger.info).toHaveBeenCalledWith('Content updated successfully', expect.any(Object));
    });

    it('should throw error if content not found', async () => {
      mockPrisma.studyContent.findUnique.mockResolvedValue(null);

      await expect(contentService.updateContent('nonexistent', updateData)).rejects.toThrow('Content not found');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      const mockContent = { id: 'content-1', title: 'Test Content' };

      mockPrisma.studyContent.findUnique.mockResolvedValue(mockContent);
      mockPrisma.studyContent.delete.mockResolvedValue(mockContent);

      await contentService.deleteContent('content-1');

      expect(mockPrisma.studyContent.delete).toHaveBeenCalledWith({
        where: { id: 'content-1' }
      });
      expect(logger.info).toHaveBeenCalledWith('Content deleted successfully', { contentId: 'content-1' });
    });

    it('should throw error if content not found', async () => {
      mockPrisma.studyContent.findUnique.mockResolvedValue(null);

      await expect(contentService.deleteContent('nonexistent')).rejects.toThrow('Content not found');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('trackInteraction', () => {
    const interactionData: ContentInteractionData = {
      childId: 'child-1',
      contentId: 'content-1',
      interactionType: 'view',
      progressPercentage: 50,
      timeSpent: 120
    };

    it('should track interaction successfully', async () => {
      const mockContent = { id: 'content-1', title: 'Test Content' };
      const mockChild = { id: 'child-1', name: 'Test Child' };
      const mockInteraction = {
        id: 'interaction-1',
        ...interactionData
      };

      mockPrisma.studyContent.findUnique.mockResolvedValue(mockContent);
      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.contentInteraction.upsert.mockResolvedValue(mockInteraction);

      const result = await contentService.trackInteraction(interactionData);

      expect(mockPrisma.contentInteraction.upsert).toHaveBeenCalledWith({
        where: {
          childId_contentId_interactionType: {
            childId: 'child-1',
            contentId: 'content-1',
            interactionType: 'view'
          }
        },
        update: {
          progressPercentage: 50,
          timeSpent: 120
        },
        create: {
          childId: 'child-1',
          contentId: 'content-1',
          interactionType: 'view',
          progressPercentage: 50,
          timeSpent: 120
        }
      });
      expect(result).toEqual(mockInteraction);
      expect(logger.info).toHaveBeenCalledWith('Content interaction tracked', expect.any(Object));
    });

    it('should throw error if content not found', async () => {
      mockPrisma.studyContent.findUnique.mockResolvedValue(null);
      mockPrisma.childProfile.findUnique.mockResolvedValue({ id: 'child-1' });

      await expect(contentService.trackInteraction(interactionData)).rejects.toThrow('Content not found');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw error if child not found', async () => {
      mockPrisma.studyContent.findUnique.mockResolvedValue({ id: 'content-1' });
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);

      await expect(contentService.trackInteraction(interactionData)).rejects.toThrow('Child profile not found');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getChildInteractions', () => {
    it('should return child interactions with content details', async () => {
      const mockInteractions = [
        {
          id: 'interaction-1',
          childId: 'child-1',
          contentId: 'content-1',
          interactionType: 'view',
          content: {
            id: 'content-1',
            title: 'Test Content',
            activity: { id: 'activity-1' }
          }
        }
      ];

      mockPrisma.contentInteraction.findMany.mockResolvedValue(mockInteractions);

      const result = await contentService.getChildInteractions('child-1', 'video', 25);

      expect(mockPrisma.contentInteraction.findMany).toHaveBeenCalledWith({
        where: {
          childId: 'child-1',
          content: {
            contentType: 'video'
          }
        },
        include: {
          content: {
            include: {
              activity: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 25
      });
      expect(result).toEqual(mockInteractions);
    });
  });

  describe('getContentAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const mockInteractions = [
        {
          contentId: 'content-1',
          interactionType: 'view',
          timeSpent: 100,
          progressPercentage: 80,
          content: { title: 'Content 1' }
        },
        {
          contentId: 'content-1',
          interactionType: 'complete',
          timeSpent: 120,
          progressPercentage: 100,
          content: { title: 'Content 1' }
        },
        {
          contentId: 'content-2',
          interactionType: 'view',
          timeSpent: 60,
          progressPercentage: 50,
          content: { title: 'Content 2' }
        }
      ];

      mockPrisma.contentInteraction.count
        .mockResolvedValueOnce(2) // total views
        .mockResolvedValueOnce(1); // total completions
      mockPrisma.contentInteraction.findMany.mockResolvedValue(mockInteractions);

      const result = await contentService.getContentAnalytics();

      expect(result).toEqual({
        totalViews: 2,
        totalCompletions: 1,
        averageTimeSpent: 93.33333333333333, // (100 + 120 + 60) / 3
        averageProgressPercentage: 76.66666666666667, // (80 + 100 + 50) / 3
        popularContent: [
          {
            contentId: 'content-1',
            title: 'Content 1',
            viewCount: 1,
            completionCount: 1,
            completionRate: 100
          },
          {
            contentId: 'content-2',
            title: 'Content 2',
            viewCount: 1,
            completionCount: 0,
            completionRate: 0
          }
        ]
      });
    });
  });

  describe('getContentRecommendations', () => {
    it('should return age-appropriate recommendations', async () => {
      const mockChild = {
        id: 'child-1',
        age: 10,
        contentInteractions: [
          { contentId: 'content-1', interactionType: 'complete' }
        ],
        studyPlans: []
      };

      const mockRecommendations = [
        {
          id: 'content-2',
          title: 'Recommended Content',
          ageAppropriateMin: 8,
          ageAppropriateMax: 12,
          safetyRating: 'safe'
        }
      ];

      mockPrisma.childProfile.findUnique.mockResolvedValue(mockChild);
      mockPrisma.studyContent.findMany.mockResolvedValue(mockRecommendations);

      const result = await contentService.getContentRecommendations('child-1', 5);

      expect(mockPrisma.studyContent.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { ageAppropriateMin: { lte: 10 } },
            { ageAppropriateMax: { gte: 10 } },
            { safetyRating: 'safe' },
            { id: { notIn: ['content-1'] } }
          ]
        },
        include: {
          activity: {
            include: {
              plan: true
            }
          },
          contentInteractions: true
        },
        orderBy: [
          { difficultyLevel: 'asc' },
          { createdAt: 'desc' }
        ],
        take: 5
      });
      expect(result).toEqual(mockRecommendations);
      expect(logger.info).toHaveBeenCalledWith('Content recommendations generated', expect.any(Object));
    });

    it('should throw error if child not found', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);

      await expect(contentService.getContentRecommendations('nonexistent')).rejects.toThrow('Child profile not found');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('bulkUpdateSafetyRatings', () => {
    it('should update multiple content safety ratings', async () => {
      const contentIds = ['content-1', 'content-2', 'content-3'];
      const safetyRating = 'review_needed';

      mockPrisma.studyContent.updateMany.mockResolvedValue({ count: 3 });

      const result = await contentService.bulkUpdateSafetyRatings(contentIds, safetyRating);

      expect(mockPrisma.studyContent.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: contentIds }
        },
        data: {
          safetyRating: 'review_needed'
        }
      });
      expect(result).toBe(3);
      expect(logger.info).toHaveBeenCalledWith('Bulk safety rating update completed', expect.any(Object));
    });
  });
});