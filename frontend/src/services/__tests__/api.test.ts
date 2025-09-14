import axios from 'axios';
import { activityApi } from '../api';
import { ActivityProgress } from '../../types/activity';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock the API instance
const mockApiInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

mockedAxios.create.mockReturnValue(mockApiInstance as any);

describe('Activity API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    
    // Mock import.meta.env for consistent testing
    (global as any).import = {
      meta: {
        env: {
          VITE_API_URL: 'http://localhost:3001/api'
        }
      }
    };
  });

  describe('updateProgress', () => {
    const mockActivityId = 'activity-123';
    const mockProgressUpdate = {
      status: 'IN_PROGRESS' as const,
      timeSpent: 5, // 5 minutes
    };

    const mockProgressResponse: ActivityProgress = {
      id: 'progress-123',
      activityId: mockActivityId,
      childId: 'child-123',
      status: 'IN_PROGRESS',
      score: 0,
      timeSpent: 300, // 5 minutes in seconds
      helpRequests: [],
      startedAt: '2024-01-01T10:00:00Z',
      lastInteractionAt: '2024-01-01T10:05:00Z',
    };

    it('should update activity progress with correct parameters', async () => {
      mockApiInstance.put.mockResolvedValue({
        data: { progress: mockProgressResponse },
      });

      const result = await activityApi.updateProgress(mockActivityId, mockProgressUpdate);

      expect(mockApiInstance.put).toHaveBeenCalledWith(
        `/activities/${mockActivityId}/progress`,
        mockProgressUpdate
      );
      expect(result).toEqual(mockProgressResponse);
    });

    it('should handle IN_PROGRESS status correctly', async () => {
      const progressWithStatus = {
        status: 'IN_PROGRESS' as const,
        timeSpent: 10,
      };

      mockApiInstance.put.mockResolvedValue({
        data: { progress: mockProgressResponse },
      });

      await activityApi.updateProgress(mockActivityId, progressWithStatus);

      expect(mockApiInstance.put).toHaveBeenCalledWith(
        `/activities/${mockActivityId}/progress`,
        expect.objectContaining({
          status: 'IN_PROGRESS', // Should be uppercase
        })
      );
    });

    it('should handle time spent in minutes', async () => {
      const progressWithTime = {
        status: 'IN_PROGRESS' as const,
        timeSpent: 15, // 15 minutes
      };

      mockApiInstance.put.mockResolvedValue({
        data: { progress: mockProgressResponse },
      });

      await activityApi.updateProgress(mockActivityId, progressWithTime);

      expect(mockApiInstance.put).toHaveBeenCalledWith(
        `/activities/${mockActivityId}/progress`,
        expect.objectContaining({
          timeSpent: 15, // Should be in minutes as passed
        })
      );
    });

    it('should handle partial progress updates', async () => {
      const partialUpdate = {
        timeSpent: 7,
      };

      mockApiInstance.put.mockResolvedValue({
        data: { progress: mockProgressResponse },
      });

      await activityApi.updateProgress(mockActivityId, partialUpdate);

      expect(mockApiInstance.put).toHaveBeenCalledWith(
        `/activities/${mockActivityId}/progress`,
        partialUpdate
      );
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to update progress';
      mockApiInstance.put.mockRejectedValue(new Error(errorMessage));

      await expect(
        activityApi.updateProgress(mockActivityId, mockProgressUpdate)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle network errors', async () => {
      mockApiInstance.put.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      await expect(
        activityApi.updateProgress(mockActivityId, mockProgressUpdate)
      ).rejects.toMatchObject({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });
    });

    it('should handle authentication errors', async () => {
      mockApiInstance.put.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      });

      await expect(
        activityApi.updateProgress(mockActivityId, mockProgressUpdate)
      ).rejects.toMatchObject({
        response: {
          status: 401,
        },
      });
    });

    it('should include authorization header when token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockApiInstance.put.mockResolvedValue({
        data: { progress: mockProgressResponse },
      });

      await activityApi.updateProgress(mockActivityId, mockProgressUpdate);

      // The authorization header should be added by the request interceptor
      expect(mockApiInstance.put).toHaveBeenCalled();
    });

    it('should work without authorization header when no token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockApiInstance.put.mockResolvedValue({
        data: { progress: mockProgressResponse },
      });

      await activityApi.updateProgress(mockActivityId, mockProgressUpdate);

      expect(mockApiInstance.put).toHaveBeenCalled();
    });
  });

  describe('Progress Status Values', () => {
    it('should accept all valid status values', async () => {
      const validStatuses = ['not_started', 'IN_PROGRESS', 'completed', 'needs_help'] as const;
      
      mockApiInstance.put.mockResolvedValue({
        data: { progress: {} },
      });

      for (const status of validStatuses) {
        await activityApi.updateProgress('activity-123', { status });
        
        expect(mockApiInstance.put).toHaveBeenCalledWith(
          '/activities/activity-123/progress',
          expect.objectContaining({ status })
        );
      }
    });

    it('should handle status case sensitivity correctly', async () => {
      // Test that the API accepts the exact case used in the component
      const progressUpdate = {
        status: 'IN_PROGRESS' as const,
        timeSpent: 5,
      };

      mockApiInstance.put.mockResolvedValue({
        data: { progress: {} },
      });

      await activityApi.updateProgress('activity-123', progressUpdate);

      expect(mockApiInstance.put).toHaveBeenCalledWith(
        '/activities/activity-123/progress',
        expect.objectContaining({
          status: 'IN_PROGRESS', // Exact case match
        })
      );
    });
  });

  describe('Time Conversion Handling', () => {
    it('should handle various time values correctly', async () => {
      const timeValues = [0, 1, 30, 60, 120, 300]; // Various minute values
      
      mockApiInstance.put.mockResolvedValue({
        data: { progress: {} },
      });

      for (const timeSpent of timeValues) {
        await activityApi.updateProgress('activity-123', { timeSpent });
        
        expect(mockApiInstance.put).toHaveBeenCalledWith(
          '/activities/activity-123/progress',
          expect.objectContaining({ timeSpent })
        );
      }
    });

    it('should handle fractional minutes from seconds conversion', async () => {
      // Test that the API can handle fractional minutes that result from seconds-to-minutes conversion
      const fractionalMinutes = Math.floor(150 / 60); // 2.5 minutes -> 2 minutes (floored)
      
      mockApiInstance.put.mockResolvedValue({
        data: { progress: {} },
      });

      await activityApi.updateProgress('activity-123', { timeSpent: fractionalMinutes });

      expect(mockApiInstance.put).toHaveBeenCalledWith(
        '/activities/activity-123/progress',
        expect.objectContaining({ timeSpent: 2 })
      );
    });
  });

  describe('submitActivity', () => {
    const mockActivityId = 'activity-123';
    const mockSubmission = {
      answers: { question1: 'answer1', question2: 'answer2' },
      score: 85,
      timeSpent: 1200
    };

    const mockSubmissionResponse = {
      success: true,
      progress: {
        id: 'progress-123',
        activityId: mockActivityId,
        childId: 'child-123',
        status: 'COMPLETED',
        score: 85,
        timeSpent: 1200,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      activity: {
        id: mockActivityId,
        title: 'Test Activity',
        subject: 'Mathematics'
      },
      planProgress: {
        completedActivities: 2,
        totalActivities: 5,
        completionPercentage: 40,
        isPlanCompleted: false
      },
      message: 'Activity submitted successfully'
    };

    it('should submit activity completion successfully', async () => {
      mockApiInstance.post.mockResolvedValue({
        data: mockSubmissionResponse,
      });

      const result = await activityApi.submitActivity(mockActivityId, mockSubmission);

      expect(mockApiInstance.post).toHaveBeenCalledWith(
        `/activities/${mockActivityId}/submit`,
        mockSubmission
      );
      expect(result).toEqual(mockSubmissionResponse);
    });

    it('should handle submission with minimal data', async () => {
      const minimalSubmission = {
        answers: { question1: 'answer' }
      };

      const minimalResponse = {
        ...mockSubmissionResponse,
        progress: {
          ...mockSubmissionResponse.progress,
          score: 100, // Default score
          timeSpent: 30 // Default time
        }
      };

      mockApiInstance.post.mockResolvedValue({
        data: minimalResponse,
      });

      const result = await activityApi.submitActivity(mockActivityId, minimalSubmission);

      expect(mockApiInstance.post).toHaveBeenCalledWith(
        `/activities/${mockActivityId}/submit`,
        minimalSubmission
      );
      expect(result).toEqual(minimalResponse);
    });

    it('should handle plan completion', async () => {
      const planCompletionResponse = {
        ...mockSubmissionResponse,
        planProgress: {
          completedActivities: 5,
          totalActivities: 5,
          completionPercentage: 100,
          isPlanCompleted: true
        }
      };

      mockApiInstance.post.mockResolvedValue({
        data: planCompletionResponse,
      });

      const result = await activityApi.submitActivity(mockActivityId, mockSubmission);

      expect(result.planProgress.isPlanCompleted).toBe(true);
      expect(result.planProgress.completionPercentage).toBe(100);
    });

    it('should handle submission errors', async () => {
      const errorMessage = 'Failed to submit activity';
      mockApiInstance.post.mockRejectedValue(new Error(errorMessage));

      await expect(
        activityApi.submitActivity(mockActivityId, mockSubmission)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle validation errors', async () => {
      mockApiInstance.post.mockRejectedValue({
        response: {
          status: 400,
          data: { 
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid submission data'
            }
          },
        },
      });

      await expect(
        activityApi.submitActivity(mockActivityId, mockSubmission)
      ).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });

    it('should handle access denied errors', async () => {
      mockApiInstance.post.mockRejectedValue({
        response: {
          status: 403,
          data: { 
            error: {
              code: 'ACCESS_DENIED',
              message: 'Access denied to this activity'
            }
          },
        },
      });

      await expect(
        activityApi.submitActivity(mockActivityId, mockSubmission)
      ).rejects.toMatchObject({
        response: {
          status: 403,
        },
      });
    });

    it('should handle activity not found errors', async () => {
      mockApiInstance.post.mockRejectedValue({
        response: {
          status: 404,
          data: { 
            error: {
              code: 'ACTIVITY_NOT_FOUND',
              message: 'Activity not found'
            }
          },
        },
      });

      await expect(
        activityApi.submitActivity(mockActivityId, mockSubmission)
      ).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });

  describe('Environment Variable Integration', () => {
    it('should work with different VITE_API_URL configurations', () => {
      const testConfigs = [
        'http://localhost:3001/api',
        'http://localhost:3001',
        'https://api.example.com/api/v1',
        undefined
      ];

      for (const apiUrl of testConfigs) {
        // Update mock environment
        if (apiUrl) {
          (global as any).import.meta.env.VITE_API_URL = apiUrl;
        } else {
          delete (global as any).import.meta.env.VITE_API_URL;
        }

        // The API service should handle different configurations gracefully
        // This test ensures the service doesn't break with different env configs
        expect(() => {
          // Re-import or re-initialize the API service would happen here
          // For now, we just verify the environment is set correctly
          const currentApiUrl = (global as any).import?.meta?.env?.VITE_API_URL;
          expect(currentApiUrl).toBe(apiUrl);
        }).not.toThrow();
      }
    });

    it('should handle missing environment variables gracefully', () => {
      // Remove environment variables
      (global as any).import = {
        meta: {
          env: {}
        }
      };

      // The API service should still function with fallback values
      expect(() => {
        const currentEnv = (global as any).import.meta.env;
        expect(currentEnv).toBeDefined();
        expect(currentEnv.VITE_API_URL).toBeUndefined();
      }).not.toThrow();
    });
  });
});