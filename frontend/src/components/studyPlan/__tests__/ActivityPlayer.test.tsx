import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityPlayer from '../ActivityPlayer';
import * as api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  activityApi: {
    getActivity: jest.fn(),
    startActivity: jest.fn(),
    updateProgress: jest.fn(),
    submitActivity: jest.fn(),
  },
  studyPlanApi: {
    getStudyPlan: jest.fn(),
  },
}));

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </MemoryRouter>
);

const mockActivity = {
  id: 'activity-123',
  title: 'Test Activity',
  description: 'A test activity',
  content: {
    type: 'quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is 2+2?',
        type: 'multiple-choice',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4'
      },
      {
        id: 'q2',
        question: 'What is 3+3?',
        type: 'multiple-choice',
        options: ['5', '6', '7', '8'],
        correctAnswer: '6'
      }
    ]
  },
  estimatedDuration: 30,
  difficulty: 'MEDIUM',
  progress: null
};

const mockProgress = {
  id: 'progress-123',
  activityId: 'activity-123',
  childId: 'child-123',
  status: 'IN_PROGRESS',
  score: 0,
  timeSpent: 0,
  startedAt: new Date().toISOString(),
  lastInteractionAt: new Date().toISOString()
};

describe('ActivityPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.activityApi.getActivity as jest.Mock).mockResolvedValue(mockActivity);
    (api.activityApi.startActivity as jest.Mock).mockResolvedValue(mockProgress);
    (api.activityApi.updateProgress as jest.Mock).mockResolvedValue(mockProgress);
  });

  const renderActivityPlayer = () => {
    return render(
      <TestWrapper>
        <ActivityPlayer activityId="activity-123" />
      </TestWrapper>
    );
  };

  describe('Activity Loading', () => {
    it('should load and display activity', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      expect(api.activityApi.getActivity).toHaveBeenCalledWith('activity-123');
    });

    it('should handle loading state', () => {
      renderActivityPlayer();
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle activity not found', async () => {
      (api.activityApi.getActivity as jest.Mock).mockRejectedValue(new Error('Activity not found'));

      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('Activity not found')).toBeInTheDocument();
      });
    });
  });

  describe('Activity Interaction', () => {
    it('should start activity when loaded', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(api.activityApi.startActivity).toHaveBeenCalledWith('activity-123');
      });
    });

    it('should display questions and allow answers', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      });

      // Should show answer options
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('should allow selecting answers', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      });

      const correctAnswer = screen.getByText('4');
      fireEvent.click(correctAnswer);

      expect(correctAnswer).toHaveClass('selected');
    });

    it('should navigate between questions', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      });

      // Answer first question
      fireEvent.click(screen.getByText('4'));
      
      // Go to next question
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('What is 3+3?')).toBeInTheDocument();
      });
    });

    it('should update progress during activity', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      // Answer a question
      fireEvent.click(screen.getByText('4'));

      await waitFor(() => {
        expect(api.activityApi.updateProgress).toHaveBeenCalled();
      });
    });

    it('should show progress indicator', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toHaveTextContent('Progress: 1/2');
      });

      // Answer first question and move to next
      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toHaveTextContent('Progress: 2/2');
      });
    });
  });

  describe('Activity Completion', () => {
    it('should handle activity completion', async () => {
      const mockCompletionResult = {
        success: true,
        progress: {
          id: 'progress-123',
          activityId: 'activity-123',
          childId: 'child-123',
          status: 'COMPLETED',
          score: 85,
          timeSpent: 1200,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        activity: {
          id: 'activity-123',
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

      (api.activityApi.submitActivity as jest.Mock).mockResolvedValue(mockCompletionResult);

      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      // Answer both questions and complete the activity
      const answerButton = screen.getByText('4');
      fireEvent.click(answerButton);

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Answer second question
      fireEvent.click(screen.getByText('6'));
      
      // Complete the activity
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(api.activityApi.submitActivity).toHaveBeenCalledWith('activity-123', {
          answers: { 0: '4', 1: '6' },
          score: expect.any(Number),
          timeSpent: expect.any(Number)
        });
      });

      // Should show completion modal
      await waitFor(() => {
        expect(screen.getByTestId('completion-modal')).toBeInTheDocument();
      });
    });

    it('should handle plan completion', async () => {
      const mockCompletionResult = {
        success: true,
        progress: {
          id: 'progress-123',
          activityId: 'activity-123',
          childId: 'child-123',
          status: 'COMPLETED',
          score: 100,
          timeSpent: 900,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        activity: {
          id: 'activity-123',
          title: 'Test Activity',
          subject: 'Mathematics'
        },
        planProgress: {
          completedActivities: 5,
          totalActivities: 5,
          completionPercentage: 100,
          isPlanCompleted: true
        },
        message: 'Activity submitted successfully'
      };

      (api.activityApi.submitActivity as jest.Mock).mockResolvedValue(mockCompletionResult);

      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      // Complete the activity quickly to trigger plan completion
      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('6'));
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Study Plan Complete!')).toBeInTheDocument();
      });
    });

    it('should handle submission errors', async () => {
      (api.activityApi.submitActivity as jest.Mock).mockRejectedValue(new Error('Submission failed'));

      renderActivityPlayer();
      
      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      // Complete the activity
      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('6'));
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Failed to submit activity')).toBeInTheDocument();
      });
    });
  });

  describe('Help System', () => {
    it('should show help button', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByTestId('help-button')).toBeInTheDocument();
      });
    });

    it('should handle help requests', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByTestId('help-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('help-button'));

      await waitFor(() => {
        expect(screen.getByTestId('help-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (api.activityApi.getActivity as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('Failed to load activity')).toBeInTheDocument();
      });
    });

    it('should handle progress update errors', async () => {
      (api.activityApi.updateProgress as jest.Mock).mockRejectedValue(new Error('Update failed'));

      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      // Try to answer a question
      fireEvent.click(screen.getByText('4'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update progress')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Activity Player');
      });

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderActivityPlayer();

      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      const firstOption = screen.getByText('3');
      firstOption.focus();
      
      // Should be able to navigate with arrow keys
      fireEvent.keyDown(firstOption, { key: 'ArrowDown' });
      expect(screen.getByText('4')).toHaveFocus();
    });
  });
});