import { ProgressValidationService, progressValidationSchemas } from '../progressValidation';
import { PrismaClient, ProgressStatus } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    childProfile: {
      findUnique: jest.fn()
    },
    studyActivity: {
      findUnique: jest.fn()
    },
    progressRecord: {
      findUnique: jest.fn()
    }
  })),
  ProgressStatus: {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    PAUSED: 'PAUSED'
  }
}));

describe('ProgressValidationService', () => {
  let prismaMock: any;
  let validationService: ProgressValidationService;

  beforeEach(() => {
    prismaMock = {
      childProfile: {
        findUnique: jest.fn()
      },
      studyActivity: {
        findUnique: jest.fn()
      },
      progressRecord: {
        findUnique: jest.fn()
      }
    };
    validationService = new ProgressValidationService(prismaMock as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should validate valid progress update payload', () => {
      const validPayload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        score: 85,
        status: 'IN_PROGRESS' as ProgressStatus,
        sessionData: {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T10:05:00Z'),
          pausedDuration: 0,
          focusEvents: [],
          difficultyAdjustments: [],
          helpRequests: [],
          interactionEvents: []
        }
      };

      const { error, value } = progressValidationSchemas.progressUpdate.validate(validPayload);
      
      expect(error).toBeUndefined();
      expect(value).toMatchObject(validPayload);
    });

    it('should reject invalid activity ID', () => {
      const invalidPayload = {
        activityId: 'invalid-uuid',
        timeSpent: 300
      };

      const { error } = progressValidationSchemas.progressUpdate.validate(invalidPayload);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid UUID');
    });

    it('should reject negative time spent', () => {
      const invalidPayload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: -100
      };

      const { error } = progressValidationSchemas.progressUpdate.validate(invalidPayload);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 1 second');
    });

    it('should reject excessive time spent', () => {
      const invalidPayload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 20000 // More than 4 hours
      };

      const { error } = progressValidationSchemas.progressUpdate.validate(invalidPayload);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot exceed 4 hours');
    });

    it('should reject invalid score range', () => {
      const invalidPayload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        score: 150 // Over 100
      };

      const { error } = progressValidationSchemas.progressUpdate.validate(invalidPayload);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot exceed 100');
    });

    it('should validate session data with proper timestamps', () => {
      const validPayload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        sessionData: {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T10:05:00Z'),
          pausedDuration: 30,
          focusEvents: [
            { type: 'focus', timestamp: new Date('2023-01-01T10:00:30Z') },
            { type: 'blur', timestamp: new Date('2023-01-01T10:02:00Z') }
          ],
          helpRequests: [
            {
              question: 'How do I solve this?',
              timestamp: new Date('2023-01-01T10:01:00Z'),
              resolved: true,
              responseTime: 30
            }
          ],
          interactionEvents: [
            {
              type: 'click',
              element: 'submit-button',
              timestamp: new Date('2023-01-01T10:04:00Z')
            }
          ]
        }
      };

      const { error } = progressValidationSchemas.progressUpdate.validate(validPayload);
      
      expect(error).toBeUndefined();
    });

    it('should reject future timestamps', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const invalidPayload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        sessionData: {
          startTime: futureDate
        }
      };

      const { error } = progressValidationSchemas.progressUpdate.validate(invalidPayload);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot be in the future');
    });

    it('should reject end time before start time', () => {
      const invalidPayload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        sessionData: {
          startTime: new Date('2023-01-01T10:05:00Z'),
          endTime: new Date('2023-01-01T10:00:00Z') // Before start time
        }
      };

      const { error } = progressValidationSchemas.progressUpdate.validate(invalidPayload);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be after start time');
    });
  });

  describe('Database Consistency Checks', () => {
    it('should pass when child exists and is active', async () => {
      const childId = 'child-123';
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        score: 85
      };

      // Mock child profile
      prismaMock.childProfile.findUnique.mockResolvedValue({
        id: childId,
        isActive: true,
        name: 'Test Child',
        age: 10,
        gradeLevel: '5th',
        learningStyle: 'VISUAL',
        username: 'testchild',
        pin: '1234',
        preferences: {},
        parentId: 'parent-123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock activity
      prismaMock.studyActivity.findUnique.mockResolvedValue({
        id: payload.activityId,
        planId: 'plan-123',
        title: 'Test Activity',
        description: 'Test Description',
        content: '{}',
        estimatedDuration: 5,
        difficulty: 3,
        prerequisites: '[]',
        completionCriteria: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: {
          childId: childId,
          status: 'ACTIVE'
        }
      });

      // Mock no existing progress
      prismaMock.progressRecord.findUnique.mockResolvedValue(null);

      const result = await validationService.validateProgressUpdate(childId, payload);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const childExistsCheck = result.consistencyChecks.find(c => c.check === 'child_exists');
      expect(childExistsCheck?.passed).toBe(true);
      
      const childActiveCheck = result.consistencyChecks.find(c => c.check === 'child_active');
      expect(childActiveCheck?.passed).toBe(true);
    });

    it('should fail when child does not exist', async () => {
      const childId = 'nonexistent-child';
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300
      };

      prismaMock.childProfile.findUnique.mockResolvedValue(null);

      const result = await validationService.validateProgressUpdate(childId, payload);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CONSISTENCY_CHECK_FAILED')).toBe(true);
      
      const childExistsCheck = result.consistencyChecks.find(c => c.check === 'child_exists');
      expect(childExistsCheck?.passed).toBe(false);
    });

    it('should fail when activity does not belong to child', async () => {
      const childId = 'child-123';
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300
      };

      // Mock child profile
      prismaMock.childProfile.findUnique.mockResolvedValue({
        id: childId,
        isActive: true,
        name: 'Test Child',
        age: 10,
        gradeLevel: '5th',
        learningStyle: 'VISUAL',
        username: 'testchild',
        pin: '1234',
        preferences: {},
        parentId: 'parent-123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock activity belonging to different child
      prismaMock.studyActivity.findUnique.mockResolvedValue({
        id: payload.activityId,
        planId: 'plan-123',
        title: 'Test Activity',
        description: 'Test Description',
        content: '{}',
        estimatedDuration: 5,
        difficulty: 3,
        prerequisites: '[]',
        completionCriteria: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: {
          childId: 'different-child-123', // Different child
          status: 'ACTIVE'
        }
      });

      const result = await validationService.validateProgressUpdate(childId, payload);

      expect(result.isValid).toBe(false);
      
      const belongsToChildCheck = result.consistencyChecks.find(c => c.check === 'activity_belongs_to_child');
      expect(belongsToChildCheck?.passed).toBe(false);
    });

    it('should detect significant score regression', async () => {
      const childId = 'child-123';
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        score: 60 // Significant decrease from 85
      };

      // Mock child and activity
      prismaMock.childProfile.findUnique.mockResolvedValue({
        id: childId,
        isActive: true,
        name: 'Test Child',
        age: 10,
        gradeLevel: '5th',
        learningStyle: 'VISUAL',
        username: 'testchild',
        pin: '1234',
        preferences: {},
        parentId: 'parent-123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      prismaMock.studyActivity.findUnique.mockResolvedValue({
        id: payload.activityId,
        planId: 'plan-123',
        title: 'Test Activity',
        description: 'Test Description',
        content: '{}',
        estimatedDuration: 5,
        difficulty: 3,
        prerequisites: '[]',
        completionCriteria: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: {
          childId: childId,
          status: 'ACTIVE'
        }
      });

      // Mock existing progress with higher score
      prismaMock.progressRecord.findUnique.mockResolvedValue({
        id: 'progress-123',
        childId: childId,
        activityId: payload.activityId,
        status: ProgressStatus.IN_PROGRESS,
        score: 85, // Previous higher score
        timeSpent: 200,
        attempts: 1,
        sessionData: {},
        helpRequestsCount: 0,
        pauseCount: 0,
        resumeCount: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await validationService.validateProgressUpdate(childId, payload);

      expect(result.isValid).toBe(false);
      
      const scoreRegressionCheck = result.consistencyChecks.find(c => c.check === 'score_regression');
      expect(scoreRegressionCheck?.passed).toBe(false);
      expect(scoreRegressionCheck?.message).toContain('Significant score decrease');
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate reasonable time spent vs estimated duration', async () => {
      const childId = 'child-123';
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300, // 5 minutes
        score: 85
      };

      // Mock activity with 5 minute estimated duration
      prismaMock.studyActivity.findUnique.mockResolvedValue({
        id: payload.activityId,
        planId: 'plan-123',
        title: 'Test Activity',
        description: 'Test Description',
        content: '{}',
        estimatedDuration: 5, // 5 minutes
        difficulty: 3,
        prerequisites: '[]',
        completionCriteria: '{}',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await validationService.validateProgressUpdate(childId, payload);

      const reasonableTimeCheck = result.consistencyChecks.find(c => c.check === 'reasonable_time_spent');
      expect(reasonableTimeCheck?.passed).toBe(true);
    });

    it('should flag unreasonably short time spent', async () => {
      const childId = 'child-123';
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 10, // 10 seconds for 30 minute activity
        score: 85
      };

      // Mock activity with 30 minute estimated duration
      prismaMock.studyActivity.findUnique.mockResolvedValue({
        id: payload.activityId,
        planId: 'plan-123',
        title: 'Test Activity',
        description: 'Test Description',
        content: '{}',
        estimatedDuration: 30, // 30 minutes
        difficulty: 3,
        prerequisites: '[]',
        completionCriteria: '{}',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await validationService.validateProgressUpdate(childId, payload);

      const reasonableTimeCheck = result.consistencyChecks.find(c => c.check === 'reasonable_time_spent');
      expect(reasonableTimeCheck?.passed).toBe(false);
      expect(reasonableTimeCheck?.message).toContain('too short');
    });

    it('should validate help request consistency', async () => {
      const childId = 'child-123';
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        helpRequestsCount: 3,
        sessionData: {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T10:05:00Z'),
          pausedDuration: 0,
          focusEvents: [],
          difficultyAdjustments: [],
          helpRequests: [
            { question: 'Help 1', timestamp: new Date(), resolved: true },
            { question: 'Help 2', timestamp: new Date(), resolved: true },
            { question: 'Help 3', timestamp: new Date(), resolved: false }
          ],
          interactionEvents: []
        }
      };

      const result = await validationService.validateProgressUpdate(childId, payload);

      const helpConsistencyCheck = result.consistencyChecks.find(c => c.check === 'help_request_consistency');
      expect(helpConsistencyCheck?.passed).toBe(true);
    });

    it('should flag help request count mismatch', async () => {
      const childId = 'child-123';
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        helpRequestsCount: 5, // Mismatch with session data
        sessionData: {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T10:05:00Z'),
          pausedDuration: 0,
          focusEvents: [],
          difficultyAdjustments: [],
          helpRequests: [
            { question: 'Help 1', timestamp: new Date(), resolved: true },
            { question: 'Help 2', timestamp: new Date(), resolved: true }
          ], // Only 2 help requests in session data
          interactionEvents: []
        }
      };

      const result = await validationService.validateProgressUpdate(childId, payload);

      const helpConsistencyCheck = result.consistencyChecks.find(c => c.check === 'help_request_consistency');
      expect(helpConsistencyCheck?.passed).toBe(false);
      expect(helpConsistencyCheck?.message).toContain('mismatch');
    });
  });

  describe('Time-based Validation', () => {
    it('should validate positive session duration', () => {
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        sessionData: {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T10:05:00Z'), // 5 minutes later
          pausedDuration: 0,
          focusEvents: [],
          difficultyAdjustments: [],
          helpRequests: [],
          interactionEvents: []
        }
      };

      const result = validationService['performTimeValidation'](payload);

      const sessionDurationCheck = result.find(c => c.check === 'positive_session_duration');
      expect(sessionDurationCheck?.passed).toBe(true);
    });

    it('should flag negative session duration', () => {
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        sessionData: {
          startTime: new Date('2023-01-01T10:05:00Z'),
          endTime: new Date('2023-01-01T10:00:00Z'), // Before start time
          pausedDuration: 0,
          focusEvents: [],
          difficultyAdjustments: [],
          helpRequests: [],
          interactionEvents: []
        }
      };

      const result = validationService['performTimeValidation'](payload);

      const sessionDurationCheck = result.find(c => c.check === 'positive_session_duration');
      expect(sessionDurationCheck?.passed).toBe(false);
    });

    it('should validate time spent consistency with session duration', () => {
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 270, // 4.5 minutes (within tolerance of 5 minutes active time)
        sessionData: {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T10:05:00Z'), // 5 minutes total
          pausedDuration: 0, // No pauses, so 5 minutes active
          focusEvents: [],
          difficultyAdjustments: [],
          helpRequests: [],
          interactionEvents: []
        }
      };

      const result = validationService['performTimeValidation'](payload);

      const consistencyCheck = result.find(c => c.check === 'time_spent_session_consistency');
      expect(consistencyCheck?.passed).toBe(true);
    });
  });

  describe('Score Validation', () => {
    it('should validate reasonable score with help requests', () => {
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        score: 75, // Reasonable with 2 help requests (expected max ~96)
        helpRequestsCount: 2
      };

      const result = validationService['performScoreValidation'](payload);

      const scoreHelpCheck = result.find(c => c.check === 'score_help_consistency');
      expect(scoreHelpCheck?.passed).toBe(true);
    });

    it('should flag suspiciously high score with many help requests', () => {
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 300,
        score: 98, // Too high for 10 help requests
        helpRequestsCount: 10
      };

      const result = validationService['performScoreValidation'](payload);

      const scoreHelpCheck = result.find(c => c.check === 'score_help_consistency');
      expect(scoreHelpCheck?.passed).toBe(false);
      expect(scoreHelpCheck?.message).toContain('seems high');
    });

    it('should flag quick perfect scores as suspicious', () => {
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 15, // Very quick
        score: 100 // Perfect score
      };

      const result = validationService['performScoreValidation'](payload);

      const quickPerfectCheck = result.find(c => c.check === 'quick_perfect_score');
      expect(quickPerfectCheck?.passed).toBe(false);
      expect(quickPerfectCheck?.message).toContain('may indicate cheating');
    });

    it('should allow reasonable quick scores', () => {
      const payload = {
        activityId: '123e4567-e89b-12d3-a456-426614174000',
        timeSpent: 120, // 2 minutes
        score: 85 // Good but not perfect
      };

      const result = validationService['performScoreValidation'](payload);

      const quickPerfectCheck = result.find(c => c.check === 'quick_perfect_score');
      expect(quickPerfectCheck?.passed).toBe(true);
    });
  });
});