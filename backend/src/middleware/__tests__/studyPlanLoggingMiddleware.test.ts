import { Request, Response, NextFunction } from 'express';
import { 
  dashboardLogging, 
  progressUpdateLogging, 
  monitorDatabaseOperation 
} from '../studyPlanLoggingMiddleware';
import { studyPlanLoggingService } from '../../services/studyPlanLoggingService';

// Mock the logging service
jest.mock('../../services/studyPlanLoggingService', () => ({
  studyPlanLoggingService: {
    logStudyPlanAccess: jest.fn(),
    logProgressUpdate: jest.fn(),
    logDashboardAccess: jest.fn(),
    monitorDatabaseOperation: jest.fn()
  }
}));

describe('StudyPlanLoggingMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 'test-child-id', role: 'CHILD' },
      params: { childId: 'test-child-id', activityId: 'test-activity-id' },
      body: {},
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '192.168.1.1',
      originalUrl: '/api/child/test-child-id/dashboard'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {}
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('dashboardLogging', () => {
    it('should create middleware that logs dashboard access on success', async () => {
      const middleware = dashboardLogging('DASHBOARD_ACCESS');
      const [preMiddleware, postMiddleware] = middleware;

      // Execute pre-middleware
      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.locals?.startTime).toBeDefined();

      // Mock successful response
      mockResponse.statusCode = 200;
      mockResponse.locals = {
        startTime: Date.now() - 100,
        dashboardData: {
          studyPlansCount: 3,
          progressRecordsCount: 15
        }
      };

      // Execute post-middleware
      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logDashboardAccess).toHaveBeenCalledWith({
        childId: 'test-child-id',
        action: 'DASHBOARD_ACCESS',
        success: true,
        dataReturned: {
          studyPlansCount: 3,
          progressRecordsCount: 15
        },
        responseTime: expect.any(Number),
        cacheHit: undefined
      });
    });

    it('should log dashboard access failure', async () => {
      const middleware = dashboardLogging('DASHBOARD_ACCESS');
      const [preMiddleware, postMiddleware] = middleware;

      // Execute pre-middleware
      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Mock error response
      mockResponse.statusCode = 500;
      mockResponse.locals = {
        startTime: Date.now() - 200,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Connection timeout'
        }
      };

      // Execute post-middleware
      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logDashboardAccess).toHaveBeenCalledWith({
        childId: 'test-child-id',
        action: 'DASHBOARD_ACCESS',
        success: false,
        responseTime: expect.any(Number),
        errorCode: 'DATABASE_ERROR',
        errorMessage: 'Connection timeout'
      });
    });

    it('should handle missing child ID gracefully', async () => {
      mockRequest.params = {};
      mockRequest.user = { userId: 'test-child-id', role: 'CHILD' };

      const middleware = dashboardLogging('DASHBOARD_ACCESS');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      mockResponse.statusCode = 200;
      mockResponse.locals = { startTime: Date.now() - 50 };

      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logDashboardAccess).toHaveBeenCalledWith({
        childId: 'test-child-id', // Should use user ID as fallback
        action: 'DASHBOARD_ACCESS',
        success: true,
        responseTime: expect.any(Number)
      });
    });

    it('should detect cache hits from response headers', async () => {
      const middleware = dashboardLogging('DASHBOARD_ACCESS');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      mockResponse.statusCode = 200;
      mockResponse.locals = { startTime: Date.now() - 30 };
      mockResponse.getHeader = jest.fn().mockReturnValue('HIT');

      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logDashboardAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          cacheHit: true
        })
      );
    });
  });

  describe('progressUpdateLogging', () => {
    it('should create middleware that logs progress updates on success', async () => {
      mockRequest.body = {
        activityId: 'test-activity-id',
        timeSpent: 300,
        score: 85,
        status: 'COMPLETED'
      };

      const middleware = progressUpdateLogging('PROGRESS_UPDATE');
      const [preMiddleware, postMiddleware] = middleware;

      // Execute pre-middleware
      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.locals?.startTime).toBeDefined();
      expect(mockResponse.locals?.requestData).toEqual(mockRequest.body);

      // Mock successful response
      mockResponse.statusCode = 200;
      mockResponse.locals = {
        ...mockResponse.locals,
        progressResult: {
          previousStatus: 'IN_PROGRESS',
          newStatus: 'COMPLETED',
          scoreChange: 85
        }
      };

      // Execute post-middleware
      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logProgressUpdate).toHaveBeenCalledWith({
        childId: 'test-child-id',
        activityId: 'test-activity-id',
        planId: undefined,
        action: 'PROGRESS_UPDATE',
        success: true,
        previousStatus: 'IN_PROGRESS',
        newStatus: 'COMPLETED',
        scoreChange: 85,
        timeSpent: 300,
        responseTime: expect.any(Number),
        sessionData: mockRequest.body
      });
    });

    it('should log progress update with validation errors', async () => {
      const middleware = progressUpdateLogging('PROGRESS_UPDATE');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      mockResponse.statusCode = 200;
      mockResponse.locals = {
        startTime: Date.now() - 150,
        requestData: mockRequest.body,
        validationResult: {
          warnings: ['Score seems high for time spent'],
          errors: []
        },
        consistencyResult: {
          inconsistencies: ['Time gap detected']
        }
      };

      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logProgressUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          validationErrors: ['Score seems high for time spent'],
          consistencyIssues: ['Time gap detected']
        })
      );
    });

    it('should log failed progress update', async () => {
      const middleware = progressUpdateLogging('PROGRESS_UPDATE');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      mockResponse.statusCode = 400;
      mockResponse.locals = {
        startTime: Date.now() - 100,
        requestData: mockRequest.body,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid activity ID'
        }
      };

      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logProgressUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          validationErrors: undefined,
          consistencyIssues: undefined
        })
      );
    });

    it('should extract plan ID from activity data if available', async () => {
      const middleware = progressUpdateLogging('ACTIVITY_COMPLETION');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      mockResponse.statusCode = 200;
      mockResponse.locals = {
        startTime: Date.now() - 200,
        requestData: mockRequest.body,
        activityData: {
          planId: 'test-plan-id'
        }
      };

      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logProgressUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'test-plan-id',
          action: 'ACTIVITY_COMPLETION'
        })
      );
    });
  });

  describe('monitorDatabaseOperation', () => {
    it('should monitor database operation and return result', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ id: 'test-result' });
      const mockResult = { id: 'test-result' };

      (studyPlanLoggingService.monitorDatabaseOperation as jest.Mock).mockResolvedValue(mockResult);

      const result = await monitorDatabaseOperation(
        'get_child_progress',
        'progress_records',
        'SELECT',
        mockOperation,
        { childId: 'test-child-id' }
      );

      expect(result).toEqual(mockResult);
      expect(studyPlanLoggingService.monitorDatabaseOperation).toHaveBeenCalledWith(
        'get_child_progress',
        'progress_records',
        'SELECT',
        mockOperation,
        { childId: 'test-child-id' }
      );
    });

    it('should propagate database operation errors', async () => {
      const mockError = new Error('Database connection failed');
      const mockOperation = jest.fn().mockRejectedValue(mockError);

      (studyPlanLoggingService.monitorDatabaseOperation as jest.Mock).mockRejectedValue(mockError);

      await expect(
        monitorDatabaseOperation(
          'failing_operation',
          'test_table',
          'SELECT',
          mockOperation
        )
      ).rejects.toThrow('Database connection failed');

      expect(studyPlanLoggingService.monitorDatabaseOperation).toHaveBeenCalledWith(
        'failing_operation',
        'test_table',
        'SELECT',
        mockOperation,
        undefined
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle logging service errors gracefully in dashboard middleware', async () => {
      (studyPlanLoggingService.logDashboardAccess as jest.Mock).mockRejectedValue(
        new Error('Logging service unavailable')
      );

      const middleware = dashboardLogging('DASHBOARD_ACCESS');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      mockResponse.statusCode = 200;
      mockResponse.locals = { startTime: Date.now() - 100 };

      // Should not throw error
      await expect(
        postMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
      ).resolves.toBeUndefined();

      expect(studyPlanLoggingService.logDashboardAccess).toHaveBeenCalled();
    });

    it('should handle logging service errors gracefully in progress middleware', async () => {
      (studyPlanLoggingService.logProgressUpdate as jest.Mock).mockRejectedValue(
        new Error('Logging service unavailable')
      );

      const middleware = progressUpdateLogging('PROGRESS_UPDATE');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      mockResponse.statusCode = 200;
      mockResponse.locals = { startTime: Date.now() - 100, requestData: {} };

      // Should not throw error
      await expect(
        postMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
      ).resolves.toBeUndefined();

      expect(studyPlanLoggingService.logProgressUpdate).toHaveBeenCalled();
    });
  });

  describe('Performance Tracking', () => {
    it('should accurately calculate response times', async () => {
      const middleware = dashboardLogging('DASHBOARD_ACCESS');
      const [preMiddleware, postMiddleware] = middleware;

      const startTime = Date.now();
      mockResponse.locals = { startTime };

      // Simulate 150ms delay
      await new Promise(resolve => setTimeout(resolve, 150));

      mockResponse.statusCode = 200;
      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      const logCall = (studyPlanLoggingService.logDashboardAccess as jest.Mock).mock.calls[0][0];
      expect(logCall.responseTime).toBeGreaterThanOrEqual(140);
      expect(logCall.responseTime).toBeLessThan(200);
    });

    it('should handle missing start time gracefully', async () => {
      const middleware = dashboardLogging('DASHBOARD_ACCESS');
      const [preMiddleware, postMiddleware] = middleware;

      // Don't set start time
      mockResponse.locals = {};
      mockResponse.statusCode = 200;

      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      const logCall = (studyPlanLoggingService.logDashboardAccess as jest.Mock).mock.calls[0][0];
      expect(logCall.responseTime).toBeUndefined();
    });
  });

  describe('Data Extraction', () => {
    it('should extract comprehensive dashboard data from response', async () => {
      const middleware = dashboardLogging('DASHBOARD_ACCESS');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      mockResponse.statusCode = 200;
      mockResponse.locals = {
        startTime: Date.now() - 100,
        dashboardData: {
          studyPlansCount: 5,
          progressRecordsCount: 25,
          streaksCount: 3,
          badgesCount: 8,
          additionalData: 'ignored'
        }
      };

      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logDashboardAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          dataReturned: {
            studyPlansCount: 5,
            progressRecordsCount: 25,
            streaksCount: 3,
            badgesCount: 8
          }
        })
      );
    });

    it('should extract session data from progress update requests', async () => {
      mockRequest.body = {
        activityId: 'test-activity-id',
        sessionData: {
          interactions: ['click', 'scroll'],
          helpRequests: 2,
          timeSpent: 300
        }
      };

      const middleware = progressUpdateLogging('PROGRESS_UPDATE');
      const [preMiddleware, postMiddleware] = middleware;

      preMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      mockResponse.statusCode = 200;
      mockResponse.locals = {
        startTime: Date.now() - 100,
        requestData: mockRequest.body
      };

      await postMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(studyPlanLoggingService.logProgressUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionData: mockRequest.body,
          timeSpent: 300
        })
      );
    });
  });
});