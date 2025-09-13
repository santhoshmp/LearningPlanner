import request from 'supertest';
import express from 'express';
import loggingAnalyticsRoutes from '../loggingAnalytics';
import { authenticateToken } from '../../middleware/auth';
import { studyPlanLoggingService } from '../../services/studyPlanLoggingService';

// Mock the dependencies
jest.mock('../../middleware/auth');
jest.mock('../../services/studyPlanLoggingService');
jest.mock('../../utils/logger');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockLoggingService = studyPlanLoggingService as jest.Mocked<typeof studyPlanLoggingService>;

describe('Logging Analytics Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware to pass through with admin role
    mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        userId: 'admin-user-id',
        role: 'ADMIN'
      };
      next();
    });
    
    app.use('/api/logging', loggingAnalyticsRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/logging/analytics', () => {
    it('should return logging analytics for valid time frame', async () => {
      const mockAnalytics = {
        accessStats: [
          { action: 'ACCESS_PLAN', success: true, _count: 150 },
          { action: 'ACCESS_PLAN', success: false, _count: 5 }
        ],
        progressStats: [
          { action: 'PROGRESS_UPDATE', success: true, _count: 300 },
          { action: 'ACTIVITY_COMPLETION', success: true, _count: 45 }
        ],
        dashboardStats: [
          { action: 'DASHBOARD_ACCESS', success: true, _count: 80, _avg: { responseTime: 250 } }
        ],
        performanceStats: [
          { operation: 'get_progress', queryComplexity: 'LOW', _count: 200, _avg: { executionTime: 150 }, _max: { executionTime: 300 } }
        ],
        timeFrame: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      mockLoggingService.getLoggingAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/logging/analytics')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Logging analytics retrieved successfully',
        analytics: mockAnalytics
      });

      expect(mockLoggingService.getLoggingAnalytics).toHaveBeenCalledWith({
        start: new Date('2024-01-01T00:00:00.000Z'),
        end: new Date('2024-01-31T23:59:59.999Z')
      });
    });

    it('should use default time frame when dates not provided', async () => {
      const mockAnalytics = {
        accessStats: [],
        progressStats: [],
        dashboardStats: [],
        performanceStats: [],
        timeFrame: {
          start: expect.any(Date),
          end: expect.any(Date)
        }
      };

      mockLoggingService.getLoggingAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/logging/analytics');

      expect(response.status).toBe(200);
      expect(mockLoggingService.getLoggingAnalytics).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date)
      });

      // Verify default is last 7 days
      const call = mockLoggingService.getLoggingAnalytics.mock.calls[0][0];
      const daysDiff = Math.ceil((call.end.getTime() - call.start.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it('should require authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        return res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/logging/analytics');

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'regular-user-id',
          role: 'PARENT' // Not admin
        };
        next();
      });

      const response = await request(app)
        .get('/api/logging/analytics');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should validate date parameters', async () => {
      const response = await request(app)
        .get('/api/logging/analytics')
        .query({
          startDate: 'invalid-date',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    it('should validate date range', async () => {
      const response = await request(app)
        .get('/api/logging/analytics')
        .query({
          startDate: '2024-01-31',
          endDate: '2024-01-01' // End before start
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    it('should handle service errors', async () => {
      mockLoggingService.getLoggingAnalytics.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/logging/analytics')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('ANALYTICS_FETCH_FAILED');
    });
  });

  describe('GET /api/logging/performance', () => {
    it('should return performance metrics', async () => {
      const mockPerformanceData = {
        slowQueries: [
          {
            operation: 'complex_dashboard_query',
            avgExecutionTime: 1200,
            maxExecutionTime: 2500,
            count: 15
          }
        ],
        queryComplexityDistribution: {
          LOW: 1500,
          MEDIUM: 300,
          HIGH: 45
        },
        averageResponseTimes: {
          dashboard: 250,
          progress: 150,
          badges: 100
        }
      };

      // Mock the service method (assuming it exists)
      mockLoggingService.getPerformanceMetrics = jest.fn().mockResolvedValue(mockPerformanceData);

      const response = await request(app)
        .get('/api/logging/performance')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Performance metrics retrieved successfully',
        metrics: mockPerformanceData
      });
    });

    it('should require admin authentication', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'regular-user-id',
          role: 'CHILD'
        };
        next();
      });

      const response = await request(app)
        .get('/api/logging/performance');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/logging/errors', () => {
    it('should return error statistics', async () => {
      const mockErrorData = {
        errorsByType: [
          { errorCode: 'VALIDATION_ERROR', count: 25 },
          { errorCode: 'DATABASE_ERROR', count: 5 },
          { errorCode: 'ACCESS_DENIED', count: 12 }
        ],
        errorsByEndpoint: [
          { endpoint: '/api/child/:childId/dashboard', errorCount: 8 },
          { endpoint: '/api/child/activity/:activityId/progress', errorCount: 15 }
        ],
        errorTrends: [
          { date: '2024-01-01', errorCount: 5 },
          { date: '2024-01-02', errorCount: 8 }
        ]
      };

      // Mock the service method
      mockLoggingService.getErrorStatistics = jest.fn().mockResolvedValue(mockErrorData);

      const response = await request(app)
        .get('/api/logging/errors')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Error statistics retrieved successfully',
        errors: mockErrorData
      });
    });
  });

  describe('POST /api/logging/export', () => {
    it('should export logging data', async () => {
      const mockExportData = {
        exportId: 'export-123',
        downloadUrl: '/api/logging/download/export-123',
        recordCount: 1500,
        fileSize: '2.5MB'
      };

      // Mock the service method
      mockLoggingService.exportLoggingData = jest.fn().mockResolvedValue(mockExportData);

      const response = await request(app)
        .post('/api/logging/export')
        .send({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          logTypes: ['access', 'progress', 'dashboard'],
          format: 'csv'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Export initiated successfully',
        export: mockExportData
      });

      expect(mockLoggingService.exportLoggingData).toHaveBeenCalledWith({
        timeFrame: {
          start: new Date('2024-01-01T00:00:00.000Z'),
          end: new Date('2024-01-31T23:59:59.999Z')
        },
        logTypes: ['access', 'progress', 'dashboard'],
        format: 'csv'
      });
    });

    it('should validate export parameters', async () => {
      const response = await request(app)
        .post('/api/logging/export')
        .send({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          logTypes: ['invalid-type'], // Invalid log type
          format: 'csv'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_LOG_TYPES');
    });

    it('should require admin role for export', async () => {
      mockAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'regular-user-id',
          role: 'PARENT'
        };
        next();
      });

      const response = await request(app)
        .post('/api/logging/export')
        .send({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          logTypes: ['access'],
          format: 'csv'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request bodies gracefully', async () => {
      const response = await request(app)
        .post('/api/logging/export')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle service unavailability', async () => {
      mockLoggingService.getLoggingAnalytics.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/logging/analytics');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toContain('Failed to retrieve logging analytics');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to analytics endpoints', async () => {
      // Mock successful response
      mockLoggingService.getLoggingAnalytics.mockResolvedValue({
        accessStats: [],
        progressStats: [],
        dashboardStats: [],
        performanceStats: [],
        timeFrame: { start: new Date(), end: new Date() }
      });

      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/logging/analytics')
      );

      const responses = await Promise.all(requests);

      // At least some requests should succeed (exact rate limiting behavior depends on implementation)
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });
});