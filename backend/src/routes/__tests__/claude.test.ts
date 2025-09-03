import request from 'supertest';
import app from '../../index';
import { claudeService } from '../../services/claudeService';
import { authService } from '../../services/authService';
import { redisService } from '../../services/redisService';

// Mock dependencies
jest.mock('../../services/claudeService');
jest.mock('../../services/authService');
jest.mock('../../services/redisService');

describe('Claude Routes', () => {
  const mockClaudeService = claudeService as jest.Mocked<typeof claudeService>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockRedisService = redisService as jest.Mocked<typeof redisService>;
  
  const childId = 'child-123';
  const parentId = 'parent-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisService.isTokenBlacklisted.mockResolvedValue(false);
  });
  
  describe('POST /api/claude/help', () => {
    const validHelpRequest = {
      question: 'How do I solve this math problem?',
      activityId: 'activity-123',
      childAge: 8,
      activityContext: {
        title: 'Math Problem Solving',
        subject: 'Mathematics',
        currentStep: 2,
        currentContent: { problem: '5 + 3 = ?' }
      }
    };
    
    const mockHelpResponse = {
      id: 'help-123',
      question: validHelpRequest.question,
      response: 'To solve 5 + 3, you need to add the numbers together. 5 + 3 = 8.',
      timestamp: new Date().toISOString()
    };
    
    it('should request help from Claude successfully as a child', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: childId,
        role: 'CHILD'
      });
      
      mockClaudeService.requestHelp.mockResolvedValue(mockHelpResponse);
      
      // Act
      const response = await request(app)
        .post('/api/claude/help')
        .set('Authorization', 'Bearer valid-child-token')
        .send(validHelpRequest);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        helpRequest: mockHelpResponse
      });
      
      expect(mockClaudeService.requestHelp).toHaveBeenCalledWith({
        ...validHelpRequest,
        childId
      });
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .post('/api/claude/help')
        .send(validHelpRequest);
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockClaudeService.requestHelp).not.toHaveBeenCalled();
    });
    
    it('should return 403 when authenticated as parent', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: parentId,
        role: 'PARENT'
      });
      
      // Act
      const response = await request(app)
        .post('/api/claude/help')
        .set('Authorization', 'Bearer valid-parent-token')
        .send(validHelpRequest);
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockClaudeService.requestHelp).not.toHaveBeenCalled();
    });
    
    it('should return 400 for invalid help request data', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: childId,
        role: 'CHILD'
      });
      
      const invalidRequest = {
        question: '',
        activityId: '',
        childAge: 25, // Too old
        activityContext: {
          // Missing required fields
        }
      };
      
      // Act
      const response = await request(app)
        .post('/api/claude/help')
        .set('Authorization', 'Bearer valid-child-token')
        .send(invalidRequest);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.stringContaining('question'),
            expect.stringContaining('activityId'),
            expect.stringContaining('childAge'),
            expect.stringContaining('activityContext')
          ])
        })
      });
      
      expect(mockClaudeService.requestHelp).not.toHaveBeenCalled();
    });
    
    it('should return 500 when Claude service fails', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: childId,
        role: 'CHILD'
      });
      
      mockClaudeService.requestHelp.mockRejectedValue(
        new Error('Failed to get help from Claude')
      );
      
      // Act
      const response = await request(app)
        .post('/api/claude/help')
        .set('Authorization', 'Bearer valid-child-token')
        .send(validHelpRequest);
      
      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to get help from Claude'
      });
    });
  });
  
  describe('GET /api/claude/help-requests/:childId', () => {
    const mockHelpRequests = [
      {
        id: 'help-1',
        question: 'How do I solve this math problem?',
        response: 'To solve 5 + 3, you need to add the numbers together. 5 + 3 = 8.',
        activityId: 'activity-1',
        timestamp: new Date().toISOString()
      },
      {
        id: 'help-2',
        question: 'What does this word mean?',
        response: 'The word "photosynthesis" refers to the process plants use to convert sunlight into energy.',
        activityId: 'activity-2',
        timestamp: new Date().toISOString()
      }
    ];
    
    it('should get help requests for a child successfully as a parent', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: parentId,
        role: 'PARENT'
      });
      
      mockAuthService.verifyParentOfChild.mockResolvedValue(true);
      mockClaudeService.getHelpRequestsByChild.mockResolvedValue(mockHelpRequests);
      
      // Act
      const response = await request(app)
        .get(`/api/claude/help-requests/${childId}`)
        .set('Authorization', 'Bearer valid-parent-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        helpRequests: mockHelpRequests
      });
      
      expect(mockClaudeService.getHelpRequestsByChild).toHaveBeenCalledWith(childId);
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .get(`/api/claude/help-requests/${childId}`);
      
      // Assert
      expect(response.status).toBe(401);
      expect(mockClaudeService.getHelpRequestsByChild).not.toHaveBeenCalled();
    });
    
    it('should return 403 when authenticated as child', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: childId,
        role: 'CHILD'
      });
      
      // Act
      const response = await request(app)
        .get(`/api/claude/help-requests/${childId}`)
        .set('Authorization', 'Bearer valid-child-token');
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockClaudeService.getHelpRequestsByChild).not.toHaveBeenCalled();
    });
    
    it('should return 403 when parent does not own child profile', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: parentId,
        role: 'PARENT'
      });
      
      mockAuthService.verifyParentOfChild.mockResolvedValue(false);
      
      // Act
      const response = await request(app)
        .get(`/api/claude/help-requests/${childId}`)
        .set('Authorization', 'Bearer valid-parent-token');
      
      // Assert
      expect(response.status).toBe(403);
      expect(mockClaudeService.getHelpRequestsByChild).not.toHaveBeenCalled();
    });
    
    it('should return 500 when service fails', async () => {
      // Arrange
      mockAuthService.verifyAccessToken.mockReturnValue({
        userId: parentId,
        role: 'PARENT'
      });
      
      mockAuthService.verifyParentOfChild.mockResolvedValue(true);
      mockClaudeService.getHelpRequestsByChild.mockRejectedValue(
        new Error('Failed to fetch help requests')
      );
      
      // Act
      const response = await request(app)
        .get(`/api/claude/help-requests/${childId}`)
        .set('Authorization', 'Bearer valid-parent-token');
      
      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch help requests'
      });
    });
  });
});