import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import { createServer } from 'http';

// Import your app setup
import { setupApp } from '../../app';

// Mock Google Generative AI
jest.mock('@google/generative-ai');
const MockedGoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;

// Mock Redis for caching
jest.mock('../../services/redisService');
const mockRedisService = require('../../services/redisService').redisService;

describe('Gemini API Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let prisma: PrismaClient;
  let mockModel: any;
  let testUser: any;
  let testChild: any;
  let authToken: string;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    process.env.GEMINI_API_KEY = 'test-gemini-api-key';

    // Initialize Prisma
    prisma = new PrismaClient();
    
    // Set up Express app
    app = setupApp();
    server = createServer(app);
    
    // Clean up database
    await prisma.$executeRaw`TRUNCATE TABLE "User", "Child", "StudyPlan", "StudyActivity", "StudyContent" CASCADE`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock Gemini model
    mockModel = {
      generateContent: jest.fn()
    };

    MockedGoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    // Set up mock Redis
    mockRedisService.get = jest.fn().mockResolvedValue(null);
    mockRedisService.setex = jest.fn().mockResolvedValue('OK');

    // Create test user and child
    testUser = await prisma.user.create({
      data: {
        email: 'parent@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'Parent',
        role: 'PARENT'
      }
    });

    testChild = await prisma.child.create({
      data: {
        parentId: testUser.id,
        firstName: 'Test',
        lastName: 'Child',
        age: 10,
        gradeLevel: '5th Grade'
      }
    });

    // Generate auth token (simplified for testing)
    authToken = `Bearer test-token-${testUser.id}`;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.studyContent.deleteMany();
    await prisma.studyActivity.deleteMany();
    await prisma.studyPlan.deleteMany();
    await prisma.child.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Study Plan Generation', () => {
    it('should generate study plan with Gemini successfully', async () => {
      const mockGeminiResponse = {
        response: Promise.resolve({
          text: () => JSON.stringify({
            planId: 'generated-plan-123',
            title: 'Mathematics Study Plan for 5th Grade',
            description: 'A comprehensive math study plan focusing on fractions and decimals',
            estimatedDuration: 60,
            activities: [
              {
                id: 'activity-1',
                title: 'Introduction to Fractions',
                description: 'Learn basic fraction concepts',
                type: 'video',
                duration: 15,
                difficulty: 'medium',
                learningObjectives: ['understand fractions', 'identify numerator and denominator'],
                content: {
                  videoUrl: 'https://example.com/fractions-intro',
                  thumbnailUrl: 'https://example.com/fractions-thumb.jpg'
                }
              },
              {
                id: 'activity-2',
                title: 'Fraction Practice',
                description: 'Interactive fraction exercises',
                type: 'interactive',
                duration: 20,
                difficulty: 'medium',
                learningObjectives: ['practice fraction operations'],
                content: {
                  interactiveUrl: 'https://example.com/fraction-practice'
                }
              }
            ],
            contentRecommendations: [
              {
                type: 'video',
                title: 'Fraction Fundamentals',
                description: 'Comprehensive video on fraction basics',
                url: 'https://example.com/fraction-fundamentals',
                duration: 300,
                ageAppropriate: true,
                safetyScore: 0.95,
                source: 'Educational Videos Inc',
                tags: ['math', 'fractions', 'elementary'],
                difficulty: 2
              }
            ],
            safetyValidation: {
              overallSafetyScore: 0.95,
              contentFlags: [],
              ageAppropriate: true,
              parentalApprovalRequired: false
            }
          })
        })
      };

      mockModel.generateContent.mockResolvedValue(mockGeminiResponse);

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          subject: 'Mathematics',
          duration: 60,
          learningStyle: 'visual',
          currentLevel: 'intermediate',
          specificTopics: ['fractions', 'decimals'],
          learningObjectives: ['understand basic fractions', 'convert fractions to decimals'],
          preferences: {
            contentTypes: ['video', 'interactive'],
            difficulty: 'medium',
            includeGames: true
          }
        })
        .expect(200);

      expect(response.body).toEqual({
        planId: 'generated-plan-123',
        title: 'Mathematics Study Plan for 5th Grade',
        description: expect.any(String),
        estimatedDuration: 60,
        activities: expect.arrayContaining([
          expect.objectContaining({
            id: 'activity-1',
            title: 'Introduction to Fractions',
            type: 'video',
            duration: 15
          }),
          expect.objectContaining({
            id: 'activity-2',
            title: 'Fraction Practice',
            type: 'interactive',
            duration: 20
          })
        ]),
        contentRecommendations: expect.arrayContaining([
          expect.objectContaining({
            type: 'video',
            title: 'Fraction Fundamentals',
            safetyScore: 0.95,
            ageAppropriate: true
          })
        ]),
        safetyValidation: expect.objectContaining({
          overallSafetyScore: 0.95,
          ageAppropriate: true,
          parentalApprovalRequired: false
        })
      });

      // Verify Gemini was called with correct parameters
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Mathematics')
      );
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('5th Grade')
      );
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('fractions')
      );
    });

    it('should handle content safety validation', async () => {
      const mockUnsafeContent = {
        response: Promise.resolve({
          text: () => JSON.stringify({
            planId: 'unsafe-plan-123',
            title: 'Study Plan with Unsafe Content',
            description: 'Plan containing flagged content',
            estimatedDuration: 60,
            activities: [],
            contentRecommendations: [
              {
                type: 'video',
                title: 'Inappropriate Video',
                description: 'Video with violence and inappropriate content',
                url: 'https://example.com/unsafe-video',
                duration: 300,
                ageAppropriate: false,
                safetyScore: 0.2,
                source: 'Questionable Source',
                tags: ['violence', 'inappropriate'],
                difficulty: 3
              }
            ],
            safetyValidation: {
              overallSafetyScore: 0.3,
              contentFlags: ['inappropriate_content', 'violence'],
              ageAppropriate: false,
              parentalApprovalRequired: true
            }
          })
        })
      };

      mockModel.generateContent.mockResolvedValue(mockUnsafeContent);

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          subject: 'General',
          duration: 60,
          learningStyle: 'visual',
          currentLevel: 'intermediate'
        })
        .expect(200);

      expect(response.body.safetyValidation.parentalApprovalRequired).toBe(true);
      expect(response.body.safetyValidation.contentFlags).toContain('inappropriate_content');
      expect(response.body.contentRecommendations).toHaveLength(0); // Unsafe content filtered out

      // Verify parental approval request was created
      const approvalRequest = await prisma.parentalApprovalRequest.findFirst({
        where: {
          childId: testChild.id,
          contentType: 'study_plan'
        }
      });

      expect(approvalRequest).toBeTruthy();
      expect(approvalRequest?.status).toBe('pending');
    });

    it('should use caching for repeated requests', async () => {
      const cachedResponse = {
        planId: 'cached-plan-123',
        title: 'Cached Mathematics Plan',
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

      // Mock cache hit
      mockRedisService.get.mockResolvedValueOnce(JSON.stringify(cachedResponse));

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          subject: 'Mathematics',
          duration: 60,
          learningStyle: 'visual',
          currentLevel: 'intermediate'
        })
        .expect(200);

      expect(response.body).toEqual(cachedResponse);
      expect(mockModel.generateContent).not.toHaveBeenCalled(); // Should use cache
      expect(mockRedisService.get).toHaveBeenCalled();
    });

    it('should handle Gemini API errors gracefully', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Gemini API Error'));

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          subject: 'Mathematics',
          duration: 60,
          learningStyle: 'visual',
          currentLevel: 'intermediate'
        })
        .expect(500);

      expect(response.body.error).toContain('Failed to generate study plan');
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          // Missing required fields
          subject: 'Mathematics'
        })
        .expect(400);

      expect(response.body.error).toContain('Missing required parameters');
    });
  });

  describe('Content Recommendations', () => {
    it('should generate content recommendations', async () => {
      const mockContentResponse = {
        response: Promise.resolve({
          text: () => JSON.stringify([
            {
              type: 'video',
              title: 'Algebra Basics',
              description: 'Introduction to algebraic concepts',
              url: 'https://example.com/algebra-video',
              duration: 600,
              ageAppropriate: true,
              safetyScore: 0.92,
              source: 'Math Academy',
              tags: ['algebra', 'math', 'middle-school'],
              difficulty: 3
            },
            {
              type: 'article',
              title: 'Understanding Variables',
              description: 'Learn about variables in algebra',
              url: 'https://example.com/variables-article',
              duration: 300,
              ageAppropriate: true,
              safetyScore: 0.98,
              source: 'Educational Resources',
              tags: ['variables', 'algebra', 'concepts'],
              difficulty: 2
            }
          ])
        })
      };

      mockModel.generateContent.mockResolvedValue(mockContentResponse);

      const response = await request(app)
        .post('/api/gemini/content-recommendations')
        .set('Authorization', authToken)
        .send({
          subject: 'Mathematics',
          topic: 'Algebra',
          childAge: testChild.age,
          contentTypes: ['video', 'article']
        })
        .expect(200);

      expect(response.body.recommendations).toHaveLength(2);
      expect(response.body.recommendations[0]).toEqual(
        expect.objectContaining({
          type: 'video',
          title: 'Algebra Basics',
          safetyScore: 0.92,
          ageAppropriate: true
        })
      );
      expect(response.body.recommendations[1]).toEqual(
        expect.objectContaining({
          type: 'article',
          title: 'Understanding Variables',
          safetyScore: 0.98
        })
      );
    });

    it('should filter age-inappropriate content', async () => {
      const mockMixedContent = {
        response: Promise.resolve({
          text: () => JSON.stringify([
            {
              type: 'video',
              title: 'Basic Math',
              description: 'Elementary math concepts',
              url: 'https://example.com/basic-math',
              duration: 300,
              ageAppropriate: true,
              safetyScore: 0.95,
              source: 'Kids Math',
              tags: ['math', 'elementary'],
              difficulty: 1
            },
            {
              type: 'video',
              title: 'Advanced Calculus',
              description: 'Complex calculus concepts',
              url: 'https://example.com/calculus',
              duration: 900,
              ageAppropriate: false,
              safetyScore: 0.90,
              source: 'University Math',
              tags: ['calculus', 'advanced'],
              difficulty: 5
            }
          ])
        })
      };

      mockModel.generateContent.mockResolvedValue(mockMixedContent);

      const response = await request(app)
        .post('/api/gemini/content-recommendations')
        .set('Authorization', authToken)
        .send({
          subject: 'Mathematics',
          topic: 'Basic Math',
          childAge: testChild.age,
          contentTypes: ['video']
        })
        .expect(200);

      // Should only return age-appropriate content
      expect(response.body.recommendations).toHaveLength(1);
      expect(response.body.recommendations[0].ageAppropriate).toBe(true);
      expect(response.body.recommendations[0].title).toBe('Basic Math');
      expect(response.body.filteredCount).toBe(1); // One item was filtered out
    });
  });

  describe('Content Safety Validation', () => {
    it('should validate content safety with Gemini', async () => {
      const mockSafetyResponse = {
        response: Promise.resolve({
          text: () => JSON.stringify({
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
          })
        })
      };

      mockModel.generateContent.mockResolvedValue(mockSafetyResponse);

      const response = await request(app)
        .post('/api/gemini/validate-content-safety')
        .set('Authorization', authToken)
        .send({
          content: {
            type: 'video',
            title: 'Educational Math Video',
            description: 'Learn about fractions and decimals',
            url: 'https://example.com/math-video',
            duration: 300,
            source: 'Educational Site',
            tags: ['math', 'education']
          },
          childAge: testChild.age
        })
        .expect(200);

      expect(response.body).toEqual({
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
      const mockUnsafeResponse = {
        response: Promise.resolve({
          text: () => JSON.stringify({
            safetyScore: 0.3,
            ageAppropriate: false,
            contentFlags: ['inappropriate_language', 'violence'],
            riskFactors: ['contains_profanity', 'violent_imagery'],
            recommendation: 'blocked',
            parentalApprovalRequired: true,
            details: {
              violence: 0.8,
              adult: 0.1,
              language: 0.7,
              educational: 0.2
            }
          })
        })
      };

      mockModel.generateContent.mockResolvedValue(mockUnsafeResponse);

      const response = await request(app)
        .post('/api/gemini/validate-content-safety')
        .set('Authorization', authToken)
        .send({
          content: {
            type: 'video',
            title: 'Inappropriate Video',
            description: 'Video with inappropriate content',
            url: 'https://example.com/bad-video',
            duration: 300,
            source: 'Unknown Source',
            tags: ['inappropriate']
          },
          childAge: testChild.age
        })
        .expect(200);

      expect(response.body.safetyScore).toBe(0.3);
      expect(response.body.ageAppropriate).toBe(false);
      expect(response.body.contentFlags).toContain('inappropriate_language');
      expect(response.body.contentFlags).toContain('violence');
      expect(response.body.recommendation).toBe('blocked');
      expect(response.body.parentalApprovalRequired).toBe(true);

      // Verify safety log was created
      const safetyLog = await prisma.contentSafetyLog.findFirst({
        where: {
          eventType: 'content_flagged'
        }
      });

      expect(safetyLog).toBeTruthy();
      expect(safetyLog?.safetyScore).toBe(0.3);
    });
  });

  describe('Study Plan Persistence', () => {
    it('should save generated study plan to database', async () => {
      const mockGeminiResponse = {
        response: Promise.resolve({
          text: () => JSON.stringify({
            planId: 'db-plan-123',
            title: 'Persistent Math Plan',
            description: 'Plan to be saved in database',
            estimatedDuration: 60,
            activities: [
              {
                id: 'activity-1',
                title: 'Math Activity',
                description: 'Learn math concepts',
                type: 'video',
                duration: 30,
                difficulty: 'medium',
                learningObjectives: ['understand math'],
                content: {
                  videoUrl: 'https://example.com/math-video'
                }
              }
            ],
            contentRecommendations: [],
            safetyValidation: {
              overallSafetyScore: 0.95,
              contentFlags: [],
              ageAppropriate: true,
              parentalApprovalRequired: false
            }
          })
        })
      };

      mockModel.generateContent.mockResolvedValue(mockGeminiResponse);

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          subject: 'Mathematics',
          duration: 60,
          learningStyle: 'visual',
          currentLevel: 'intermediate',
          saveToDatabase: true
        })
        .expect(200);

      // Verify study plan was saved
      const studyPlan = await prisma.studyPlan.findFirst({
        where: {
          childId: testChild.id,
          subject: 'Mathematics'
        },
        include: {
          activities: true
        }
      });

      expect(studyPlan).toBeTruthy();
      expect(studyPlan?.title).toBe('Persistent Math Plan');
      expect(studyPlan?.activities).toHaveLength(1);
      expect(studyPlan?.activities[0].title).toBe('Math Activity');

      // Response should include database ID
      expect(response.body.databaseId).toBe(studyPlan?.id);
    });

    it('should handle database save errors', async () => {
      const mockGeminiResponse = {
        response: Promise.resolve({
          text: () => JSON.stringify({
            planId: 'error-plan-123',
            title: 'Plan with DB Error',
            description: 'This plan will cause a DB error',
            estimatedDuration: 60,
            activities: [],
            contentRecommendations: [],
            safetyValidation: {
              overallSafetyScore: 0.95,
              contentFlags: [],
              ageAppropriate: true,
              parentalApprovalRequired: false
            }
          })
        })
      };

      mockModel.generateContent.mockResolvedValue(mockGeminiResponse);

      // Mock database error
      jest.spyOn(prisma.studyPlan, 'create').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          subject: 'Mathematics',
          duration: 60,
          learningStyle: 'visual',
          currentLevel: 'intermediate',
          saveToDatabase: true
        })
        .expect(200); // Should still return the plan even if DB save fails

      expect(response.body.planId).toBe('error-plan-123');
      expect(response.body.databaseError).toBe('Failed to save to database');
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle rate limiting for Gemini API calls', async () => {
      // Mock rate limit error
      mockModel.generateContent.mockRejectedValue({
        name: 'RateLimitError',
        message: 'Rate limit exceeded'
      });

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          subject: 'Mathematics',
          duration: 60,
          learningStyle: 'visual',
          currentLevel: 'intermediate'
        })
        .expect(429);

      expect(response.body.error).toContain('Rate limit exceeded');
      expect(response.body.retryAfter).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      // Mock timeout error
      mockModel.generateContent.mockRejectedValue({
        name: 'TimeoutError',
        message: 'Request timeout'
      });

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .set('Authorization', authToken)
        .send({
          childId: testChild.id,
          subject: 'Mathematics',
          duration: 60,
          learningStyle: 'visual',
          currentLevel: 'intermediate'
        })
        .expect(408);

      expect(response.body.error).toContain('Request timeout');
    });
  });
});