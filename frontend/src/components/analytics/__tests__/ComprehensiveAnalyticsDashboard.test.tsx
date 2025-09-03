import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ComprehensiveAnalyticsDashboard from '../ComprehensiveAnalyticsDashboard';
import { analyticsService } from '../../../services/analyticsService';

// Mock the analytics service
jest.mock('../../../services/analyticsService');
const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;

// Mock chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Radar: () => <div data-testid="radar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />
}));

const mockTheme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

const mockComprehensiveData = {
  overview: {
    timeFrame: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z'
    },
    detailedMetrics: {
      basic: {
        totalActivities: 50,
        completedActivities: 40,
        completionRate: 80,
        totalTimeSpent: 1200,
        averageSessionLength: 30
      },
      performance: {
        averageScore: 85,
        highestScore: 98,
        lowestScore: 65,
        scoreImprovement: 15,
        consistencyScore: 0.8
      },
      engagement: {
        streakDays: 7,
        totalSessions: 25,
        averageSessionsPerDay: 1.2,
        peakLearningHours: [14, 15, 16],
        subjectEngagement: {
          math: 0.9,
          science: 0.8,
          english: 0.7
        }
      }
    },
    learningVelocity: {
      velocity: 1.5,
      trend: 'increasing',
      weeklyProgress: [10, 15, 20, 25, 30],
      projectedCompletion: '2024-03-15T00:00:00.000Z'
    },
    engagementPatterns: {
      averageSessionLength: 30,
      peakLearningHours: [14, 15, 16],
      subjectEngagement: {
        math: 0.9,
        science: 0.8,
        english: 0.7
      },
      weeklyPattern: [0.8, 0.9, 0.85, 0.9, 0.95, 0.7, 0.6],
      motivationFactors: ['achievements', 'progress-tracking']
    },
    masteryIndicators: {
      overallMastery: 0.75,
      subjectMastery: {
        math: 0.85,
        science: 0.70,
        english: 0.65
      },
      skillProgression: [
        { skill: 'arithmetic', level: 0.9 },
        { skill: 'reading', level: 0.7 },
        { skill: 'writing', level: 0.6 }
      ],
      masteryTrends: {
        improving: ['math'],
        stable: ['science'],
        declining: []
      }
    },
    totalDataPoints: 150
  },
  subjectBreakdown: [
    {
      subjectId: 'subject-math',
      subjectName: 'Mathematics',
      overallProgress: 85,
      proficiencyLevel: 'advanced',
      topicsCompleted: 8,
      totalTopics: 10,
      averageScore: 88,
      timeSpent: 480,
      strengthAreas: ['arithmetic', 'algebra'],
      improvementAreas: ['geometry'],
      nextRecommendedTopics: ['fractions', 'decimals'],
      masteryTrend: 'improving'
    },
    {
      subjectId: 'subject-science',
      subjectName: 'Science',
      overallProgress: 70,
      proficiencyLevel: 'intermediate',
      topicsCompleted: 6,
      totalTopics: 10,
      averageScore: 82,
      timeSpent: 360,
      strengthAreas: ['biology'],
      improvementAreas: ['physics', 'chemistry'],
      nextRecommendedTopics: ['atoms', 'molecules'],
      masteryTrend: 'stable'
    }
  ],
  topicMastery: [
    {
      topicId: 'topic-addition',
      topicName: 'Addition',
      subjectId: 'subject-math',
      masteryLevel: 95,
      attemptsCount: 5,
      averageScore: 92,
      timeSpent: 120,
      lastActivity: new Date('2024-01-30'),
      status: { status: 'mastered' },
      difficultyProgression: [
        { attempt: 1, difficulty: 'beginner', score: 85 },
        { attempt: 2, difficulty: 'intermediate', score: 90 },
        { attempt: 3, difficulty: 'advanced', score: 95 }
      ],
      resourcesUsed: [
        { resourceId: 'video-1', type: 'video', timeSpent: 60 },
        { resourceId: 'worksheet-1', type: 'worksheet', timeSpent: 60 }
      ]
    }
  ],
  skillVisualization: {
    childId: 'child-123',
    overallLevel: 'intermediate',
    subjectProficiencies: [
      {
        subjectId: 'subject-math',
        subjectName: 'Mathematics',
        proficiencyLevel: 'advanced',
        proficiencyScore: 85,
        visualIndicator: {
          type: 'progress-bar',
          value: 85,
          maxValue: 100,
          color: '#4CAF50'
        },
        topicBreakdown: [
          { topicId: 'topic-addition', topicName: 'Addition', masteryLevel: 95, status: 'mastered' }
        ],
        trendDirection: 'up',
        confidenceLevel: 0.9
      }
    ],
    skillRadarChart: [
      { subject: 'Mathematics', proficiency: 85, fullMark: 100 },
      { subject: 'Science', proficiency: 70, fullMark: 100 }
    ],
    progressTimeline: [
      { date: '2024-01-01', overallProgress: 60, averageScore: 80 },
      { date: '2024-01-15', overallProgress: 70, averageScore: 83 },
      { date: '2024-01-30', overallProgress: 80, averageScore: 85 }
    ],
    achievementBadges: [
      {
        id: 'first-completion',
        title: 'First Steps',
        description: 'Completed first activity',
        icon: 'star',
        color: '#FFD700',
        earnedAt: new Date('2024-01-15'),
        category: 'completion',
        points: 10,
        rarity: 'common'
      }
    ],
    nextMilestones: [
      {
        id: 'math-mastery',
        title: 'Math Master',
        description: 'Complete all math topics',
        progress: 8,
        target: 10,
        estimatedCompletion: new Date('2024-02-15'),
        category: 'academic',
        isCompleted: false
      }
    ]
  },
  timeSeriesData: [
    { date: '2024-01-01', activitiesCompleted: 2, averageScore: 80, sessionTime: 45 },
    { date: '2024-01-02', activitiesCompleted: 3, averageScore: 85, sessionTime: 50 },
    { date: '2024-01-03', activitiesCompleted: 1, averageScore: 90, sessionTime: 30 }
  ],
  comparativeAnalysis: {
    periodComparison: {
      completionRate: { current: 80, previous: 70, change: 10 },
      averageScore: { current: 85, previous: 80, change: 5 },
      timeSpent: { current: 1200, previous: 1000, change: 200 },
      learningVelocity: { current: 1.5, previous: 1.2, change: 0.3 }
    },
    trends: {
      improving: 3,
      declining: 0,
      stable: 1
    },
    recommendations: [
      'Continue current learning pace',
      'Focus more on geometry topics',
      'Maintain consistent study schedule'
    ]
  }
};

