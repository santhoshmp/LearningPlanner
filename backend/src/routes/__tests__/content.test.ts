import request from 'supertest';
import express from 'express';
import contentRouter from '../content';
import { contentService } from '../../services/contentService';
import { authenticateToken } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../services/contentService');
jest.mock('../../middleware/auth');
jest.mock('../../utils/logger');

const mockContentService = contentService as jest.Mocked<typeof contentService>;
const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/content', contentRouter);

// Mock authentication middleware
mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
  req.user = { id: 'user-1', role: 'PARENT' };
  next();
  return undefined;
});

describe('Content Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/content', () => {
    const validContentData = {
      activityId: 'activity-1',
      contentType: 'video',
      title: 'Test Video',
      description: 'A test video',
      contentUrl: 'https://example.com/video.mp4',
      duration: 300,
      difficultyLevel: 3
    };

    it('should create content successfully', async () => {
      const mockCreatedContent = {
        id: 'content-1',
        ...validContentData,
        safetyRating: 'safe'
      };

      mockContentService.createContent.mockResolvedValue(mockCreatedContent as any);

      const response = await request(app)
        .post('/api/content')
        .send(validContentData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Content created successfully',
        data: mockCreatedContent
      });
      expect(mockContentService.createContent).toHaveBeenCalledWith(validContentData);
    });

    it('should return 400 for invalid content type', async () => {
      const invalidData = {
        ...validContentData,
        contentType: 'invalid'
      };

      const response = await request(app)
        .post('/api/content')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        contentType: 'video',
        title: 'Test Video'
        // missing activityId
      };

      const response = await request(app)
        .post('/api/content')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      mockContentService.createContent.mockRejectedValue(new Error('Activity not found'));

      const response = await request(app)
        .post('/api/content')
        .send(validContentData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Activity not found'
      });
    });
  });

  describe('GET /api/content/:id', () => {
    it('should return content by ID', async () => {
      const mockContent = {
        id: 'content-1',
        title: 'Test Content',
        contentType: 'video',
        activity: { id: 'activity-1' }
      };

      mockContentService.getContentById.mockResolvedValue(mockContent as any);

      const response = await request(app)
        .get('/api/content/content-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockContent
      });
      expect(mockContentService.getContentById).toHaveBeenCalledWith('content-1');
    });

    it('should return 404 if content not found', async () => {
      mockContentService.getContentById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/content/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Content not found'
      });
    });

    it('should handle service errors', async () => {
      mockContentService.getContentById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/content/content-1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch content'
      });
    });
  });

  describe('GET /api/content', () => {
    it('should return paginated content with filters', async () => {
      const mockResult = {
        content: [
          { id: 'content-1', title: 'Content 1' },
          { id: 'content-2', title: 'Content 2' }
        ],
        total: 10,
        pages: 2
      };

      mockContentService.getContent.mockResolvedValue(mockResult as any);

      const response = await request(app)
        .get('/api/content')
        .query({
          page: '1',
          limit: '5',
          contentType: 'video',
          safetyRating: 'safe',
          difficultyLevel: '3'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockResult.content,
        pagination: {
          page: 1,
          limit: 5,
          total: 10,
          pages: 2
        }
      });

      expect(mockContentService.getContent).toHaveBeenCalledWith(
        {
          contentType: 'video',
          safetyRating: 'safe',
          difficultyLevel: 3
        },
        1,
        5
      );
    });

    it('should handle age range filters', async () => {
      const mockResult = {
        content: [{ id: 'content-1', title: 'Content 1' }],
        total: 1,
        pages: 1
      };

      mockContentService.getContent.mockResolvedValue(mockResult as any);

      const response = await request(app)
        .get('/api/content')
        .query({
          ageMin: '8',
          ageMax: '12'
        });

      expect(response.status).toBe(200);
      expect(mockContentService.getContent).toHaveBeenCalledWith(
        {
          ageRange: { min: 8, max: 12 }
        },
        1,
        20
      );
    });

    it('should use default pagination values', async () => {
      const mockResult = {
        content: [],
        total: 0,
        pages: 0
      };

      mockContentService.getContent.mockResolvedValue(mockResult as any);

      const response = await request(app)
        .get('/api/content');

      expect(response.status).toBe(200);
      expect(mockContentService.getContent).toHaveBeenCalledWith({}, 1, 20);
    });
  });

  describe('PUT /api/content/:id', () => {
    const updateData = {
      title: 'Updated Title',
      description: 'Updated description',
      difficultyLevel: 5
    };

    it('should update content successfully', async () => {
      const mockUpdatedContent = {
        id: 'content-1',
        ...updateData,
        contentType: 'video'
      };

      mockContentService.updateContent.mockResolvedValue(mockUpdatedContent as any);

      const response = await request(app)
        .put('/api/content/content-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Content updated successfully',
        data: mockUpdatedContent
      });
      expect(mockContentService.updateContent).toHaveBeenCalledWith('content-1', updateData);
    });

    it('should return 404 if content not found', async () => {
      mockContentService.updateContent.mockRejectedValue(new Error('Content not found'));

      const response = await request(app)
        .put('/api/content/nonexistent')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Content not found'
      });
    });

    it('should validate update data', async () => {
      const invalidData = {
        title: '', // empty title
        difficultyLevel: 15 // invalid difficulty level
      };

      const response = await request(app)
        .put('/api/content/content-1')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/content/:id', () => {
    it('should delete content successfully', async () => {
      mockContentService.deleteContent.mockResolvedValue();

      const response = await request(app)
        .delete('/api/content/content-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Content deleted successfully'
      });
      expect(mockContentService.deleteContent).toHaveBeenCalledWith('content-1');
    });

    it('should return 404 if content not found', async () => {
      mockContentService.deleteContent.mockRejectedValue(new Error('Content not found'));

      const response = await request(app)
        .delete('/api/content/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Content not found'
      });
    });
  });

  describe('POST /api/content/:id/interact', () => {
    const interactionData = {
      childId: 'child-1',
      interactionType: 'view',
      progressPercentage: 50,
      timeSpent: 120
    };

    it('should track interaction successfully', async () => {
      const mockInteraction = {
        id: 'interaction-1',
        contentId: 'content-1',
        ...interactionData
      };

      mockContentService.trackInteraction.mockResolvedValue(mockInteraction as any);

      const response = await request(app)
        .post('/api/content/content-1/interact')
        .send(interactionData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Interaction tracked successfully',
        data: mockInteraction
      });

      expect(mockContentService.trackInteraction).toHaveBeenCalledWith({
        childId: 'child-1',
        contentId: 'content-1',
        interactionType: 'view',
        progressPercentage: 50,
        timeSpent: 120
      });
    });

    it('should validate interaction data', async () => {
      const invalidData = {
        childId: 'child-1',
        interactionType: 'invalid', // invalid interaction type
        progressPercentage: 150 // invalid percentage
      };

      const response = await request(app)
        .post('/api/content/content-1/interact')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if content or child not found', async () => {
      mockContentService.trackInteraction.mockRejectedValue(new Error('Content not found'));

      const response = await request(app)
        .post('/api/content/content-1/interact')
        .send(interactionData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Content not found'
      });
    });
  });

  describe('GET /api/content/child/:childId/interactions', () => {
    it('should return child interactions', async () => {
      const mockInteractions = [
        {
          id: 'interaction-1',
          childId: 'child-1',
          contentId: 'content-1',
          interactionType: 'view',
          content: { title: 'Test Content' }
        }
      ];

      mockContentService.getChildInteractions.mockResolvedValue(mockInteractions as any);

      const response = await request(app)
        .get('/api/content/child/child-1/interactions')
        .query({ contentType: 'video', limit: '25' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockInteractions
      });

      expect(mockContentService.getChildInteractions).toHaveBeenCalledWith('child-1', 'video', 25);
    });

    it('should use default limit', async () => {
      mockContentService.getChildInteractions.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/content/child/child-1/interactions');

      expect(response.status).toBe(200);
      expect(mockContentService.getChildInteractions).toHaveBeenCalledWith('child-1', undefined, 50);
    });
  });

  describe('GET /api/content/analytics/overview', () => {
    it('should return content analytics', async () => {
      const mockAnalytics = {
        totalViews: 100,
        totalCompletions: 50,
        averageTimeSpent: 120,
        averageProgressPercentage: 75,
        popularContent: []
      };

      mockContentService.getContentAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/content/analytics/overview')
        .query({
          activityId: 'activity-1',
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-12-31T23:59:59.999Z'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockAnalytics
      });

      expect(mockContentService.getContentAnalytics).toHaveBeenCalledWith(
        'activity-1',
        {
          start: new Date('2023-01-01T00:00:00.000Z'),
          end: new Date('2023-12-31T23:59:59.999Z')
        }
      );
    });

    it('should work without date range', async () => {
      const mockAnalytics = {
        totalViews: 50,
        totalCompletions: 25,
        averageTimeSpent: 90,
        averageProgressPercentage: 60,
        popularContent: []
      };

      mockContentService.getContentAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/content/analytics/overview');

      expect(response.status).toBe(200);
      expect(mockContentService.getContentAnalytics).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('GET /api/content/child/:childId/recommendations', () => {
    it('should return content recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'content-1',
          title: 'Recommended Content',
          contentType: 'video',
          safetyRating: 'safe'
        }
      ];

      mockContentService.getContentRecommendations.mockResolvedValue(mockRecommendations as any);

      const response = await request(app)
        .get('/api/content/child/child-1/recommendations')
        .query({ limit: '5' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockRecommendations
      });

      expect(mockContentService.getContentRecommendations).toHaveBeenCalledWith('child-1', 5);
    });

    it('should return 404 if child not found', async () => {
      mockContentService.getContentRecommendations.mockRejectedValue(new Error('Child profile not found'));

      const response = await request(app)
        .get('/api/content/child/nonexistent/recommendations');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Child profile not found'
      });
    });

    it('should use default limit', async () => {
      mockContentService.getContentRecommendations.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/content/child/child-1/recommendations');

      expect(response.status).toBe(200);
      expect(mockContentService.getContentRecommendations).toHaveBeenCalledWith('child-1', 10);
    });
  });

  describe('PUT /api/content/bulk/safety-rating', () => {
    const bulkUpdateData = {
      contentIds: ['content-1', 'content-2', 'content-3'],
      safetyRating: 'review_needed'
    };

    it('should bulk update safety ratings', async () => {
      mockContentService.bulkUpdateSafetyRatings.mockResolvedValue(3);

      const response = await request(app)
        .put('/api/content/bulk/safety-rating')
        .send(bulkUpdateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Updated 3 content items',
        data: { updatedCount: 3 }
      });

      expect(mockContentService.bulkUpdateSafetyRatings).toHaveBeenCalledWith(
        ['content-1', 'content-2', 'content-3'],
        'review_needed'
      );
    });

    it('should validate bulk update data', async () => {
      const invalidData = {
        contentIds: [], // empty array
        safetyRating: 'invalid' // invalid rating
      };

      const response = await request(app)
        .put('/api/content/bulk/safety-rating')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      mockContentService.bulkUpdateSafetyRatings.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/content/bulk/safety-rating')
        .send(bulkUpdateData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to update safety ratings'
      });
    });
  });
});