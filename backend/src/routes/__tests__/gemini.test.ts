import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import geminiRoutes from '../gemini';
import { geminiService } from '../../services/geminiService';
import { contentSafetyService } from '../../services/contentSafetyService';
import { authenticateToken } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../services/geminiService');
jest.mock('../../services/contentSafetyService');
jest.mock('@prisma/client');
jest.mock('../../middleware/auth');

const mockPrisma = {
  childProfile: {
    findFirst: jest.fn(),
  },
  progressRecord: {
    findMany: jest.fn(),
  },
  studyPlan: {
    create: jest.fn(),
  },
  studyActivity: {
    create: jest.fn(),
  },
  studyContent: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  parentalApprovalRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  contentInteraction: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  aiUsage: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
} as any;

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

const mockGeminiService = geminiService as jest.Mocked<typeof geminiService>;
const mockContentSafetyService = contentSafetyService as jest.Mocked<typeof contentSafetyService>;
const mockAuthenticateToken = authenticateToken as jest.Mock;

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/gemini', geminiRoutes);

describe('Gemini Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication middleware
    mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
      req.user = { userId: 'parent-user-id', role: 'PARENT' };
      next();
    });
  });

  describe('POST /api/gemini/generate-study-plan', () => {
    const validRequest = {
      childId: 'child-id-123',
      subject: 'Mathematics',
      gradeLevel: '5th Grade',
      duration: 60,
      objectives: ['Learn fractions', 'Practice multiplication'],
      learningStyle: {
        visual: 0.7,
        auditory: 0.2,
        kinesthetic: 0.1,
        readingWriting: 0.0
      }
    };

    const mockChild = {
      id: 'child-id-123',
      name: 'Test Child',
      age: 10,
      parentId: 'parent-user-id',
      settings: {
        contentFilterLevel: 'moderate'
      }
    };

    const mockGeminiResponse = {
      planId: 'plan-123',
      title: 'Mathematics Study Plan',
      description: 'A comprehensive math study plan',
      activities: [
        {
          id: 'activity-1',
          title: 'Fraction Basics',
          description: 'Learn basic fractions',
          type: 'video' as const,
          duration: 15,
          difficulty: 3,
          objectives: ['Understand fractions'],
          instructions: 'Watch the video and take notes',
          materials: ['notebook', 'pencil'],
          assessmentCriteria: ['Can identify fractions']
        }
      ],
      estimatedDuration: 60,
      difficultyProgression: [2, 3, 4],
      contentRecommendations: [
        {
          type: 'video' as const,
          title: 'Fraction Fun',
          description: 'Educational video about fractions',
          duration: 10,
          ageAppropriate: true,
          safetyScore: 0.95,
          source: 'Khan Academy',
          tags: ['math', 'fractions'],
          difficulty: 3
        }
      ],
      learningObjectives: ['Learn fractions'],
      prerequisites: []
    };

    const mockSafetyResult = {
      isAppropriate: true,
      ageAppropriate: true,
      educationalValue: 5,
      concerns: []
    };

    beforeEach(() => {
      mockPrisma.childProfile.findFirst.mockResolvedValue(mockChild);
      mockPrisma.progressRecord.findMany.mockResolvedValue([]);
      mockPrisma.studyPlan.create.mockResolvedValue({
        id: 'study-plan-123',
        ...validRequest,
        status: 'DRAFT'
      });
      mockPrisma.studyActivity.create.mockResolvedValue({
        id: 'activity-123',
        planId: 'study-plan-123',
        title: 'Fraction Basics',
        orderIndex: 0
      });
      mockPrisma.studyContent.create.mockResolvedValue({
        id: 'content-123',
        activityId: 'activity-123',
        contentType: 'video'
      });
      mockPrisma.aiUsage.create.mockResolvedValue({});
      
      mockGeminiService.generateStudyPlan.mockResolvedValue(mockGeminiResponse);
      mockContentSafetyService.checkContentSafety.mockResolvedValue(mockSafetyResult);
    });

    it('should generate study plan successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .send(validRequest)
        .expect(200);

      expect(response.body).toHaveProperty('studyPlan');
      expect(response.body).toHaveProperty('contentRecommendations');
      expect(response.body.studyPlan.title).toBe('Mathematics Study Plan');
      expect(mockGeminiService.generateStudyPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          childAge: 10,
          subject: 'Mathematics',
          gradeLevel: '5th Grade'
        })
      );
    });

    it('should return 404 if child not found', async () => {
      mockPrisma.childProfile.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .send(validRequest)
        .expect(404);

      expect(response.body.error).toBe('Child profile not found or access denied');
    });

    it('should validate request body', async () => {
      const invalidRequest = {
        ...validRequest,
        duration: -5, // Invalid duration
        objectives: [] // Empty objectives
      };

      await request(app)
        .post('/api/gemini/generate-study-plan')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle Gemini service errors', async () => {
      mockGeminiService.generateStudyPlan.mockRejectedValue(new Error('Gemini API error'));

      const response = await request(app)
        .post('/api/gemini/generate-study-plan')
        .send(validRequest)
        .expect(500);

      expect(response.body.error).toBe('Failed to generate study plan');
    });

    it('should create parental approval request for unsafe content', async () => {
      const unsafeSafetyResult = {
        ...mockSafetyResult,
        isAppropriate: false,
        ageAppropriate: false
      };
      
      mockContentSafetyService.checkContentSafety.mockResolvedValue(unsafeSafetyResult);

      await request(app)
        .post('/api/gemini/generate-study-plan')
        .send(validRequest)
        .expect(200);

      expect(mockPrisma.parentalApprovalRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            childId: 'child-id-123',
            contentType: 'CONTENT_RECOMMENDATION',
            status: 'PENDING'
          })
        })
      );
    });
  });

  describe('POST /api/gemini/content-recommendations', () => {
    const validRequest = {
      childId: 'child-id-123',
      subject: 'Science',
      topic: 'Solar System',
      contentTypes: ['video', 'article'] as const
    };

    const mockChild = {
      id: 'child-id-123',
      age: 10,
      parentId: 'parent-user-id'
    };

    const mockRecommendations = [
      {
        type: 'video' as const,
        title: 'Solar System Tour',
        description: 'Virtual tour of the solar system',
        duration: 15,
        ageAppropriate: true,
        safetyScore: 0.9,
        source: 'NASA Kids',
        tags: ['space', 'planets'],
        difficulty: 4
      }
    ];

    beforeEach(() => {
      mockPrisma.childProfile.findFirst.mockResolvedValue(mockChild);
      mockPrisma.aiUsage.create.mockResolvedValue({});
      mockGeminiService.generateContentRecommendations.mockResolvedValue(mockRecommendations);
      mockContentSafetyService.checkContentSafety.mockResolvedValue({
        isAppropriate: true,
        ageAppropriate: true,
        educationalValue: 5,
        concerns: []
      });
    });

    it('should generate content recommendations successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/content-recommendations')
        .send(validRequest)
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
      expect(response.body.recommendations).toHaveLength(1);
      expect(response.body.recommendations[0].title).toBe('Solar System Tour');
      expect(mockGeminiService.generateContentRecommendations).toHaveBeenCalledWith(
        'Science',
        'Solar System',
        10,
        ['video', 'article']
      );
    });

    it('should return 404 if child not found', async () => {
      mockPrisma.childProfile.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/gemini/content-recommendations')
        .send(validRequest)
        .expect(404);

      expect(response.body.error).toBe('Child profile not found or access denied');
    });
  });

  describe('GET /api/gemini/parental-approval-requests', () => {
    const mockApprovalRequests = [
      {
        id: 'approval-123',
        child: {
          id: 'child-id-123',
          name: 'Test Child',
          age: 10
        },
        contentType: 'CONTENT_RECOMMENDATION',
        contentData: JSON.stringify({
          title: 'Test Content',
          description: 'Test description'
        }),
        safetyResults: JSON.stringify({
          isAppropriate: false,
          parentalApprovalRequired: true
        }),
        requestedAt: new Date(),
        status: 'PENDING',
        parentNotes: null
      }
    ];

    beforeEach(() => {
      mockPrisma.parentalApprovalRequest.findMany.mockResolvedValue(mockApprovalRequests);
    });

    it('should fetch parental approval requests successfully', async () => {
      const response = await request(app)
        .get('/api/gemini/parental-approval-requests')
        .expect(200);

      expect(response.body).toHaveProperty('approvalRequests');
      expect(response.body.approvalRequests).toHaveLength(1);
      expect(response.body.approvalRequests[0].id).toBe('approval-123');
    });

    it('should filter by status', async () => {
      await request(app)
        .get('/api/gemini/parental-approval-requests?status=APPROVED')
        .expect(200);

      expect(mockPrisma.parentalApprovalRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED'
          })
        })
      );
    });
  });

  describe('POST /api/gemini/approve-content', () => {
    const validRequest = {
      approvalRequestId: 'approval-123',
      approved: true,
      parentNotes: 'Looks good for my child'
    };

    const mockApprovalRequest = {
      id: 'approval-123',
      childId: 'child-id-123',
      contentType: 'CONTENT_RECOMMENDATION',
      contentData: JSON.stringify({
        title: 'Test Content',
        description: 'Test description'
      }),
      child: {
        id: 'child-id-123',
        parentId: 'parent-user-id'
      }
    };

    beforeEach(() => {
      mockPrisma.parentalApprovalRequest.findFirst.mockResolvedValue(mockApprovalRequest);
      mockPrisma.parentalApprovalRequest.update.mockResolvedValue({
        ...mockApprovalRequest,
        status: 'APPROVED',
        processedAt: new Date(),
        parentNotes: 'Looks good for my child'
      });
      mockPrisma.studyContent.updateMany.mockResolvedValue({});
    });

    it('should approve content successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/approve-content')
        .send(validRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.approvalRequest.status).toBe('APPROVED');
      expect(mockPrisma.parentalApprovalRequest.update).toHaveBeenCalledWith({
        where: { id: 'approval-123' },
        data: expect.objectContaining({
          status: 'APPROVED',
          parentNotes: 'Looks good for my child'
        })
      });
    });

    it('should reject content successfully', async () => {
      const rejectRequest = {
        ...validRequest,
        approved: false,
        parentNotes: 'Not appropriate'
      };

      mockPrisma.parentalApprovalRequest.update.mockResolvedValue({
        ...mockApprovalRequest,
        status: 'REJECTED',
        processedAt: new Date(),
        parentNotes: 'Not appropriate'
      });

      const response = await request(app)
        .post('/api/gemini/approve-content')
        .send(rejectRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.approvalRequest.status).toBe('REJECTED');
    });

    it('should return 404 if approval request not found', async () => {
      mockPrisma.parentalApprovalRequest.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/gemini/approve-content')
        .send(validRequest)
        .expect(404);

      expect(response.body.error).toBe('Approval request not found or already processed');
    });
  });

  describe('POST /api/gemini/track-interaction', () => {
    const validRequest = {
      contentId: 'content-123',
      interactionType: 'view' as const,
      progressPercentage: 50,
      timeSpent: 300
    };

    const mockContent = {
      id: 'content-123',
      title: 'Test Content'
    };

    const mockInteraction = {
      id: 'interaction-123',
      childId: 'child-id-123',
      contentId: 'content-123',
      interactionType: 'view',
      progressPercentage: 50,
      timeSpent: 300,
      createdAt: new Date()
    };

    beforeEach(() => {
      // Mock child authentication
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { userId: 'child-id-123', role: 'CHILD' };
        next();
      });

      mockPrisma.studyContent.findUnique.mockResolvedValue(mockContent);
      mockPrisma.contentInteraction.upsert.mockResolvedValue(mockInteraction);
    });

    it('should track content interaction successfully', async () => {
      const response = await request(app)
        .post('/api/gemini/track-interaction')
        .send(validRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.interaction.interactionType).toBe('view');
      expect(response.body.interaction.progressPercentage).toBe(50);
      expect(mockPrisma.contentInteraction.upsert).toHaveBeenCalledWith({
        where: {
          childId_contentId_interactionType: {
            childId: 'child-id-123',
            contentId: 'content-123',
            interactionType: 'view'
          }
        },
        update: {
          progressPercentage: 50,
          timeSpent: 300
        },
        create: {
          childId: 'child-id-123',
          contentId: 'content-123',
          interactionType: 'view',
          progressPercentage: 50,
          timeSpent: 300
        }
      });
    });

    it('should return 404 if content not found', async () => {
      mockPrisma.studyContent.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/gemini/track-interaction')
        .send(validRequest)
        .expect(404);

      expect(response.body.error).toBe('Content not found');
    });
  });

  describe('GET /api/gemini/analytics/:childId', () => {
    const mockChild = {
      id: 'child-id-123',
      parentId: 'parent-user-id'
    };

    const mockInteractions = [
      {
        id: 'interaction-1',
        childId: 'child-id-123',
        interactionType: 'view',
        progressPercentage: 100,
        timeSpent: 600,
        createdAt: new Date(),
        content: {
          contentType: 'video',
          activity: {
            plan: {
              subject: 'Mathematics'
            }
          }
        }
      },
      {
        id: 'interaction-2',
        childId: 'child-id-123',
        interactionType: 'complete',
        progressPercentage: 100,
        timeSpent: 300,
        createdAt: new Date(),
        content: {
          contentType: 'article',
          activity: {
            plan: {
              subject: 'Science'
            }
          }
        }
      }
    ];

    const mockAiUsage = [
      {
        requestType: 'gemini_study_plan_generation',
        success: true,
        estimatedCost: 0.01
      },
      {
        requestType: 'gemini_content_recommendations',
        success: true,
        estimatedCost: 0.005
      }
    ];

    beforeEach(() => {
      // Reset to parent authentication
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { userId: 'parent-user-id', role: 'PARENT' };
        next();
      });

      mockPrisma.childProfile.findFirst.mockResolvedValue(mockChild);
      mockPrisma.contentInteraction.findMany.mockResolvedValue(mockInteractions);
      mockPrisma.aiUsage.findMany.mockResolvedValue(mockAiUsage);
    });

    it('should fetch analytics successfully', async () => {
      const response = await request(app)
        .get('/api/gemini/analytics/child-id-123')
        .expect(200);

      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics.totalInteractions).toBe(2);
      expect(response.body.analytics.totalTimeSpent).toBe(900);
      expect(response.body.analytics.completedContent).toBe(1);
      expect(response.body.analytics.contentTypeBreakdown).toEqual({
        video: 1,
        article: 1
      });
      expect(response.body.analytics.subjectBreakdown).toEqual({
        Mathematics: 1,
        Science: 1
      });
    });

    it('should return 404 if child not found', async () => {
      mockPrisma.childProfile.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/gemini/analytics/child-id-123')
        .expect(404);

      expect(response.body.error).toBe('Child profile not found or access denied');
    });

    it('should filter by timeframe', async () => {
      await request(app)
        .get('/api/gemini/analytics/child-id-123?timeframe=7d')
        .expect(200);

      expect(mockPrisma.contentInteraction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date)
            })
          })
        })
      );
    });
  });

  describe('GET /api/gemini/health', () => {
    it('should return healthy status', async () => {
      mockGeminiService.getHealthStatus.mockResolvedValue({
        status: 'healthy',
        model: 'gemini-pro',
        cacheEnabled: true
      });

      const response = await request(app)
        .get('/api/gemini/health')
        .expect(200);

      expect(response.body.service).toBe('gemini');
      expect(response.body.status).toBe('healthy');
      expect(response.body.model).toBe('gemini-pro');
    });

    it('should return unhealthy status on service error', async () => {
      mockGeminiService.getHealthStatus.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/gemini/health')
        .expect(500);

      expect(response.body.service).toBe('gemini');
      expect(response.body.status).toBe('unhealthy');
    });
  });
});