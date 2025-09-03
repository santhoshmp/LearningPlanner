import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { ProgressVisualization } from '../ProgressVisualization';
import { childTheme } from '../../../theme/childTheme';

const mockProgressData = {
  totalActivities: 20,
  completedActivities: 12,
  inProgressActivities: 3,
  averageScore: 85,
  timeSpent: 1800, // 30 minutes
  subjectProgress: [
    {
      subject: 'Math',
      completed: 8,
      total: 10,
      averageScore: 90,
      color: '#FF6B6B'
    },
    {
      subject: 'Reading',
      completed: 4,
      total: 6,
      averageScore: 88,
      color: '#4ECDC4'
    },
    {
      subject: 'Science',
      completed: 0,
      total: 4,
      averageScore: 0,
      color: '#45B7D1'
    }
  ],
  weeklyProgress: [
    { day: 'Mon', completed: 2, timeSpent: 300 },
    { day: 'Tue', completed: 1, timeSpent: 150 },
    { day: 'Wed', completed: 3, timeSpent: 450 },
    { day: 'Thu', completed: 2, timeSpent: 300 },
    { day: 'Fri', completed: 4, timeSpent: 600 },
    { day: 'Sat', completed: 0, timeSpent: 0 },
    { day: 'Sun', completed: 0, timeSpent: 0 }
  ]
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={childTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('ProgressVisualization', () => {
  it('should render overall progress with child-friendly design', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    // Overall progress section
    expect(screen.getByText('Your Learning Progress')).toBeInTheDocument();
    expect(screen.getByText('12 out of 20 activities completed')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument(); // 12/20 = 60%

    // Should show encouraging message
    expect(screen.getByText(/Great job! You're more than halfway there!/i)).toBeInTheDocument();
  });

  it('should display subject progress with colorful bars', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    // Subject progress section
    expect(screen.getByText('Progress by Subject')).toBeInTheDocument();
    
    // Math progress
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();

    // Reading progress
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('4 / 6')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();

    // Science progress (not started)
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('0 / 4')).toBeInTheDocument();
    expect(screen.getByText('Ready to start!')).toBeInTheDocument();
  });

  it('should show weekly progress chart', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    expect(screen.getByText('This Week\'s Learning')).toBeInTheDocument();
    
    // Should show days of the week
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();

    // Should show activity counts
    expect(screen.getByTestId('weekly-chart')).toBeInTheDocument();
  });

  it('should display time spent statistics', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    expect(screen.getByText('Time Spent Learning')).toBeInTheDocument();
    expect(screen.getByText('30 minutes')).toBeInTheDocument(); // 1800 seconds = 30 minutes
  });

  it('should show average score with visual indicator', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    
    // Should show appropriate emoji/icon for score
    expect(screen.getByText('⭐')).toBeInTheDocument(); // Good score indicator
  });

  it('should handle empty progress data', () => {
    const emptyData = {
      totalActivities: 0,
      completedActivities: 0,
      inProgressActivities: 0,
      averageScore: 0,
      timeSpent: 0,
      subjectProgress: [],
      weeklyProgress: []
    };

    renderWithTheme(<ProgressVisualization data={emptyData} />);

    expect(screen.getByText(/Ready to start your learning journey?/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete your first activity to see your progress!/i)).toBeInTheDocument();
  });

  it('should show different encouragement messages based on progress', () => {
    // High progress
    const highProgressData = {
      ...mockProgressData,
      completedActivities: 18,
      totalActivities: 20
    };

    const { rerender } = renderWithTheme(<ProgressVisualization data={highProgressData} />);
    expect(screen.getByText(/Amazing! You're almost done!/i)).toBeInTheDocument();

    // Low progress
    const lowProgressData = {
      ...mockProgressData,
      completedActivities: 2,
      totalActivities: 20
    };

    rerender(
      <ThemeProvider theme={childTheme}>
        <ProgressVisualization data={lowProgressData} />
      </ThemeProvider>
    );
    expect(screen.getByText(/You're just getting started! Keep going!/i)).toBeInTheDocument();
  });

  it('should be interactive with hover effects', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    const mathProgressBar = screen.getByTestId('progress-bar-math');
    
    // Hover should show tooltip
    fireEvent.mouseEnter(mathProgressBar);
    expect(screen.getByText('Math: 8 out of 10 activities completed')).toBeInTheDocument();
    expect(screen.getByText('Average score: 90%')).toBeInTheDocument();

    fireEvent.mouseLeave(mathProgressBar);
  });

  it('should support different view modes', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} viewMode="detailed" />);

    // Detailed view should show more information
    expect(screen.getByText('Detailed Progress View')).toBeInTheDocument();
    expect(screen.getByTestId('detailed-stats')).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    // Progress bars should have proper ARIA attributes
    const mathProgressBar = screen.getByTestId('progress-bar-math');
    expect(mathProgressBar).toHaveAttribute('role', 'progressbar');
    expect(mathProgressBar).toHaveAttribute('aria-valuenow', '80');
    expect(mathProgressBar).toHaveAttribute('aria-valuemax', '100');
    expect(mathProgressBar).toHaveAttribute('aria-label', 'Math progress: 80%');

    // Charts should have descriptions
    expect(screen.getByTestId('weekly-chart')).toHaveAttribute('aria-label', 'Weekly learning progress chart');
  });

  it('should animate progress bars on load', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    // Progress bars should have animation classes
    expect(screen.getByTestId('progress-bar-math')).toHaveClass('animate-progress');
    expect(screen.getByTestId('progress-bar-reading')).toHaveClass('animate-progress');
  });

  it('should show milestone celebrations', () => {
    const milestoneData = {
      ...mockProgressData,
      completedActivities: 10, // Milestone at 10 activities
      totalActivities: 20
    };

    renderWithTheme(<ProgressVisualization data={milestoneData} showMilestones={true} />);

    expect(screen.getByTestId('milestone-celebration')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('Milestone Reached!')).toBeInTheDocument();
    expect(screen.getByText('You completed 10 activities!')).toBeInTheDocument();
  });

  it('should handle very high scores with special recognition', () => {
    const perfectScoreData = {
      ...mockProgressData,
      averageScore: 100,
      subjectProgress: mockProgressData.subjectProgress.map(subject => ({
        ...subject,
        averageScore: 100
      }))
    };

    renderWithTheme(<ProgressVisualization data={perfectScoreData} />);

    expect(screen.getByText('Perfect Score!')).toBeInTheDocument();
    expect(screen.getByText('💯')).toBeInTheDocument();
    expect(screen.getByText(/You're a learning superstar!/i)).toBeInTheDocument();
  });

  it('should show next goal information', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} showNextGoal={true} />);

    expect(screen.getByText('Next Goal')).toBeInTheDocument();
    expect(screen.getByText('Complete 8 more activities')).toBeInTheDocument();
    expect(screen.getByText('to finish your study plan!')).toBeInTheDocument();
  });

  it('should support keyboard navigation for interactive elements', () => {
    renderWithTheme(<ProgressVisualization data={mockProgressData} />);

    const mathProgressBar = screen.getByTestId('progress-bar-math');
    
    // Should be focusable
    mathProgressBar.focus();
    expect(mathProgressBar).toHaveFocus();

    // Should show details on focus
    expect(screen.getByText('Math: 8 out of 10 activities completed')).toBeInTheDocument();
  });

  it('should format time display appropriately for children', () => {
    const timeTestData = {
      ...mockProgressData,
      timeSpent: 3665 // 1 hour, 1 minute, 5 seconds
    };

    renderWithTheme(<ProgressVisualization data={timeTestData} />);

    // Should show child-friendly time format
    expect(screen.getByText('1 hour and 1 minute')).toBeInTheDocument();
    // Should not show seconds for simplicity
    expect(screen.queryByText('5 seconds')).not.toBeInTheDocument();
  });
});