describe('ComprehensiveAnalyticsDashboard', () => {
  const defaultProps = {
    childId: 'child-123',
    timeFrame: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.getComprehensiveDashboardData.mockResolvedValue(mockComprehensiveData);
  });

  describe('Basic Rendering', () => {
    it('renders dashboard with loading state initially', () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      expect(screen.getByText('Loading comprehensive analytics...')).toBeInTheDocument();
    });

    it('renders dashboard sections after loading', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Learning Overview')).toBeInTheDocument();
        expect(screen.getByText('Subject Performance')).toBeInTheDocument();
        expect(screen.getByText('Skill Proficiency')).toBeInTheDocument();
        expect(screen.getByText('Progress Timeline')).toBeInTheDocument();
      });
    });

    it('calls analytics service with correct parameters', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(mockAnalyticsService.getComprehensiveDashboardData).toHaveBeenCalledWith(
          'child-123',
          {
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-01-31T23:59:59.999Z'
          }
        );
      });
    });
  });

  describe('Overview Section', () => {
    it('displays key metrics from overview data', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('80%')).toBeInTheDocument(); // Completion rate
        expect(screen.getByText('85')).toBeInTheDocument(); // Average score
        expect(screen.getByText('40')).toBeInTheDocument(); // Completed activities
        expect(screen.getByText('50')).toBeInTheDocument(); // Total activities
      });
    });

    it('displays learning velocity information', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1.5')).toBeInTheDocument(); // Velocity
        expect(screen.getByText('increasing')).toBeInTheDocument(); // Trend
      });
    });

    it('shows engagement patterns', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('7 days')).toBeInTheDocument(); // Streak
        expect(screen.getByText('30 min')).toBeInTheDocument(); // Average session
      });
    });
  });

  describe('Subject Breakdown Section', () => {
    it('displays subject performance cards', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Mathematics')).toBeInTheDocument();
        expect(screen.getByText('Science')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument(); // Math progress
        expect(screen.getByText('70%')).toBeInTheDocument(); // Science progress
      });
    });

    it('shows proficiency levels', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('advanced')).toBeInTheDocument(); // Math proficiency
        expect(screen.getByText('intermediate')).toBeInTheDocument(); // Science proficiency
      });
    });

    it('displays topic completion ratios', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('8/10')).toBeInTheDocument(); // Math topics
        expect(screen.getByText('6/10')).toBeInTheDocument(); // Science topics
      });
    });

    it('shows strength and improvement areas', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('arithmetic')).toBeInTheDocument();
        expect(screen.getByText('algebra')).toBeInTheDocument();
        expect(screen.getByText('geometry')).toBeInTheDocument();
      });
    });
  });

  describe('Skill Visualization Section', () => {
    it('renders radar chart for skill proficiency', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('displays overall proficiency level', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('intermediate')).toBeInTheDocument(); // Overall level
      });
    });

    it('shows achievement badges', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
        expect(screen.getByText('Completed first activity')).toBeInTheDocument();
      });
    });

    it('displays next milestones', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Math Master')).toBeInTheDocument();
        expect(screen.getByText('Complete all math topics')).toBeInTheDocument();
        expect(screen.getByText('8/10')).toBeInTheDocument(); // Progress
      });
    });
  });

  describe('Progress Timeline Section', () => {
    it('renders timeline chart', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('shows progress data points', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        // Timeline data should be rendered in the chart
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Topic Mastery Section', () => {
    it('displays topic mastery details', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Addition')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument(); // Mastery level
        expect(screen.getByText('mastered')).toBeInTheDocument(); // Status
      });
    });

    it('shows attempt count and average score', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('5 attempts')).toBeInTheDocument();
        expect(screen.getByText('92 avg')).toBeInTheDocument();
      });
    });

    it('displays time spent on topics', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('120 min')).toBeInTheDocument();
      });
    });
  });

  describe('Comparative Analysis Section', () => {
    it('shows period-over-period comparisons', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+10%')).toBeInTheDocument(); // Completion rate change
        expect(screen.getByText('+5')).toBeInTheDocument(); // Score change
        expect(screen.getByText('+200 min')).toBeInTheDocument(); // Time change
      });
    });

    it('displays trend indicators', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('3 improving')).toBeInTheDocument();
        expect(screen.getByText('0 declining')).toBeInTheDocument();
        expect(screen.getByText('1 stable')).toBeInTheDocument();
      });
    });

    it('shows recommendations', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Continue current learning pace')).toBeInTheDocument();
        expect(screen.getByText('Focus more on geometry topics')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockAnalyticsService.getComprehensiveDashboardData.mockRejectedValue(
        new Error('Failed to load analytics data')
      );

      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Error loading analytics data')).toBeInTheDocument();
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockAnalyticsService.getComprehensiveDashboardData.mockRejectedValue(
        new Error('Network error')
      );

      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders charts in responsive containers', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        const responsiveContainers = screen.getAllByTestId('responsive-container');
        expect(responsiveContainers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Refresh', () => {
    it('refetches data when childId changes', async () => {
      const { rerender } = renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(mockAnalyticsService.getComprehensiveDashboardData).toHaveBeenCalledTimes(1);
      });

      // Change childId
      rerender(
        <ThemeProvider theme={mockTheme}>
          <ComprehensiveAnalyticsDashboard {...defaultProps} childId="child-456" />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(mockAnalyticsService.getComprehensiveDashboardData).toHaveBeenCalledTimes(2);
        expect(mockAnalyticsService.getComprehensiveDashboardData).toHaveBeenLastCalledWith(
          'child-456',
          expect.any(Object)
        );
      });
    });

    it('refetches data when timeFrame changes', async () => {
      const { rerender } = renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(mockAnalyticsService.getComprehensiveDashboardData).toHaveBeenCalledTimes(1);
      });

      // Change timeFrame
      const newTimeFrame = {
        start: '2024-02-01T00:00:00.000Z',
        end: '2024-02-28T23:59:59.999Z'
      };

      rerender(
        <ThemeProvider theme={mockTheme}>
          <ComprehensiveAnalyticsDashboard {...defaultProps} timeFrame={newTimeFrame} />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(mockAnalyticsService.getComprehensiveDashboardData).toHaveBeenCalledTimes(2);
        expect(mockAnalyticsService.getComprehensiveDashboardData).toHaveBeenLastCalledWith(
          'child-123',
          newTimeFrame
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Learning Overview' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Subject Performance' })).toBeInTheDocument();
      });
    });

    it('provides ARIA labels for charts', async () => {
      renderWithTheme(<ComprehensiveAnalyticsDashboard {...defaultProps} />);

      await waitFor(() => {
        const charts = screen.getAllByTestId('responsive-container');
        charts.forEach(chart => {
          expect(chart).toHaveAttribute('role', 'img');
        });
      });
    });
  });
});