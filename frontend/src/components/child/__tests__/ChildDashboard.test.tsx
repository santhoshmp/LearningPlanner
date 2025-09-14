import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ChildDashboard from '../ChildDashboard';
import { createChildTheme } from '../../../theme/childTheme';
import * as api from '../../../services/api';

// Mock API calls
jest.mock('../../../services/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock AuthContext
const mockAuthContext = {
  user: { id: 'child-1', firstName: 'Test Child', role: 'child' },
  isAuthenticated: true,
  isLoading: false,
  isChild: true,
  lastError: null,
  clearError: jest.fn(),
  logout: jest.fn()
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock mobile optimizations hook
jest.mock('../../../hooks/useMobileOptimizations', () => ({
  useMobileOptimizations: () => ({
    isTablet: false,
    screenSize: 'large'
  })
}));

// Mock session manager
jest.mock('../SessionManager', () => {
  return function MockSessionManager() {
    return <div data-testid="session-manager" />;
  };
});

const mockDashboardData = {
  child: {
    id: 'child-1',
    name: 'Test Child',
    age: 8,
    grade: '3rd Grade',
    skillProfile: {}
  },
  progressSummary: {
    totalActivities: 15,
    completedActivities: 10,
    inProgressActivities: 3,
    totalTimeSpent: 2400,
    averageScore: 85,
    weeklyGoalProgress: 70,
    monthlyGoalProgress: 45,
    lastActivityDate: new Date('2024-01-15'),
    subjectProgress: [],
    currentDailyStreak: 5,
    longestDailyStreak: 12,
    activityCompletionStreak: 3,
    perfectScoreStreak: 2,
    helpFreeStreak: 1
  },
  studyPlans: [
    {
      id: 'plan-1',
      childId: 'child-1',
      subject: 'Mathematics',
      grade: '3rd Grade',
      difficulty: 'intermediate' as const,
      objectives: [{ id: '1', description: 'Basic arithmetic', completed: true }],
      activities: [],
      selectedTopics: [],
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalActivities: 10,
      completedActivities: 6,
      inProgressActivities: 2,
      progressPercentage: 60,
      totalTimeSpent: 1800,
      averageScore: 88
    },
    {
      id: 'plan-2',
      childId: 'child-1',
      subject: 'Reading',
      grade: '3rd Grade',
      difficulty: 'beginner' as const,
      objectives: [{ id: '2', description: 'Reading comprehension', completed: false }],
      activities: [],
      selectedTopics: [],
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalActivities: 5,
      completedActivities: 4,
      inProgressActivities: 1,
      progressPercentage: 80,
      totalTimeSpent: 600,
      averageScore: 92
    }
  ],
  currentStreaks: [
    {
      id: '1',
      type: 'DAILY',
      currentCount: 5,
      longestCount: 12,
      isActive: true,
      lastActivityDate: new Date('2024-01-15'),
      streakStartDate: new Date('2024-01-10')
    }
  ],
  badges: {
    recent: [
      {
        id: 'badge-1',
        title: 'Math Star',
        description: 'Completed 5 math activities',
        type: 'achievement',
        earnedAt: new Date('2024-01-10'),
        celebrationShown: false,
        iconUrl: '⭐',
        isNew: false
      }
    ],
    progress: [],
    nextToEarn: []
  },
  dailyGoals: {
    activitiesTarget: 5,
    activitiesCompleted: 3,
    activitiesProgress: 60,
    timeTarget: 1800,
    timeSpent: 1200,
    timeProgress: 66.7,
    streakTarget: 7,
    currentStreak: 5,
    streakProgress: 71.4
  },
  lastUpdated: new Date().toISOString()
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const childTheme = createChildTheme('light');

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={childTheme}>
          {component}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('ChildDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock the childDashboardApi.getDashboard method
    const mockGetDashboard = jest.fn().mockResolvedValue({
      dashboard: mockDashboardData
    });
    
    (mockApi as any).childDashboardApi = {
      getDashboard: mockGetDashboard
    };
  });

  it('should render child dashboard with welcome message', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Test Child!/i)).toBeInTheDocument();
    });
  });

  it('should display study plans with progress indicators', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Reading')).toBeInTheDocument();
      expect(screen.getByText('60% Complete')).toBeInTheDocument();
      expect(screen.getByText('80% Complete')).toBeInTheDocument();
    });
  });

  it('should show learning streak with fire animation', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/5 days/i)).toBeInTheDocument();
      expect(screen.getByText(/🔥/)).toBeInTheDocument();
      expect(screen.getByText(/Learning Streak/i)).toBeInTheDocument();
    });
  });

  it('should display earned badges', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Math Star')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });
  });

  it('should show daily goals widget', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Today's Goals/i)).toBeInTheDocument();
      expect(screen.getByText(/60%/)).toBeInTheDocument(); // Activities progress
    });
  });

  it('should handle study plan click navigation', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      const studyPlanCard = screen.getByText('Mathematics');
      fireEvent.click(studyPlanCard.closest('div')!);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/child/study-plan/plan-1');
  });

  it('should show loading state initially', () => {
    // Mock loading state
    const mockGetDashboard = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    (mockApi as any).childDashboardApi = {
      getDashboard: mockGetDashboard
    };

    renderWithProviders(<ChildDashboard />);

    expect(screen.getByText(/Loading your learning adventure.../i)).toBeInTheDocument();
  });

  it('should handle error state gracefully', async () => {
    const mockGetDashboard = jest.fn().mockRejectedValue(new Error('Failed to load dashboard'));
    (mockApi as any).childDashboardApi = {
      getDashboard: mockGetDashboard
    };

    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Having trouble connecting/i)).toBeInTheDocument();
    });
  });

  it('should display child-friendly error messages', async () => {
    const mockGetDashboard = jest.fn().mockRejectedValue(new Error('Network error'));
    (mockApi as any).childDashboardApi = {
      getDashboard: mockGetDashboard
    };

    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Using demo data for now/i)).toBeInTheDocument();
    });
  });

  it('should show celebration animation for new badges', async () => {
    const childDataWithNewBadge = {
      ...mockDashboardData,
      badges: {
        ...mockDashboardData.badges,
        recent: [
          ...mockDashboardData.badges.recent,
          {
            id: 'badge-2',
            title: 'Reading Champion',
            description: 'Completed 5 reading activities',
            type: 'achievement',
            earnedAt: new Date(), // Just earned
            celebrationShown: false,
            iconUrl: '📚',
            isNew: true
          }
        ]
      }
    };

    const mockGetDashboard = jest.fn().mockResolvedValue({
      dashboard: childDataWithNewBadge
    });
    (mockApi as any).childDashboardApi = {
      getDashboard: mockGetDashboard
    };

    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Reading Champion')).toBeInTheDocument();
    });
  });

  it('should display progress statistics', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Completed activities
      expect(screen.getByText('3')).toBeInTheDocument(); // In progress activities
      expect(screen.getByText('85%')).toBeInTheDocument(); // Average score
    });
  });

  it('should show streak information correctly', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Best: 12 days/i)).toBeInTheDocument();
      expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    });
  });

  it('should handle logout functionality', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);
    });

    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  it('should be accessible with proper ARIA labels', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Child Dashboard');
    });
  });

  it('should support keyboard navigation', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      const firstStudyPlan = screen.getByText('Mathematics').closest('div');
      if (firstStudyPlan) {
        firstStudyPlan.focus();
        expect(firstStudyPlan).toHaveFocus();
      }
    });
  });

  it('should display session manager', () => {
    renderWithProviders(<ChildDashboard />);
    
    expect(screen.getByTestId('session-manager')).toBeInTheDocument();
  });

  it('should handle authentication errors', async () => {
    // Mock authentication error
    const mockAuthContextWithError = {
      ...mockAuthContext,
      lastError: {
        userFriendlyMessage: 'Please log in again',
        shouldRedirect: true
      }
    };

    jest.mocked(require('../../../contexts/AuthContext').useAuth).mockReturnValue(mockAuthContextWithError);

    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Please log in again/i)).toBeInTheDocument();
    });
  });

  it('should redirect unauthenticated users', () => {
    const mockUnauthenticatedContext = {
      ...mockAuthContext,
      isAuthenticated: false,
      isLoading: false
    };

    jest.mocked(require('../../../contexts/AuthContext').useAuth).mockReturnValue(mockUnauthenticatedContext);

    renderWithProviders(<ChildDashboard />);

    expect(mockNavigate).toHaveBeenCalledWith('/child-login', { replace: true });
  });

  it('should redirect non-child users to parent dashboard', () => {
    const mockParentContext = {
      ...mockAuthContext,
      isChild: false
    };

    jest.mocked(require('../../../contexts/AuthContext').useAuth).mockReturnValue(mockParentContext);

    renderWithProviders(<ChildDashboard />);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('should handle real-time data updates', async () => {
    renderWithProviders(<ChildDashboard />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });

    // Simulate data update after 30 seconds (mocked)
    jest.advanceTimersByTime(30000);

    // The component should still be functional
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  it('should display correct time formatting', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      // Time should be displayed in minutes format
      expect(screen.getByText(/40m/)).toBeInTheDocument(); // totalTimeSpent: 2400 seconds = 40 minutes
    });
  });

  it('should show appropriate completion messages', async () => {
    const completedPlanData = {
      ...mockDashboardData,
      studyPlans: [
        {
          ...mockDashboardData.studyPlans[0],
          progressPercentage: 100,
          completedActivities: 10,
          totalActivities: 10
        }
      ]
    };

    const mockGetDashboard = jest.fn().mockResolvedValue({
      dashboard: completedPlanData
    });
    (mockApi as any).childDashboardApi = {
      getDashboard: mockGetDashboard
    };

    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Completed!')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });
  });
});