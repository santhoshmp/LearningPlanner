import { claudeService } from '../claudeService';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/logger');
jest.mock('../../utils/database', () => ({
  prisma: {
    helpRequest: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

describe('ClaudeService', () => {
  const mockAxios = axios as jest.Mocked<typeof axios>;
  const mockPrisma = prisma as jest.Mocked<any>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('requestHelp', () => {
    const mockParams = {
      question: 'How do I solve this math problem?',
      activityId: 'activity-123',
      childId: 'child-123',
      childAge: 8,
      activityContext: {
        title: 'Math Problem Solving',
        subject: 'Mathematics',
        currentStep: 2,
        currentContent: { problem: '5 + 3 = ?' }
      }
    };
    
    const mockClaudeResponse = {
      data: {
        id: 'claude-response-123',
        content: 'To solve 5 + 3, you need to add the numbers together. 5 + 3 = 8.',
        model: 'claude-3-haiku-20240307',
        usage: {
          input_tokens: 150,
          output_tokens: 50
        }
      }
    };
    
    const mockHelpRequest = {
      id: 'help-123',
      question: mockParams.question,
      response: mockClaudeResponse.data.content,
      activityId: mockParams.activityId,
      childId: mockParams.childId,
      timestamp: new Date(),
      tokensUsed: 200
    };
    
    it('should successfully request help from Claude', async () => {
      // Arrange
      mockAxios.post.mockResolvedValue(mockClaudeResponse);
      mockPrisma.helpRequest.create.mockResolvedValue(mockHelpRequest);
      
      // Act
      const result = await claudeService.requestHelp(mockParams);
      
      // Assert
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'claude-3-haiku-20240307',
          system: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(mockParams.question)
            })
          ])
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': expect.any(String),
            'anthropic-version': '2023-06-01'
          })
        })
      );
      
      expect(mockPrisma.helpRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          question: mockParams.question,
          response: mockClaudeResponse.data.content,
          activityId: mockParams.activityId,
          childId: mockParams.childId,
          tokensUsed: 200
        })
      });
      
      expect(result).toEqual({
        id: mockHelpRequest.id,
        question: mockHelpRequest.question,
        response: mockHelpRequest.response,
        timestamp: expect.any(String)
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockError = new Error('API Error');
      mockAxios.post.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(claudeService.requestHelp(mockParams))
        .rejects.toThrow('Failed to get help from Claude');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Error requesting help from Claude:',
        mockError
      );
    });
  });
  
  describe('createSystemPrompt', () => {
    const mockActivityContext = {
      title: 'Math Problem Solving',
      subject: 'Mathematics'
    };
    
    it('should create age-appropriate prompt for young children (age <= 7)', () => {
      // Act
      const prompt = claudeService.createSystemPrompt(6, mockActivityContext);
      
      // Assert
      expect(prompt).toContain('You are a helpful, friendly AI tutor named Claude');
      expect(prompt).toContain('Since the child is 6 years old (quite young)');
      expect(prompt).toContain('Use very simple language and short sentences');
      expect(prompt).toContain('Be extremely encouraging and positive');
      expect(prompt).toContain('IMPORTANT SAFETY GUIDELINES');
    });
    
    it('should create age-appropriate prompt for middle-age children (age <= 10)', () => {
      // Act
      const prompt = claudeService.createSystemPrompt(9, mockActivityContext);
      
      // Assert
      expect(prompt).toContain('You are a helpful, friendly AI tutor named Claude');
      expect(prompt).toContain('Since the child is 9 years old');
      expect(prompt).toContain('Use clear, straightforward language');
      expect(prompt).toContain('Be encouraging and supportive');
      expect(prompt).toContain('IMPORTANT SAFETY GUIDELINES');
    });
    
    it('should create age-appropriate prompt for older children (age > 10)', () => {
      // Act
      const prompt = claudeService.createSystemPrompt(12, mockActivityContext);
      
      // Assert
      expect(prompt).toContain('You are a helpful, friendly AI tutor named Claude');
      expect(prompt).toContain('Since the child is 12 years old');
      expect(prompt).toContain('Use age-appropriate language that respects their intelligence');
      expect(prompt).toContain('Be supportive but not condescending');
      expect(prompt).toContain('IMPORTANT SAFETY GUIDELINES');
    });
  });
  
  describe('getHelpRequestsByChild', () => {
    const childId = 'child-123';
    const mockHelpRequests = [
      {
        id: 'help-1',
        question: 'How do I solve this?',
        response: 'Here is how you solve it...',
        activityId: 'activity-1',
        timestamp: new Date()
      },
      {
        id: 'help-2',
        question: 'What does this word mean?',
        response: 'This word means...',
        activityId: 'activity-2',
        timestamp: new Date()
      }
    ];
    
    it('should return help requests for a specific child', async () => {
      // Arrange
      mockPrisma.helpRequest.findMany.mockResolvedValue(mockHelpRequests);
      
      // Act
      const result = await claudeService.getHelpRequestsByChild(childId);
      
      // Assert
      expect(mockPrisma.helpRequest.findMany).toHaveBeenCalledWith({
        where: { childId },
        orderBy: { timestamp: 'desc' }
      });
      
      expect(result).toEqual(mockHelpRequests.map(request => ({
        id: request.id,
        question: request.question,
        response: request.response,
        activityId: request.activityId,
        timestamp: expect.any(String)
      })));
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Database Error');
      mockPrisma.helpRequest.findMany.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(claudeService.getHelpRequestsByChild(childId))
        .rejects.toThrow('Failed to fetch help requests');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching help requests:',
        mockError
      );
    });
  });
});