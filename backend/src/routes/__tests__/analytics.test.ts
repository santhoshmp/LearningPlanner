import request from 'supertest';
import app from '../../index';
import analyticsService from '../../services/analyticsService';
import { authService } from '../../services/authService';
import { redisService } from '../../services/redisService';

// Mock dependencies
jest.mock('../../services/analyticsService');
jest.mock('../../services/authService');
jest.mock('../../services/redisService');

describe('Analytics Routes', () => {
  const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockRedisService = redisService as jest.Mocked<typeof redisService>;
  
  const childId = 'child-123';
  const parentId = 'parent-123';
  const activityId = 'activity-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisService.isTokenBlacklisted.mockResolvedValue(false);
  });
  
  describe('POST /api/analytics/track/completion', () => {
    const validCompletionData = {
      childId,
      activityId,
      score: 85,
      timeSpent: 300
    };
    
    const mockProgressRecord = {
      id: 'progress-123',
      childId,
      activityId,
      status: 'COMPLETED',
      score: 85,
      timeSpent: 300,
      attempts: 1,
      completedAt: new Date()
    };
    
    it('should track activity completion successfully as a child', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: childId,
        role: 'CHILD'
      });
      
      mockAnalyticsService.trackActivityCompletion.mockResolvedValue(mockProgressRecord);
      
      // Act
      const response = await request(app)
        .post('/api/analytics/track/completion')
        .set('Authorization', 'Bearer valid-child-token')
        .send(validCompletionData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProgressRecord);
      
      expect(mockAnalyticsService.trackActivityCompletion).toHaveBeenCalledWith(
        childId,
        activityId,
        validCompletionData.score,
        validCompletionData.timeSpent
      );
    });
    
    it('should track activity completion successfully as a parent', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: parentId,
        role: 'PARENT'
      });
      
      mockAnalyticsService.trackActivityCompletion.mockResolvedValue(mockProgressRecord);
      
      // Act
      const response = await request(app)
        .post('/api/analytics/track/completion')
        .set('Authorization', 'Bearer valid-parent-token')
        .send(validCompletionData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProgressRecord);
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .post('/api/analytics/track/completion')
        .send(validCompletionData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockAnalyticsService.trackActivityCompletion).not.toHaveBeenCalled();
    });
    
    it('should return 403 when child tries to access another child\'s data', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: 'different-child-id',
        role: 'CHILD'
      });
      
      // Act
      const response = await request(app)
        .post('/api/analytics/track/completion')
        .set('Authorization', 'Bearer valid-child-token')
        .send(validCompletionData);
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockAnalyticsService.trackActivityCompletion).not.toHaveBeenCalled();
    });
    
    it('should return 400 for invalid completion data', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: childId,
        role: 'CHILD'
      });
      
      const invalidData = {
        childId: '',
        activityId: '',
        score: 'not-a-number',
        timeSpent: 'not-a-number'
      };
      
      // Act
      const response = await request(app)
        .post('/api/analytics/track/completion')
        .set('Authorization', 'Bearer valid-child-token')
        .send(invalidData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(mockAnalyticsService.trackActivityCompletion).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/analytics/progress/:childId', () => {
    const timeFrame = {
      start: '2023-01-01T00:00:00Z',
      end: '2023-01-31T23:59:59Z'
    };
    
    const mockProgressReport = {
      childId,
      completionRate: 75,
      averageScore: 85,
      totalTimeSpent: 1200,
      activitiesCompleted: 3,
      activitiesInProgress: 1,
      activitiesNotStarted: 0,
      helpRequestsCount: 2,
      lastActivityDate: '2023-01-15T14:30:00Z'
    };
    
    it('should get progress report successfully as a parent', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: parentId,
        role: 'PARENT'
      });
      
      mockAnalyticsService.generateProgressReport.mockResolvedValue(mockProgressReport);
      
      // Act
      const response = await request(app)
        .get(`/api/analytics/progress/${childId}?start=${timeFrame.start}&end=${timeFrame.end}`)
        .set('Authorization', 'Bearer valid-parent-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProgressReport);
      
      expect(mockAnalyticsService.generateProgressReport).toHaveBeenCalledWith(
        childId,
        timeFrame
      );
    });
    
    it('should get progress report successfully as the child', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: childId,
        role: 'CHILD'
      });
      
      mockAnalyticsService.generateProgressReport.mockResolvedValue(mockProgressReport);
      
      // Act
      const response = await request(app)
        .get(`/api/analytics/progress/${childId}?start=${timeFrame.start}&end=${timeFrame.end}`)
        .set('Authorization', 'Bearer valid-child-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProgressReport);
    });
    
    it('should return 403 when child tries to access another child\'s data', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: 'different-child-id',
        role: 'CHILD'
      });
      
      // Act
      const response = await request(app)
        .get(`/api/analytics/progress/${childId}?start=${timeFrame.start}&end=${timeFrame.end}`)
        .set('Authorization', 'Bearer valid-child-token');
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockAnalyticsService.generateProgressReport).not.toHaveBeenCalled();
    });
    
    it('should return 400 for missing time frame parameters', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: parentId,
        role: 'PARENT'
      });
      
      // Act
      const response = await request(app)
        .get(`/api/analytics/progress/${childId}`)
        .set('Authorization', 'Bearer valid-parent-token');
      
      // Assert
      expect(response.status).toBe(400);
      expect(mockAnalyticsService.generateProgressReport).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/analytics/patterns/:childId', () => {
    const mockLearningPatterns = {
      subjectInsights: [
        {
          subject: 'Mathematics',
          averageScore: 90,
          isStrength: true
        },
        {
          subject: 'Reading',
          averageScore: 65,
          isWeakness: true
        }
      ],
      timeBasedPatterns: {
        weeklyTrends: [],
        trends: {}
      },
      difficultyProgression: [],
      recommendedFocus: {
        strengths: ['Mathematics'],
        focusAreas: ['Reading']
      }
    };
    
    it('should get learning patterns successfully as a parent', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: parentId,
        role: 'PARENT'
      });
      
      mockAnalyticsService.detectLearningPatterns.mockResolvedValue(mockLearningPatterns);
      
      // Act
      const response = await request(app)
        .get(`/api/analytics/patterns/${childId}`)
        .set('Authorization', 'Bearer valid-parent-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLearningPatterns);
      
      expect(mockAnalyticsService.detectLearningPatterns).toHaveBeenCalledWith(childId);
    });
    
    it('should return 403 when authenticated as child', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: childId,
        role: 'CHILD'
      });
      
      // Act
      const response = await request(app)
        .get(`/api/analytics/patterns/${childId}`)
        .set('Authorization', 'Bearer valid-child-token');
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockAnalyticsService.detectLearningPatterns).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/analytics/alerts/:childId', () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        childId,
        childName: 'Alice',
        type: 'inactivity',
        message: 'Alice hasn\'t engaged with any study activities in 5 days',
        severity: 'warning',
        createdAt: new Date().toISOString(),
        read: false
      },
      {
        id: 'alert-2',
        childId,
        childName: 'Alice',
        type: 'achievement',
        message: 'Alice earned the "Math Master" achievement!',
        severity: 'success',
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
    
    it('should get alerts successfully as a parent', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: parentId,
        role: 'PARENT'
      });
      
      mockAnalyticsService.generateAlerts.mockResolvedValue(mockAlerts);
      
      // Act
      const response = await request(app)
        .get(`/api/analytics/alerts/${childId}`)
        .set('Authorization', 'Bearer valid-parent-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAlerts);
      
      expect(mockAnalyticsService.generateAlerts).toHaveBeenCalledWith(childId);
    });
    
    it('should return 403 when authenticated as child', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        id: childId,
        role: 'CHILD'
      });
      
      // Act
      const response = await request(app)
        .get(`/api/analytics/alerts/${childId}`)
        .set('Authorization', 'Bearer valid-child-token');
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockAnalyticsService.generateAlerts).not.toHaveBeenCalled();
    });
  });
});