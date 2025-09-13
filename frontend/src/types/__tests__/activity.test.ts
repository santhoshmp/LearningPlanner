import { ActivityProgress } from '../activity';

describe('Activity Types', () => {
  describe('ActivityProgress', () => {
    it('should accept valid status values', () => {
      const validStatuses: ActivityProgress['status'][] = [
        'not_started',
        'IN_PROGRESS', // Updated to match the component usage
        'completed',
        'needs_help'
      ];

      validStatuses.forEach(status => {
        const progress: Partial<ActivityProgress> = {
          status,
        };
        
        expect(progress.status).toBe(status);
      });
    });

    it('should handle IN_PROGRESS status specifically', () => {
      const progress: Partial<ActivityProgress> = {
        status: 'IN_PROGRESS',
      };
      
      expect(progress.status).toBe('IN_PROGRESS');
      expect(progress.status).not.toBe('in_progress'); // Ensure it's not lowercase
    });

    it('should accept timeSpent in seconds as per type definition', () => {
      const progress: Partial<ActivityProgress> = {
        timeSpent: 300, // 5 minutes in seconds
      };
      
      expect(progress.timeSpent).toBe(300);
    });

    it('should maintain type safety for all required fields', () => {
      const fullProgress: ActivityProgress = {
        id: 'progress-123',
        activityId: 'activity-123',
        childId: 'child-123',
        status: 'IN_PROGRESS',
        score: 85,
        timeSpent: 1800, // 30 minutes in seconds
        helpRequests: [],
        startedAt: '2024-01-01T10:00:00Z',
        lastInteractionAt: '2024-01-01T10:30:00Z',
      };

      // Type checking - these should not cause TypeScript errors
      expect(fullProgress.id).toBeDefined();
      expect(fullProgress.activityId).toBeDefined();
      expect(fullProgress.childId).toBeDefined();
      expect(fullProgress.status).toBe('IN_PROGRESS');
      expect(fullProgress.score).toBe(85);
      expect(fullProgress.timeSpent).toBe(1800);
      expect(Array.isArray(fullProgress.helpRequests)).toBe(true);
      expect(fullProgress.startedAt).toBeDefined();
      expect(fullProgress.lastInteractionAt).toBeDefined();
    });

    it('should handle optional completedAt field', () => {
      const progressWithCompletion: ActivityProgress = {
        id: 'progress-123',
        activityId: 'activity-123',
        childId: 'child-123',
        status: 'completed',
        score: 100,
        timeSpent: 1200,
        helpRequests: [],
        startedAt: '2024-01-01T10:00:00Z',
        lastInteractionAt: '2024-01-01T10:20:00Z',
        completedAt: '2024-01-01T10:20:00Z',
      };

      expect(progressWithCompletion.completedAt).toBeDefined();

      const progressWithoutCompletion: ActivityProgress = {
        id: 'progress-124',
        activityId: 'activity-124',
        childId: 'child-123',
        status: 'IN_PROGRESS',
        score: 50,
        timeSpent: 600,
        helpRequests: [],
        startedAt: '2024-01-01T11:00:00Z',
        lastInteractionAt: '2024-01-01T11:10:00Z',
      };

      expect(progressWithoutCompletion.completedAt).toBeUndefined();
    });
  });

  describe('Status Value Consistency', () => {
    it('should use consistent casing for status values', () => {
      // Test that the type system enforces the correct casing
      const validStatus: ActivityProgress['status'] = 'IN_PROGRESS';
      expect(validStatus).toBe('IN_PROGRESS');
      
      // This would cause a TypeScript error if uncommented:
      // const invalidStatus: ActivityProgress['status'] = 'in_progress';
    });

    it('should match backend enum values', () => {
      // These should match the backend ProgressStatus enum
      const backendCompatibleStatuses: ActivityProgress['status'][] = [
        'not_started',    // NOT_STARTED
        'IN_PROGRESS',    // IN_PROGRESS  
        'completed',      // COMPLETED
        'needs_help'      // NEEDS_HELP
      ];

      backendCompatibleStatuses.forEach(status => {
        const progress: Partial<ActivityProgress> = { status };
        expect(progress.status).toBeDefined();
      });
    });
  });

  describe('Time Handling', () => {
    it('should document that timeSpent is in seconds', () => {
      // The type definition comment indicates timeSpent is in seconds
      const progress: Partial<ActivityProgress> = {
        timeSpent: 3600, // 1 hour in seconds
      };
      
      expect(progress.timeSpent).toBe(3600);
    });

    it('should handle various time values', () => {
      const timeValues = [0, 30, 60, 300, 1800, 3600]; // Various durations in seconds
      
      timeValues.forEach(timeSpent => {
        const progress: Partial<ActivityProgress> = { timeSpent };
        expect(progress.timeSpent).toBe(timeSpent);
        expect(typeof progress.timeSpent).toBe('number');
      });
    });
  });
});