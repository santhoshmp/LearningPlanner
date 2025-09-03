import { describe, it, expect, beforeEach, afterEach, jest, beforeAll } from '@jest/globals';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import crypto from 'crypto';

// Mock external dependencies
jest.mock('@google/generative-ai');
jest.mock('crypto');
jest.mock('./redisService');
jest.mock('../utils/logger');

const MockedGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;
const mockedCrypto = crypto as jest.Mocked<typeof crypto>;

// Mock types
interface MockGenerativeModel {
  generateContent: jest.Mock;
}

interface MockResponse {
  text: jest.Mock;
}

interface MockResult {
  response: Promise<MockResponse>;
}

describe('GeminiService', () => {
  let geminiService: any;
  let mockModel: MockGenerativeModel;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;

  const mockEnv = {
    GEMINI_API_KEY: 'test-gemini-api-key'
  };

  beforeAll(() => {
    // Set up environment variables
    Object.assign(process.env, mockEnv);
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock model
    mockModel = {
      generateContent: jest.fn()
    };

    // Create mock GoogleGenerativeAI instance
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    } as any;

    // Mock GoogleGenerativeAI constructor
    MockedGoogleGenerativeAI.mockImplementation(() => mockGenAI);

    // Mock crypto functions
    mockedCrypto.createHash = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mock-hash')
    } as any);

    // Import the service after mocking
    const { default: GeminiService } = await import('../geminiService');
    geminiService = new GeminiService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with API key', () => {
      expect(MockedGoogleGenerativeAI).toHaveBeenCalledWith(mockEnv.GEMINI_API_KEY);
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' });
    });

    it('should throw error without API key', async () => {
      delete process.env.GEMINI_API_KEY;
      
      const { default: GeminiService } = await import('../geminiService');
      
      expect(() => new GeminiService()).toThrow('GEMINI_API_KEY environment variable is required');
      
      // Restore API key
      process.env.GEMINI_API_KEY = mockEnv.GEMINI_API_KEY;
    });
  });

  describe('generateStudyPlan', () => {
    const mockRequest = {
      subject: 'Mathematics',
      childAge: 10,
      gradeLevel: '5th Grade',
      duration: 60,
      learningStyle: 'visual',
      currentLevel: 'intermediate',
      specificTopics: ['fractions', 'decimals'],
      learningObjectives: ['understand basic fractions', 'convert fractions to decimals'],
      preferences: {
        contentTypes: ['video', 'interactive'] as ('video' | 'article' | 'interactive')[],
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        includeGames: true
      }
    };

    const mockGeminiResponse = `{
      "planId": "plan-123",
      "title": "Mathematics Study Plan",
      "description": "A comprehensive math study plan",
      "estimatedDuration": 60,
      "activities": [
        {
          "id": "activity-1",
          "title": "Introduction to Fractions",
          "description": "Learn basic fraction concepts",
          "type": "video",
          "duration": 15,
          "difficulty": "medium",
          "learningObjectives": ["understand fractions"],
          "content": {
            "videoUrl": "https://example.com/video1",
            "thumbnailUrl": "https://example.com/thumb1.jpg"
          }
        }
      ],
      "contentRecommendations": [
        {
          "type": "video",
          "title": "Fraction Basics",
          "description": "Learn fractions step by step",
          "url": "https://example.com/video1",
          "duration": 300,
          "ageAppropriate": true,
          "safetyScore": 0.95,
          "source": "Educational Videos Inc",
          "tags": ["math", "fractions", "elementary"]
        }
      ],
      "safetyValidation": {
        "overallSafetyScore": 0.95,
        "contentFlags": [],
        "ageAppropriate": true,
        "parentalApprovalRequired": false
      }
    }`;

    it('should generate study plan successfully', async () => {
      const mockResponse: MockResponse = {
        text: jest.fn().mockReturnValue(mockGeminiResponse)
      };

      const mockResult: MockResult = {
        response: Promise.resolve(mockResponse)
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await geminiService.generateStudyPlan(mockRequest);

      expect(result).toEqual({
        planId: 'plan-123',
        title: 'Mathematics Study Plan',
        description: 'A comprehensive math study plan',
        estimatedDuration: 60,
        activities: expect.arrayContaining([
          expect.objectContaining({
            id: 'activity-1',
            title: 'Introduction to Fractions',
            type: 'video'
          })
        ]),
        contentRecommendations: expect.arrayContaining([
          expect.objectContaining({
            type: 'video',
            title: 'Fraction Basics',
            safetyScore: 0.95
          })
        ]),
        safetyValidation: expect.objectContaining({
          overallSafetyScore: 0.95,
          ageAppropriate: true
        })
      });

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Mathematics')
      );
    });

    it('should handle API errors gracefully', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('API Error'));

      await expect(geminiService.generateStudyPlan(mockRequest))
        .rejects.toThrow('Failed to generate study plan: API Error');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse: MockResponse = {
        text: jest.fn().mockReturnValue('Invalid JSON response')
      };

      const mockResult: MockResult = {
        response: Promise.resolve(mockResponse)
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      await expect(geminiService.generateStudyPlan(mockRequest))
        .rejects.toThrow('Failed to generate study plan');
    });

    it('should build correct prompt for study plan generation', async () => {
      const mockResponse: MockResponse = {
        text: jest.fn().mockReturnValue(mockGeminiResponse)
      };

      const mockResult: MockResult = {
        response: Promise.resolve(mockResponse)
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      await geminiService.generateStudyPlan(mockRequest);

      const calledPrompt = mockModel.generateContent.mock.calls[0][0];
      
      expect(calledPrompt).toContain('Mathematics');
      expect(calledPrompt).toContain('10');
      expect(calledPrompt).toContain('5th Grade');
      expect(calledPrompt).toContain('visual');
      expect(calledPrompt).toContain('fractions');
      expect(calledPrompt).toContain('decimals');
      expect(calledPrompt).toContain('JSON');
    });
  });

  describe('generateContentRecommendations', () => {
    const mockContentResponse = `[
      {
        "type": "video",
        "title": "Algebra Basics",
        "description": "Introduction to algebraic concepts",
        "url": "https://example.com/algebra-video",
        "duration": 600,
        "ageAppropriate": true,
        "safetyScore": 0.92,
        "source": "Math Academy",
        "tags": ["algebra", "math", "middle-school"],
        "difficulty": 3
      },
      {
        "type": "article",
        "title": "Understanding Variables",
        "description": "Learn about variables in algebra",
        "url": "https://example.com/variables-article",
        "duration": 300,
        "ageAppropriate": true,
        "safetyScore": 0.98,
        "source": "Educational Resources",
        "tags": ["variables", "algebra", "concepts"],
        "difficulty": 2
      }
    ]`;

    it('should generate content recommendations successfully', async () => {
      const mockResponse: MockResponse = {
        text: jest.fn().mockReturnValue(mockContentResponse)
      };

      const mockResult: MockResult = {
        response: Promise.resolve(mockResponse)
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await geminiService.generateContentRecommendations(
        'Mathematics',
        'Algebra',
        12,
        ['video', 'article']
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          type: 'video',
          title: 'Algebra Basics',
          safetyScore: 0.92,
          ageAppropriate: true
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          type: 'article',
          title: 'Understanding Variables',
          safetyScore: 0.98
        })
      );
    });

    it('should handle content recommendation errors', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Content API Error'));

      await expect(
        geminiService.generateContentRecommendations('Math', 'Algebra', 12)
      ).rejects.toThrow('Failed to generate content recommendations: Content API Error');
    });

    it('should filter content by age appropriateness', async () => {
      const mixedContentResponse = `[
        {
          "type": "video",
          "title": "Basic Math",
          "description": "Elementary math concepts",
          "url": "https://example.com/basic-math",
          "duration": 300,
          "ageAppropriate": true,
          "safetyScore": 0.95,
          "source": "Kids Math",
          "tags": ["math", "elementary"],
          "difficulty": 1
        },
        {
          "type": "video",
          "title": "Advanced Calculus",
          "description": "Complex calculus concepts",
          "url": "https://example.com/calculus",
          "duration": 900,
          "ageAppropriate": false,
          "safetyScore": 0.90,
          "source": "University Math",
          "tags": ["calculus", "advanced"],
          "difficulty": 5
        }
      ]`;

      const mockResponse: MockResponse = {
        text: jest.fn().mockReturnValue(mixedContentResponse)
      };

      const mockResult: MockResult = {
        response: Promise.resolve(mockResponse)
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await geminiService.generateContentRecommendations(
        'Mathematics',
        'Basic Math',
        8
      );

      // Should only return age-appropriate content
      expect(result).toHaveLength(1);
      expect(result[0].ageAppropriate).toBe(true);
      expect(result[0].title).toBe('Basic Math');
    });
  });

  describe('validateContentSafety', () => {
    const mockContent = {
      type: 'video' as const,
      title: 'Math Video',
      description: 'Educational math content',
      url: 'https://example.com/video',
      duration: 300,
      source: 'Educational Site',
      tags: ['math', 'education']
    };

    it('should validate content safety successfully', async () => {
      const mockSafetyResponse = `{
        "safetyScore": 0.95,
        "ageAppropriate": true,
        "contentFlags": [],
        "riskFactors": [],
        "recommendation": "approved",
        "parentalApprovalRequired": false,
        "details": {
          "violence": 0.01,
          "adult": 0.02,
          "language": 0.01,
          "educational": 0.98
        }
      }`;

      const mockResponse: MockResponse = {
        text: jest.fn().mockReturnValue(mockSafetyResponse)
      };

      const mockResult: MockResult = {
        response: Promise.resolve(mockResponse)
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await geminiService.validateContentSafety(mockContent, 10);

      expect(result).toEqual({
        safetyScore: 0.95,
        ageAppropriate: true,
        contentFlags: [],
        riskFactors: [],
        recommendation: 'approved',
        parentalApprovalRequired: false,
        details: {
          violence: 0.01,
          adult: 0.02,
          language: 0.01,
          educational: 0.98
        }
      });
    });

    it('should flag unsafe content', async () => {
      const mockUnsafeResponse = `{
        "safetyScore": 0.3,
        "ageAppropriate": false,
        "contentFlags": ["inappropriate_language", "violence"],
        "riskFactors": ["contains_profanity", "violent_imagery"],
        "recommendation": "blocked",
        "parentalApprovalRequired": true,
        "details": {
          "violence": 0.8,
          "adult": 0.1,
          "language": 0.7,
          "educational": 0.2
        }
      }`;

      const mockResponse: MockResponse = {
        text: jest.fn().mockReturnValue(mockUnsafeResponse)
      };

      const mockResult: MockResult = {
        response: Promise.resolve(mockResponse)
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await geminiService.validateContentSafety(mockContent, 8);

      expect(result.safetyScore).toBe(0.3);
      expect(result.ageAppropriate).toBe(false);
      expect(result.contentFlags).toContain('inappropriate_language');
      expect(result.contentFlags).toContain('violence');
      expect(result.recommendation).toBe('blocked');
      expect(result.parentalApprovalRequired).toBe(true);
    });

    it('should handle safety validation errors', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Safety API Error'));

      await expect(
        geminiService.validateContentSafety(mockContent, 10)
      ).rejects.toThrow('Failed to validate content safety: Safety API Error');
    });
  });

  describe('Caching', () => {
    const mockRequest = {
      subject: 'Mathematics',
      childAge: 10,
      gradeLevel: '5th Grade',
      duration: 60,
      learningStyle: 'visual',
      currentLevel: 'intermediate',
      specificTopics: ['fractions'],
      learningObjectives: ['understand fractions'],
      preferences: {
        contentTypes: ['video'] as ('video' | 'article' | 'interactive')[],
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        includeGames: false
      }
    };

    it('should generate cache key correctly', () => {
      const cacheKey = geminiService.generateCacheKey(mockRequest);
      
      expect(cacheKey).toContain('gemini:study_plan:');
      expect(mockedCrypto.createHash).toHaveBeenCalledWith('md5');
    });

    it('should cache responses', async () => {
      const mockRedisService = require('./redisService').redisService;
      mockRedisService.get = jest.fn().mockResolvedValue(null);
      mockRedisService.setex = jest.fn().mockResolvedValue('OK');

      const mockGeminiResponse = `{
        "planId": "plan-123",
        "title": "Test Plan",
        "description": "Test description",
        "estimatedDuration": 60,
        "activities": [],
        "contentRecommendations": [],
        "safetyValidation": {
          "overallSafetyScore": 0.95,
          "contentFlags": [],
          "ageAppropriate": true,
          "parentalApprovalRequired": false
        }
      }`;

      const mockResponse: MockResponse = {
        text: jest.fn().mockReturnValue(mockGeminiResponse)
      };

      const mockResult: MockResult = {
        response: Promise.resolve(mockResponse)
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      await geminiService.generateStudyPlan(mockRequest);

      expect(mockRedisService.setex).toHaveBeenCalledWith(
        expect.stringContaining('gemini:study_plan:'),
        86400, // 24 hours in seconds
        expect.any(String)
      );
    });

    it('should return cached responses', async () => {
      const cachedResponse = {
        planId: 'cached-plan',
        title: 'Cached Plan',
        description: 'From cache',
        estimatedDuration: 60,
        activities: [],
        contentRecommendations: [],
        safetyValidation: {
          overallSafetyScore: 0.95,
          contentFlags: [],
          ageAppropriate: true,
          parentalApprovalRequired: false
        }
      };

      const mockRedisService = require('./redisService').redisService;
      mockRedisService.get = jest.fn().mockResolvedValue(JSON.stringify(cachedResponse));

      const result = await geminiService.generateStudyPlan(mockRequest);

      expect(result).toEqual(cachedResponse);
      expect(mockModel.generateContent).not.toHaveBeenCalled();
    });
  });

  describe('Prompt Building', () => {
    it('should build comprehensive study plan prompt', () => {
      const request = {
        subject: 'Science',
        childAge: 12,
        gradeLevel: '7th Grade',
        duration: 90,
        learningStyle: 'kinesthetic',
        currentLevel: 'beginner',
        specificTopics: ['photosynthesis', 'plant biology'],
        learningObjectives: ['understand how plants make food'],
        preferences: {
          contentTypes: ['interactive', 'video'] as ('video' | 'article' | 'interactive')[],
          difficulty: 'easy' as 'easy' | 'medium' | 'hard',
          includeGames: true
        }
      };

      const prompt = geminiService.buildStudyPlanPrompt(request);

      expect(prompt).toContain('Science');
      expect(prompt).toContain('12');
      expect(prompt).toContain('7th Grade');
      expect(prompt).toContain('90');
      expect(prompt).toContain('kinesthetic');
      expect(prompt).toContain('photosynthesis');
      expect(prompt).toContain('plant biology');
      expect(prompt).toContain('interactive');
      expect(prompt).toContain('JSON');
    });

    it('should build content recommendation prompt', () => {
      const prompt = geminiService.buildContentRecommendationPrompt(
        'History',
        'World War II',
        14,
        ['video', 'article']
      );

      expect(prompt).toContain('History');
      expect(prompt).toContain('World War II');
      expect(prompt).toContain('14');
      expect(prompt).toContain('video');
      expect(prompt).toContain('article');
      expect(prompt).toContain('age-appropriate');
    });

    it('should build safety validation prompt', () => {
      const content = {
        type: 'video' as const,
        title: 'Test Video',
        description: 'Test description',
        url: 'https://example.com',
        duration: 300,
        source: 'Test Source',
        tags: ['test']
      };

      const prompt = geminiService.buildSafetyValidationPrompt(content, 10);

      expect(prompt).toContain('Test Video');
      expect(prompt).toContain('Test description');
      expect(prompt).toContain('10');
      expect(prompt).toContain('safety');
      expect(prompt).toContain('age-appropriate');
    });
  });

  describe('Response Parsing', () => {
    it('should parse study plan response correctly', () => {
      const mockResponse = `{
        "planId": "plan-456",
        "title": "English Study Plan",
        "description": "Comprehensive English learning",
        "estimatedDuration": 45,
        "activities": [
          {
            "id": "activity-1",
            "title": "Reading Comprehension",
            "description": "Improve reading skills",
            "type": "article",
            "duration": 20,
            "difficulty": "medium"
          }
        ],
        "contentRecommendations": [],
        "safetyValidation": {
          "overallSafetyScore": 0.98,
          "contentFlags": [],
          "ageAppropriate": true,
          "parentalApprovalRequired": false
        }
      }`;

      const request = {
        subject: 'English',
        childAge: 11,
        gradeLevel: '6th Grade',
        duration: 45,
        learningStyle: 'visual',
        currentLevel: 'intermediate',
        specificTopics: [],
        learningObjectives: [],
        preferences: {
          contentTypes: ['article'] as ('video' | 'article' | 'interactive')[],
          difficulty: 'medium' as 'easy' | 'medium' | 'hard',
          includeGames: false
        }
      };

      const parsed = geminiService.parseStudyPlanResponse(mockResponse, request);

      expect(parsed.planId).toBe('plan-456');
      expect(parsed.title).toBe('English Study Plan');
      expect(parsed.activities).toHaveLength(1);
      expect(parsed.activities[0].title).toBe('Reading Comprehension');
      expect(parsed.safetyValidation.overallSafetyScore).toBe(0.98);
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedResponse = '{ "planId": "test", invalid json }';
      const request = {
        subject: 'Math',
        childAge: 10,
        gradeLevel: '5th Grade',
        duration: 60,
        learningStyle: 'visual',
        currentLevel: 'intermediate',
        specificTopics: [],
        learningObjectives: [],
        preferences: {
          contentTypes: ['video'] as ('video' | 'article' | 'interactive')[],
          difficulty: 'medium' as 'easy' | 'medium' | 'hard',
          includeGames: false
        }
      };

      expect(() => {
        geminiService.parseStudyPlanResponse(malformedResponse, request);
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockModel.generateContent.mockRejectedValue(timeoutError);

      const request = {
        subject: 'Math',
        childAge: 10,
        gradeLevel: '5th Grade',
        duration: 60,
        learningStyle: 'visual',
        currentLevel: 'intermediate',
        specificTopics: [],
        learningObjectives: [],
        preferences: {
          contentTypes: ['video'] as ('video' | 'article' | 'interactive')[],
          difficulty: 'medium' as 'easy' | 'medium' | 'hard',
          includeGames: false
        }
      };

      await expect(geminiService.generateStudyPlan(request))
        .rejects.toThrow('Failed to generate study plan: Request timeout');
    });

    it('should handle API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      
      mockModel.generateContent.mockRejectedValue(rateLimitError);

      const request = {
        subject: 'Math',
        childAge: 10,
        gradeLevel: '5th Grade',
        duration: 60,
        learningStyle: 'visual',
        currentLevel: 'intermediate',
        specificTopics: [],
        learningObjectives: [],
        preferences: {
          contentTypes: ['video'] as ('video' | 'article' | 'interactive')[],
          difficulty: 'medium' as 'easy' | 'medium' | 'hard',
          includeGames: false
        }
      };

      await expect(geminiService.generateStudyPlan(request))
        .rejects.toThrow('Failed to generate study plan: Rate limit exceeded');
    });
  });
});