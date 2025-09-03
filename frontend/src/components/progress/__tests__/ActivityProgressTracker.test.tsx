import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityProgressTracker from '../ActivityProgressTracker';

const theme = createTheme();

const defaultProps = {
  activityId: 'test-activity',
  activityTitle: 'Test Activity',
  currentProgress: 50,
  totalSteps: 10,
  currentStep: 5,
  isActive: false,
  onProgressUpdate: jest.fn(),
  onComplete: jest.fn(),
  onPause: jest.fn(),
  onResume: jest.fn(),
  onHelpRequest: jest.fn(),
  timeSpent: 600 // 10 minutes
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ActivityProgressTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders activity title and progress', () => {
    renderWithTheme(<ActivityProgressTracker {...defaultProps} />);
    
    expect(screen.getByText('Test Activity')).toBeInTheDocument();
    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('displays time spent correctly', () => {
    renderWithTheme(<ActivityProgressTracker {...defaultProps} />);
    
    expect(screen.getByText(/Time: 10:00/)).toBeInTheDocument();
  });

  it('shows estimated time remaining when provided', () => {
    renderWithTheme(
      <ActivityProgressTracker 
        {...defaultProps} 
        estimatedTimeRemaining={300} 
      />
    );
    
    expect(screen.getByText(/5:00 left/)).toBeInTheDocument();
  });

  it('calls onResume when play button is clicked and activity is paused', () => {
    renderWithTheme(<ActivityProgressTracker {...defaultProps} />);
    
    const playButton = screen.getByTestId('PlayArrowIcon').closest('button');
    fireEvent.click(playButton!);
    
    expect(defaultProps.onResume).toHaveBeenCalledTimes(1);
  });

  it('calls onPause when pause button is clicked and activity is active', () => {
    renderWithTheme(
      <ActivityProgressTracker {...defaultProps} isActive={true} />
    );
    
    const pauseButton = screen.getByTestId('PauseIcon').closest('button');
    fireEvent.click(pauseButton!);
    
    expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
  });

  it('calls onHelpRequest when help button is clicked', () => {
    renderWithTheme(<ActivityProgressTracker {...defaultProps} />);
    
    const helpButton = screen.getByTestId('HelpOutlineIcon').closest('button');
    fireEvent.click(helpButton!);
    
    expect(defaultProps.onHelpRequest).toHaveBeenCalledTimes(1);
  });

  it('shows completion message when progress is 100%', () => {
    renderWithTheme(
      <ActivityProgressTracker 
        {...defaultProps} 
        currentProgress={100} 
      />
    );
    
    expect(screen.getByText('🎉 Great job! You completed this activity!')).toBeInTheDocument();
    expect(screen.getByText('Completed!')).toBeInTheDocument();
  });

  it('disables play/pause button when completed', () => {
    renderWithTheme(
      <ActivityProgressTracker 
        {...defaultProps} 
        currentProgress={100} 
      />
    );
    
    const playButton = screen.getByTestId('PlayArrowIcon').closest('button');
    expect(playButton).toBeDisabled();
  });
});