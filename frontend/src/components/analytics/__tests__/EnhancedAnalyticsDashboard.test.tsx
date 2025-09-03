import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import EnhancedAnalyticsDashboard from '../EnhancedAnalyticsDashboard';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
}));

// Mock the API service
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Line Chart
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Bar Chart
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Doughnut Chart
    </div>
  ),
}));

const mockApi = require('../../../services/api');

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const theme = createTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('EnhancedAnalyticsDashboard', () => {
  const mockChild = {
    id: 'child-123',
    firstName: 'Alice',
    lastName: 'Doe',
    age: 10,
    gradeLevel: '5th Grade',
  };

  const mockAnalyticsData = {
    childInfo: mockChild,
    timeRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    },
    overallProgress: {
      totalActivitiesCompleted: 45,
      averageScore: 85.5,
      totalTimeSpent: 1800, // 30 hours in minutes
      completionRate: 0.9,
      improvementRate: 0.15,
    },
    subjectBreakdown: [
      {
        subject: 'Mathematics',
        activitiesCompleted: 20,
        averageScore: 88,
        timeSpent: 800,
        progressTrend: 'improving',
      },
      {
        subject: 'Science',
        activitiesCompleted: 15,
        averageScore: 82,
        timeSpent: 600,
        progressTrend: 'stable',
      },
      {
        subject: 'English',
        activitiesCompleted: 10,
        averageScore: 87,
        timeSpent: 400,
        progressTrend: 'declining',
      },
    ],
    learningPatterns: {
      preferredContentTypes: ['video', 'interactive'],
      peakLearningHours: [16, 17, 18], // 4-6 PM
      averageSessionDuration: 25,
      consistencyScore: 0.85,
      learningVelocity: 1.2,
    },
    contentInteractions: [
      {
        id: 'interaction-1',
        contentType: 'video',
        interactionType: 'view',
        duration: 300,
        progressPercentage: 100,
        timestamp: '2024-01-15T16:30:00Z',
      },
      {
        id: 'interaction-2',
        contentType: 'interactive',
        interactionType: 'complete',
        duration: 600,
        progressPercentage: 100,
        timestamp: '2024-01-16T17:00:00Z',
      },
    ],
    insights: [
      {
        id: 'insight-1',
        type: 'performance_trend',
        title: 'Improving Mathematics Performance',
        description: 'Alice shows consistent improvement in mathematics over the past month.',
        confidence: 0.85,
        actionable: true,
        recommendations: ['Continue current study plan', 'Consider advancing to harder topics'],
      },
      {
        id: 'insight-2',
        type: 'learning_pattern',
        title: 'Optimal Learning Time Identified',
        description: 'Alice performs best during afternoon hours (4-6 PM).',
        confidence: 0.92,
        actionable: true,
        recommendations: ['Schedule challenging activities during peak hours'],
      },
    ],
    recommendations: [
      {
        id: 'rec-1',
        type: 'content',
        title: 'Advanced Math Topics',
        description: 'Based on strong performance, consider introducing algebra concepts.',
        priority: 'high',
      },
      {
        id: 'rec-2',
        type: 'schedule',
        title: 'Optimize Study Schedule',
        description: 'Focus difficult subjects during 4-6 PM when performance peaks.',
        priority: 'medium',
      },
    ],
  };

  const mockPerformancePredictions = [
    {
      id: 'pred-1',
      subject: 'Mathematics',
      predictedScore: 92,
      confidence: 0.88,
      timeframe: '1_week',
      factors: ['consistent_improvement', 'good_completion_rate'],
      recommendations: ['Continue current pace', 'Consider advancing difficulty'],
    },
    {
      id: 'pred-2',
      subject: 'Science',
      predictedScore: 85,
      confidence: 0.75,
      timeframe: '1_week',
      factors: ['stable_performance', 'moderate_engagement'],
      recommendations: ['Introduce more interactive content', 'Vary content types'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    mockApi.get.mockImplementation((url) => {
      if (url.includes('/analytics/detailed')) {
        return Promise.resolve({ data: mockAnalyticsData });
      }
      if (url.includes('/analytics/predictions')) {
        return Promise.resolve({ data: mockPerformancePredictions });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render analytics dashboard with child information', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Doe')).toBeInTheDocument();
      expect(screen.getByText('5th Grade')).toBeInTheDocument();
      expect(screen.getByText('Age 10')).toBeInTheDocument();
    });
  });

  it('should display overall progress metrics', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument(); // Total activities
      expect(screen.getByText('85.5%')).toBeInTheDocument(); // Average score
      expect(screen.getByText('30h')).toBeInTheDocument(); // Total time (1800 minutes = 30 hours)
      expect(screen.getByText('90%')).toBeInTheDocument(); // Completion rate
    });
  });

  it('should show subject breakdown with progress trends', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    // Check for trend indicators
    expect(screen.getByText('88%')).toBeInTheDocument(); // Math average score
    expect(screen.getByText('82%')).toBeInTheDocument(); // Science average score
    expect(screen.getByText('87%')).toBeInTheDocument(); // English average score
  });

  it('should display learning patterns insights', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Learning Patterns')).toBeInTheDocument();
      expect(screen.getByText('25 min')).toBeInTheDocument(); // Average session duration
      expect(screen.getByText('85%')).toBeInTheDocument(); // Consistency score
    });

    // Check for preferred content types
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Interactive')).toBeInTheDocument();
  });

  it('should show AI-generated insights', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
      expect(screen.getByText('Improving Mathematics Performance')).toBeInTheDocument();
      expect(screen.getByText('Optimal Learning Time Identified')).toBeInTheDocument();
    });

    // Check confidence scores
    expect(screen.getByText('85% confidence')).toBeInTheDocument();
    expect(screen.getByText('92% confidence')).toBeInTheDocument();
  });

  it('should display performance predictions', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Performance Predictions')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument(); // Math prediction
      expect(screen.getByText('85%')).toBeInTheDocument(); // Science prediction
    });
  });

  it('should handle time range selection', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    });

    // Change time range
    const timeRangeSelect = screen.getByLabelText(/time range/i);
    fireEvent.change(timeRangeSelect, { target: { value: '7_days' } });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('timeRange=7_days')
      );
    });
  });

  it('should filter by subjects', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('All Subjects')).toBeInTheDocument();
    });

    // Select specific subject
    const subjectFilter = screen.getByLabelText(/subject filter/i);
    fireEvent.change(subjectFilter, { target: { value: 'Mathematics' } });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('subjects=Mathematics')
      );
    });
  });

  it('should render interactive charts', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument(); // Progress trend
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument(); // Subject performance
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument(); // Content type distribution
    });
  });

  it('should handle export functionality', async () => {
    const mockExportData = {
      format: 'pdf',
      data: 'mock-pdf-data',
      filename: 'analytics_child-123_2024-01-01.pdf'
    };

    mockApi.post.mockResolvedValue({ data: mockExportData });

    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    // Should show export options
    await waitFor(() => {
      expect(screen.getByText('PDF Report')).toBeInTheDocument();
      expect(screen.getByText('CSV Data')).toBeInTheDocument();
      expect(screen.getByText('JSON Data')).toBeInTheDocument();
    });

    // Select PDF export
    const pdfOption = screen.getByText('PDF Report');
    fireEvent.click(pdfOption);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/analytics/export', {
        childId: 'child-123',
        format: 'pdf',
        includeCharts: true,
        timeRange: expect.any(Object),
      });
    });
  });

  it('should show loading state', () => {
    // Mock delayed response
    mockApi.get.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: mockAnalyticsData }), 100)
      )
    );

    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    const apiError = new Error('Failed to fetch analytics data');
    mockApi.get.mockRejectedValue(apiError);

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load analytics data. Please try again.');
    });

    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', async () => {
    const emptyData = {
      ...mockAnalyticsData,
      overallProgress: {
        totalActivitiesCompleted: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        completionRate: 0,
        improvementRate: 0,
      },
      subjectBreakdown: [],
      insights: [],
      recommendations: [],
    };

    mockApi.get.mockResolvedValue({ data: emptyData });

    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No activity data available')).toBeInTheDocument();
      expect(screen.getByText('Start learning to see analytics')).toBeInTheDocument();
    });
  });

  it('should refresh data automatically', async () => {
    jest.useFakeTimers();

    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" autoRefresh={true} refreshInterval={30000} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledTimes(2); // Initial load + predictions
    });

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledTimes(4); // Should refresh both endpoints
    });

    jest.useRealTimers();
  });

  it('should be accessible with proper ARIA labels', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Analytics Dashboard');
      expect(screen.getByRole('region', { name: /overall progress/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /subject breakdown/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /learning patterns/i })).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation', async () => {
    render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/time range/i)).toBeInTheDocument();
    });

    const timeRangeSelect = screen.getByLabelText(/time range/i);
    const subjectFilter = screen.getByLabelText(/subject filter/i);

    // Focus first control
    timeRangeSelect.focus();
    expect(document.activeElement).toBe(timeRangeSelect);

    // Tab to next control
    fireEvent.keyDown(timeRangeSelect, { key: 'Tab' });
    subjectFilter.focus();
    expect(document.activeElement).toBe(subjectFilter);
  });

  it('should handle real-time updates', async () => {
    const { rerender } = render(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" realTimeUpdates={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument(); // Initial activities count
    });

    // Mock updated data
    const updatedData = {
      ...mockAnalyticsData,
      overallProgress: {
        ...mockAnalyticsData.overallProgress,
        totalActivitiesCompleted: 46,
      },
    };

    mockApi.get.mockResolvedValueOnce({ data: updatedData });

    // Simulate real-time update
    rerender(
      <TestWrapper>
        <EnhancedAnalyticsDashboard childId="child-123" realTimeUpdates={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('46')).toBeInTheDocument(); // Updated activities count
    });
  });
});