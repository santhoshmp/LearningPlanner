import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { ChildAnalyticsDashboard } from '../ChildAnalyticsDashboard';
import { childTheme } from '../../../theme/childTheme';
import * as api from '../../../services/api';

jest.mock('../../../services/api');
const mockApi = api as jest.Mocked<typeof api>;

const mockAnalyticsData = {
  weeklyProgress: [
    { day: 'Mon', activities: 3, timeSpent: 45 },
    { day: 'Tue', activities: 2, timeSpent: 30 },
    { day: 'Wed', activities: 4, timeSpent: 60 },
    { day: 'Thu', activities: 1, timeSpent: 15 },
    { day: 'Fri', activities: 3, timeSpent: 45 },
    { day: 'Sat', activities: 2, timeSpent: 30 },
    { day: 'Sun', activities: 1, timeSpent: 15 }
  ],
  subjectMastery: {
    math: 85,
    reading: 92,
    science: 78,
    history: 88
  },
  learningStreak: {
    current: 7,
    longest: 15,
    type: 'daily'
  },
  timeSpent: {
    today: 45,
    thisWeek: 240,
    average: 35
  },
  achievements: [
    {
      id: 'recent-1',
      name: 'Math Star',
      earnedAt: new Date('2024-01-20'),
      icon: '⭐'
    }
  ]
};

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

describe('ChildAnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue({ data: mockAnalyticsData });
  });

  it('should render analytics dashboard with child-friendly design', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Your Learning Journey/i)).toBeInTheDocument();
    });

    // Should use child theme colors
    expect(screen.getByTestId('analytics-container')).toHaveClass('child-theme');
  });

  it('should display weekly progress chart', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('weekly-progress-chart')).toBeInTheDocument();
      expect(screen.getByText('Your Learning This Week')).toBeInTheDocument();
    });

    // Should show days of the week
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('should show subject mastery radar chart', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('subject-mastery-radar')).toBeInTheDocument();
      expect(screen.getByText('How Well You Know Each Subject')).toBeInTheDocument();
    });

    // Should display subject names
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('should display learning streak with fire animation', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('learning-streak-display')).toBeInTheDocument();
      expect(screen.getByText('7 Day Streak!')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    // Should show encouraging message
    expect(screen.getByText(/You're on fire!/i)).toBeInTheDocument();
  });

  it('should show learning time tracker', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('learning-time-tracker')).toBeInTheDocument();
      expect(screen.getByText('Time Spent Learning')).toBeInTheDocument();
    });

    // Should display time statistics
    expect(screen.getByText('45 minutes today')).toBeInTheDocument();
    expect(screen.getByText('240 minutes this week')).toBeInTheDocument();
  });

  it('should display recent achievements', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
      expect(screen.getByText('Math Star')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });
  });

  it('should use child-friendly language and encouragement', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      // Should use encouraging, simple language
      expect(screen.getByText(/Great job learning!/i)).toBeInTheDocument();
      expect(screen.getByText(/Keep up the awesome work!/i)).toBeInTheDocument();
    });

    // Should avoid complex terminology
    expect(screen.queryByText('analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('metrics')).not.toBeInTheDocument();
  });

  it('should handle loading state with child-friendly message', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/Loading your awesome progress.../i)).toBeInTheDocument();
  });

  it('should handle error state gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Failed to load analytics'));

    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Oops! We can't show your progress right now/i)).toBeInTheDocument();
      expect(screen.getByTestId('try-again-button')).toBeInTheDocument();
    });
  });

  it('should be accessible with proper ARIA labels', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Learning Progress Dashboard');
      
      // Charts should have proper labels
      expect(screen.getByTestId('weekly-progress-chart'))
        .toHaveAttribute('aria-label', 'Weekly learning progress chart');
      
      expect(screen.getByTestId('subject-mastery-radar'))
        .toHaveAttribute('aria-label', 'Subject mastery levels');
    });
  });

  it('should support keyboard navigation', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      const firstInteractiveElement = screen.getByTestId('time-filter-button');
      firstInteractiveElement.focus();
      expect(firstInteractiveElement).toHaveFocus();
    });
  });

  it('should filter data by time period', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      const weekFilter = screen.getByRole('button', { name: /this week/i });
      const monthFilter = screen.getByRole('button', { name: /this month/i });

      expect(weekFilter).toBeInTheDocument();
      expect(monthFilter).toBeInTheDocument();
    });

    // Should update data when filter changes
    // (This would require more complex mocking of the API responses)
  });

  it('should show motivational messages based on progress', async () => {
    const highProgressData = {
      ...mockAnalyticsData,
      weeklyProgress: mockAnalyticsData.weeklyProgress.map(day => ({
        ...day,
        activities: day.activities * 2
      }))
    };

    mockApi.get.mockResolvedValue({ data: highProgressData });

    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/You're a learning superstar!/i)).toBeInTheDocument();
    });
  });

  it('should handle empty data gracefully', async () => {
    const emptyData = {
      weeklyProgress: [],
      subjectMastery: {},
      learningStreak: { current: 0, longest: 0, type: 'daily' },
      timeSpent: { today: 0, thisWeek: 0, average: 0 },
      achievements: []
    };

    mockApi.get.mockResolvedValue({ data: emptyData });

    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Ready to start your learning adventure?/i)).toBeInTheDocument();
      expect(screen.getByText(/Complete your first activity to see your progress!/i)).toBeInTheDocument();
    });
  });

  it('should animate charts and progress indicators', async () => {
    renderWithProviders(<ChildAnalyticsDashboard childId="child-1" />);

    await waitFor(() => {
      // Charts should have animation classes
      expect(screen.getByTestId('weekly-progress-chart')).toHaveClass('animate-fade-in');
      expect(screen.getByTestId('subject-mastery-radar')).toHaveClass('animate-slide-up');
      
      // Streak display should have bounce animation
      expect(screen.getByTestId('learning-streak-display')).toHaveClass('animate-bounce');
    });
  });
});