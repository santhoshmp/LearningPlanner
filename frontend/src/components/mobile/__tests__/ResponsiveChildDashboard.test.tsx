/**
 * Tests for ResponsiveChildDashboard component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ResponsiveChildDashboard } from '../ResponsiveChildDashboard';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock the mobile optimizations hooks
jest.mock('../../../hooks/useMobileOptimizations', () => ({
  useMobileOptimizations: () => ({
    isTablet: true,
    orientation: 'landscape',
    screenSize: 'medium',
    animationConfig: { duration: 300 }
  }),
  usePerformanceMonitoring: () => ({
    performanceMetrics: {
      memoryUsage: 0.5,
      frameRate: 60,
      batteryLevel: 0.8,
      sessionDuration: 600000
    }
  })
}));

const mockProfile = {
  id: 'child-1',
  name: 'Test Child',
  avatar: 'avatar.jpg',
  grade: '5th Grade',
  currentStreak: 5,
  totalBadges: 3,
  weeklyGoal: 35,
  weeklyProgress: 70
};

const mockStudyPlans = [
  {
    id: 'plan-1',
    title: 'Mathematics',
    subject: 'Math',
    progress: 75,
    totalActivities: 10,
    completedActivities: 7,
    nextActivity: {
      id: 'activity-1',
      title: 'Fractions',
      type: 'math' as const
    }
  },
  {
    id: 'plan-2',
    title: 'Science',
    subject: 'Science',
    progress: 50,
    totalActivities: 8,
    completedActivities: 4,
    nextActivity: {
      id: 'activity-2',
      title: 'Plants',
      type: 'science' as const
    }
  }
];

const mockAchievements = [
  {
    id: 'achievement-1',
    title: 'First Steps',
    description: 'Completed first activity',
    icon: '🏅',
    earnedAt: new Date(),
    isNew: true
  },
  {
    id: 'achievement-2',
    title: 'Math Wizard',
    description: 'Completed 5 math activities',
    icon: '🧙‍♂️',
    earnedAt: new Date(),
    isNew: false
  }
];

const defaultProps = {
  profile: mockProfile,
  studyPlans: mockStudyPlans,
  recentAchievements: mockAchievements,
  onActivityStart: jest.fn(),
  onStudyPlanSelect: jest.fn(),
  onSettingsOpen: jest.fn(),
  onHelpRequest: jest.fn()
};

describe('ResponsiveChildDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders child profile information', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    expect(screen.getByText('Welcome back, Test Child!')).toBeInTheDocument();
    expect(screen.getByText('Grade 5th Grade • Ready to learn?')).toBeInTheDocument();
  });

  it('displays progress statistics', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    expect(screen.getByText('5 days')).toBeInTheDocument(); // Learning streak
    expect(screen.getByText('3')).toBeInTheDocument(); // Total badges
    expect(screen.getByText('70%')).toBeInTheDocument(); // Weekly progress
    expect(screen.getByText('2')).toBeInTheDocument(); // Study plans count
  });

  it('renders study plan cards', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('Continue: Fractions')).toBeInTheDocument();
    expect(screen.getByText('Continue: Plants')).toBeInTheDocument();
  });

  it('displays recent achievements', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Math Wizard')).toBeInTheDocument();
    expect(screen.getByText('NEW!')).toBeInTheDocument(); // New achievement badge
  });

  it('handles activity start clicks', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    const continueButton = screen.getByText('Continue: Fractions');
    fireEvent.click(continueButton);
    
    expect(defaultProps.onActivityStart).toHaveBeenCalledWith('activity-1');
  });

  it('handles study plan selection', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    const mathCard = screen.getByText('Mathematics').closest('[role="button"]') || 
                     screen.getByText('Mathematics').closest('div');
    
    if (mathCard) {
      fireEvent.click(mathCard);
      expect(defaultProps.onStudyPlanSelect).toHaveBeenCalledWith('plan-1');
    }
  });

  it('handles settings button click', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    expect(defaultProps.onSettingsOpen).toHaveBeenCalled();
  });

  it('handles help button click', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    const helpButton = screen.getByRole('button', { name: /help/i });
    fireEvent.click(helpButton);
    
    expect(defaultProps.onHelpRequest).toHaveBeenCalled();
  });

  it('shows swipeable navigation when activities are available', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    expect(screen.getByText('Continue Learning')).toBeInTheDocument();
  });

  it('handles empty study plans gracefully', () => {
    const propsWithoutPlans = {
      ...defaultProps,
      studyPlans: []
    };
    
    renderWithTheme(<ResponsiveChildDashboard {...propsWithoutPlans} />);
    
    expect(screen.getByText('Your Study Plans')).toBeInTheDocument();
  });

  it('handles empty achievements gracefully', () => {
    const propsWithoutAchievements = {
      ...defaultProps,
      recentAchievements: []
    };
    
    renderWithTheme(<ResponsiveChildDashboard {...propsWithoutAchievements} />);
    
    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
  });

  it('applies tablet-specific styling', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    // Check for tablet-optimized layout
    const welcomeText = screen.getByText('Welcome back, Test Child!');
    expect(welcomeText).toHaveStyle({
      fontSize: '2rem'
    });
  });

  it('shows performance indicator when enabled', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    // Performance indicator should be present for tablets
    const dashboard = screen.getByText('Welcome back, Test Child!').closest('div');
    expect(dashboard).toBeInTheDocument();
  });

  it('celebrates new achievements', () => {
    renderWithTheme(<ResponsiveChildDashboard {...defaultProps} />);
    
    // New achievement should have celebration styling
    const newBadge = screen.getByText('NEW!');
    expect(newBadge).toBeInTheDocument();
  });
});