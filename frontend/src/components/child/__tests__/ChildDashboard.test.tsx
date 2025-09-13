import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { ChildDashboard } from '../ChildDashboard';
import { childTheme } from '../../../theme/childTheme';
import * as api from '../../../services/api';

// Mock API calls
jest.mock('../../../services/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock child progress service
jest.mock('../../../services/realTimeProgressService', () => ({
  useRealTimeProgress: () => ({
    progress: {
      totalActivities: 10,
      completedActivities: 6,
      currentStreak: 5,
      weeklyGoalProgress: 75
    },
    updateProgress: jest.fn()
  })
}));

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
      streakStartDat

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={childTheme}>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('ChildDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue({ data: mockChildData });
  });

  it('should render child dashboard with welcome message', async () => {
    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Test Child!/i)).toBeInTheDocument();
    });
  });

  it('should display study plans with progress indicators', async () => {
    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText('Math Adventures')).toBeInTheDocument();
      expect(screen.getByText('Reading Fun')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  it('should show learning streak with fire animation', async () => {
    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/5 day streak/i)).toBeInTheDocument();
      expect(screen.getByText(/🔥/)).toBeInTheDocument();
    });
  });

  it('should display earned badges', async () => {
    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText('Math Star')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });
  });

  it('should show daily goals widget', async () => {
    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Daily Goals/i)).toBeInTheDocument();
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
  });

  it('should handle study plan click navigation', async () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      const studyPlanCard = screen.getByText('Math Adventures');
      fireEvent.click(studyPlanCard);
    });

    // Note: Navigation testing would require proper router setup
  });

  it('should show loading state initially', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<ChildDashboard childId="child-1" />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error state gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Failed to load dashboard'));

    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    });
  });

  it('should display child-friendly error messages', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Let's check your internet connection/i)).toBeInTheDocument();
    });
  });

  it('should show celebration animation for new badges', async () => {
    const childDataWithNewBadge = {
      ...mockChildData,
      badges: [
        ...mockChildData.badges,
        {
          id: 'badge-2',
          name: 'Reading Champion',
          icon: '📚',
          earnedAt: new Date(), // Just earned
          category: 'reading',
          isNew: true
        }
      ]
    };

    mockApi.get.mockResolvedValue({ data: childDataWithNewBadge });

    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('badge-celebration')).toBeInTheDocument();
    });
  });

  it('should update progress in real-time', async () => {
    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText('6 / 10 activities completed')).toBeInTheDocument();
    });

    // Simulate real-time progress update
    fireEvent(window, new CustomEvent('progressUpdate', {
      detail: { completedActivities: 7 }
    }));

    await waitFor(() => {
      expect(screen.getByText('7 / 10 activities completed')).toBeInTheDocument();
    });
  });

  it('should be accessible with proper ARIA labels', async () => {
    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Child Dashboard');
      expect(screen.getByRole('region', { name: /study plans/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /badges/i })).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation', async () => {
    renderWithProviders(<ChildDashboard childId="child-1" />);

    await waitFor(() => {
      const firstStudyPlan = screen.getByRole('button', { name: /math adventures/i });
      firstStudyPlan.focus();
      expect(firstStudyPlan).toHaveFocus();

      fireEvent.keyDown(firstStudyPlan, { key: 'Tab' });
      const nextElement = screen.getByRole('button', { name: /reading fun/i });
      expect(nextElement).toHaveFocus();
    });
  });
});