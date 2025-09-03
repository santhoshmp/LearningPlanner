import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ThemeProvider } from '../../../theme/ThemeContext';
import ChildDashboard from '../ChildDashboard';

// Mock the API services
jest.mock('../../../services/api', () => ({
  childDashboardApi: {
    getDashboard: jest.fn().mockResolvedValue({
      child: { id: 'test-child-id' },
      progressSummary: {
        totalActivities: 10,
        completedActivities: 5,
        inProgressActivities: 2,
        totalTimeSpent: 1800,
        averageScore: 85,
        currentDailyStreak: 3,
        longestDailyStreak: 7,
        lastActivityDate: new Date(),
        weeklyGoalProgress: 60,
        monthlyGoalProgress: 40
      },
      activeActivities: [],
      currentStreaks: [{
        id: '1',
        streakType: 'DAILY',
        currentCount: 3,
        longestCount: 7,
        isActive: true,
        lastActivityDate: new Date()
      }],
      studyPlans: [{
        id: 'plan-1',
        childId: 'test-child-id',
        subject: 'Mathematics',
        grade: '5th Grade',
        difficulty: 'intermediate' as const,
        objectives: ['Basic arithmetic'],
        estimatedDuration: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalActivities: 8,
        completedActivities: 4,
        progressPercentage: 50,
        status: 'active' as const
      }],
      badges: {
        recent: [{
          id: 'badge-1',
          title: 'First Steps',
          description: 'Completed first activity',
          iconUrl: '🏅',
          type: 'badge' as const,
          earnedAt: new Date(),
          isNew: true
        }],
        progress: [],
        nextToEarn: []
      },
      dailyGoals: {
        activitiesTarget: 5,
        activitiesCompleted: 3,
        timeTarget: 1800,
        timeSpent: 1200
      }
    })
  }
}));

// Mock the mobile optimizations hook
jest.mock('../../../hooks/useMobileOptimizations', () => ({
  useMobileOptimizations: () => ({
    isTablet: false,
    screenSize: 'large'
  })
}));

// Mock the session manager
jest.mock('../SessionManager', () => {
  return function MockSessionManager() {
    return <div data-testid="session-manager">Session Manager</div>;
  };
});

// Mock the responsive dashboard
jest.mock('../../mobile/ResponsiveChildDashboard', () => ({
  ResponsiveChildDashboard: () => <div data-testid="responsive-dashboard">Responsive Dashboard</div>
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            {component}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock AuthContext with child user
const mockAuthContext = {
  user: {
    id: 'test-child-id',
    role: 'CHILD' as const,
    username: 'testchild',
    name: 'Test Child',
    parentId: 'parent-id'
  },
  isAuthenticated: true,
  isLoading: false,
  isChild: true,
  userRole: 'child' as const,
  lastError: null,
  logout: jest.fn(),
  clearError: jest.fn(),
  handleAuthError: jest.fn()
};

jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => mockAuthContext
}));

describe('ChildDashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard for authenticated child user', async () => {
    renderWithProviders(<ChildDashboard />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Check that main dashboard elements are present
    expect(screen.getByText('Study Adventure')).toBeInTheDocument();
    expect(screen.getByText('Hi, Test Child! 👋')).toBeInTheDocument();
    expect(screen.getByText('Your Learning Adventures')).toBeInTheDocument();
  });

  it('displays progress summary correctly', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Check progress stats
    expect(screen.getByText('5')).toBeInTheDocument(); // Completed activities
    expect(screen.getByText('2')).toBeInTheDocument(); // In progress activities
    expect(screen.getByText('85%')).toBeInTheDocument(); // Average score
  });

  it('displays learning streak correctly', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Check streak display
    expect(screen.getByText('Learning Streak')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('Best: 7 days')).toBeInTheDocument();
  });

  it('displays study plans correctly', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Check study plan display
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('4/8 activities completed')).toBeInTheDocument();
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('displays daily goals correctly', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Check daily goals
    expect(screen.getByText("Today's Goals")).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument(); // Activities progress
    expect(screen.getByText('20m/30m')).toBeInTheDocument(); // Time progress
  });

  it('displays recent achievements correctly', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Check achievements section
    expect(screen.getByText('🏆 Recent Achievements')).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Completed first activity')).toBeInTheDocument();
  });

  it('handles logout correctly', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Find and click logout button
    const logoutButton = screen.getByText('Sign out');
    fireEvent.click(logoutButton);

    // Verify logout was called
    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  it('includes session manager for inactivity detection', async () => {
    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Check that session manager is present
    expect(screen.getByTestId('session-manager')).toBeInTheDocument();
  });

  it('handles API errors gracefully with mock data', async () => {
    // Mock API failure
    const mockApi = require('../../../services/api');
    mockApi.childDashboardApi.getDashboard.mockRejectedValueOnce(new Error('API Error'));

    renderWithProviders(<ChildDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your learning adventure...')).not.toBeInTheDocument();
    });

    // Should still render with mock data
    expect(screen.getByText('Study Adventure')).toBeInTheDocument();
    expect(screen.getByText('Having trouble connecting. Using demo data for now! 🌟')).toBeInTheDocument();
  });
});

describe('ChildDashboard Authentication Error Handling', () => {
  it('shows error state when authentication error occurs', async () => {
    const mockAuthContextWithError = {
      ...mockAuthContext,
      lastError: {
        code: 'SESSION_EXPIRED',
        message: 'Session expired',
        userFriendlyMessage: 'Your learning time is up! Please log in again to continue. ⏰',
        shouldRedirect: true,
        severity: 'high',
        recoveryActions: []
      }
    };

    jest.mocked(require('../../../contexts/AuthContext').useAuth).mockReturnValue(mockAuthContextWithError);

    renderWithProviders(<ChildDashboard />);

    // Should show error display
    expect(screen.getByText('Oops! Something happened')).toBeInTheDocument();
    expect(screen.getByText('Your learning time is up! Please log in again to continue. ⏰')).toBeInTheDocument();
  });

  it('shows loading state when authentication is loading', async () => {
    const mockAuthContextLoading = {
      ...mockAuthContext,
      isLoading: true,
      isAuthenticated: false
    };

    jest.mocked(require('../../../contexts/AuthContext').useAuth).mockReturnValue(mockAuthContextLoading);

    renderWithProviders(<ChildDashboard />);

    // Should show loading state
    expect(screen.getByText('Checking your login...')).toBeInTheDocument();
  });
});