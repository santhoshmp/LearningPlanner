import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityPlayer from '../ActivityPlayer';
import { AuthContext } from '../../../contexts/AuthContext';
import { ThemeContext } from '../../../theme/ThemeContext';
import * as api from '../../../services/api';

// Mock the API services
jest.mock('../../../services/api');

const mockTheme = createTheme();

const mockAuthContextValue = {
  user: { id: 'child-123', role: 'child' },
  isChild: true,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
};

const mockThemeContextValue = {
  theme: mockTheme,
  toggleTheme: jest.fn(),
  isDarkMode: false,
};

const mockStudyPlan = {
  id: 'plan-123',
  childId: 'child-123',
  childProfile: {
    id: 'child-123',
    name: 'Test Child',
    age: 10,
  },
  activities: [
    {
      id: 'activity-123',
      title: 'Math Quiz',
      description: 'A simple math quiz',
      subject: 'math',
      estimatedDuration: 30,
      content: {
        type: 'quiz',
        data: {
          questions: [
            { id: '1', question: 'What is 2+2?', options: ['3', '4', '5'] },
          ],
        },
      },
    },
  ],
};

const renderActivityPlayer = () => {
  return render(
    <MemoryRouter initialEntries={['/child/plan/plan-123/activity/activity-123']}>
      <ThemeProvider theme={mockTheme}>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ThemeContext.Provider value={mockThemeContextValue}>
            <ActivityPlayer />
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('ActivityPlayer Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup API mocks
    (api.childDashboardApi.getStudyPlan as jest.Mock).mockResolvedValue(mockStudyPlan);
    (api.activityApi.getActivityProgress as jest.Mock).mockResolvedValue({
      id: 'progress-123',
      activityId: 'activity-123',
      childId: 'child-123',
      status: 'IN_PROGRESS',
      score: 0,
      timeSpent: 0,
      helpRequests: [],
      startedAt: new Date().toISOString(),
      lastInteractionAt: new Date().toISOString(),
    });
    (api.activityApi.startActivity as jest.Mock).mockResolvedValue({});
    (api.activityApi.updateProgress as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Progress Saving with Correct Status and Time Conversion', () => {
    it('should save progress with IN_PROGRESS status and convert seconds to minutes', async () => {
      renderActivityPlayer();
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Simulate 150 seconds (2.5 minutes) of elapsed time
      act(() => {
        jest.advanceTimersByTime(150000); // 150 seconds
      });

      // Trigger pause to save progress
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      // Verify the API was called with correct parameters
      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledWith('activity-123', {
          status: 'IN_PROGRESS', // Should be uppercase
          timeSpent: 2, // 150 seconds converted to 2 minutes (floored)
        });
      });
    });

    it('should handle zero elapsed time correctly', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Immediately pause without any elapsed time
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledWith('activity-123', {
          status: 'IN_PROGRESS',
          timeSpent: 0, // Should be 0 minutes
        });
      });
    });

    it('should handle large elapsed times correctly', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Simulate 3661 seconds (1 hour, 1 minute, 1 second)
      act(() => {
        jest.advanceTimersByTime(3661000);
      });

      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledWith('activity-123', {
          status: 'IN_PROGRESS',
          timeSpent: 61, // 3661 seconds = 61.016... minutes, floored to 61
        });
      });
    });

    it('should save progress periodically during activity', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Simulate 30 seconds of activity
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Advance to trigger the periodic save (every 30 seconds)
      act(() => {
        jest.advanceTimersByTime(1000); // Just past the 30-second mark
      });

      // The periodic save should have been triggered
      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledWith('activity-123', {
          status: 'IN_PROGRESS',
          timeSpent: 0, // 30 seconds = 0.5 minutes, floored to 0
        });
      });
    });

    it('should not save progress when activity is paused', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Pause the activity
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      // Clear the mock to track new calls
      jest.clearAllMocks();

      // Advance time while paused
      act(() => {
        jest.advanceTimersByTime(60000); // 1 minute
      });

      // Should not have made any progress update calls while paused
      expect(api.activityApi.updateProgress).not.toHaveBeenCalled();
    });

    it('should resume saving progress after unpausing', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Pause the activity
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      // Resume the activity
      const resumeButton = screen.getByText('Resume');
      fireEvent.click(resumeButton);

      // Clear mocks to track new calls
      jest.clearAllMocks();

      // Advance time after resuming
      act(() => {
        jest.advanceTimersByTime(90000); // 1.5 minutes
      });

      // Trigger another pause to save progress
      const pauseButtonAgain = screen.getByText('Pause');
      fireEvent.click(pauseButtonAgain);

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledWith('activity-123', {
          status: 'IN_PROGRESS',
          timeSpent: 1, // 90 seconds = 1.5 minutes, floored to 1
        });
      });
    });
  });

  describe('Status Value Consistency', () => {
    it('should always use uppercase status values', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Test multiple pause/resume cycles
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledWith(
          'activity-123',
          expect.objectContaining({
            status: 'IN_PROGRESS', // Must be uppercase
          })
        );
      });

      // Verify it's not the old lowercase version
      expect(api.activityApi.updateProgress).not.toHaveBeenCalledWith(
        'activity-123',
        expect.objectContaining({
          status: 'in_progress', // Should not be lowercase
        })
      );
    });

    it('should maintain status consistency across different save triggers', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Test different ways progress can be saved
      
      // 1. Manual pause
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenLastCalledWith(
          'activity-123',
          expect.objectContaining({ status: 'IN_PROGRESS' })
        );
      });

      // 2. Resume and let periodic save trigger
      const resumeButton = screen.getByText('Resume');
      fireEvent.click(resumeButton);

      // Clear previous calls
      jest.clearAllMocks();

      // Advance time to trigger periodic save
      act(() => {
        jest.advanceTimersByTime(31000); // Just over 30 seconds
      });

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledWith(
          'activity-123',
          expect.objectContaining({ status: 'IN_PROGRESS' })
        );
      });
    });
  });

  describe('Time Conversion Edge Cases', () => {
    it('should handle fractional seconds correctly', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Test various fractional minute values
      const testCases = [
        { seconds: 59, expectedMinutes: 0 },   // 59 seconds = 0.98 minutes -> 0
        { seconds: 60, expectedMinutes: 1 },   // 60 seconds = 1 minute -> 1
        { seconds: 61, expectedMinutes: 1 },   // 61 seconds = 1.01 minutes -> 1
        { seconds: 119, expectedMinutes: 1 },  // 119 seconds = 1.98 minutes -> 1
        { seconds: 120, expectedMinutes: 2 },  // 120 seconds = 2 minutes -> 2
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        // Simulate the specific elapsed time
        act(() => {
          jest.advanceTimersByTime(testCase.seconds * 1000);
        });

        const pauseButton = screen.getByText('Pause') || screen.getByText('Resume');
        fireEvent.click(pauseButton);

        await waitFor(() => {
          expect(api.activityApi.updateProgress).toHaveBeenCalledWith(
            'activity-123',
            expect.objectContaining({
              timeSpent: testCase.expectedMinutes,
            })
          );
        });

        // Resume for next test
        const resumeButton = screen.getByText('Resume') || screen.getByText('Pause');
        if (resumeButton.textContent === 'Resume') {
          fireEvent.click(resumeButton);
        }
      }
    });

    it('should handle very large time values', async () => {
      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Simulate a very long session (10 hours = 36000 seconds = 600 minutes)
      act(() => {
        jest.advanceTimersByTime(36000000); // 10 hours in milliseconds
      });

      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledWith('activity-123', {
          status: 'IN_PROGRESS',
          timeSpent: 600, // 36000 seconds = 600 minutes
        });
      });
    });
  });

  describe('Error Handling During Progress Save', () => {
    it('should handle API errors gracefully without crashing', async () => {
      // Mock API to reject
      (api.activityApi.updateProgress as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // Trigger progress save
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      // Should log error but not crash
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save progress:', expect.any(Error));
      });

      // Component should still be functional
      expect(screen.getByText('Math Quiz')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should retry progress save after network recovery', async () => {
      // First call fails, second succeeds
      (api.activityApi.updateProgress as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({});

      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Math Quiz')).toBeInTheDocument();
      });

      // First save attempt (should fail)
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      // Resume and try again
      const resumeButton = screen.getByText('Resume');
      fireEvent.click(resumeButton);

      // Second save attempt (should succeed)
      fireEvent.click(screen.getByText('Pause'));

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalledTimes(2);
      });
    });
  });
});