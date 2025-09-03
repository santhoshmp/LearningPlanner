import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityNavigation from '../ActivityNavigation';
import '@testing-library/jest-dom';

describe('ActivityNavigation', () => {
  const mockOnPrevious = jest.fn();
  const mockOnNext = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with basic props', () => {
    render(
      <ActivityNavigation
        currentStep={1}
        totalSteps={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        canProceed={true}
      />
    );
    
    // Check for navigation buttons
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    
    // Check for step indicator
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
  });
  
  it('disables previous button on first step', () => {
    render(
      <ActivityNavigation
        currentStep={0}
        totalSteps={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        canProceed={true}
      />
    );
    
    const previousButton = screen.getByText('Previous').closest('button');
    expect(previousButton).toBeDisabled();
    expect(previousButton).toHaveClass('bg-gray-200 text-gray-400 cursor-not-allowed');
    
    // Click should not trigger the callback
    fireEvent.click(previousButton!);
    expect(mockOnPrevious).not.toHaveBeenCalled();
  });
  
  it('enables previous button when not on first step', () => {
    render(
      <ActivityNavigation
        currentStep={2}
        totalSteps={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        canProceed={true}
      />
    );
    
    const previousButton = screen.getByText('Previous').closest('button');
    expect(previousButton).not.toBeDisabled();
    expect(previousButton).toHaveClass('bg-gray-200 text-gray-700 hover:bg-gray-300');
    
    // Click should trigger the callback
    fireEvent.click(previousButton!);
    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });
  
  it('disables next button when canProceed is false', () => {
    render(
      <ActivityNavigation
        currentStep={1}
        totalSteps={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        canProceed={false}
      />
    );
    
    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).toBeDisabled();
    expect(nextButton).toHaveClass('bg-blue-300 text-white cursor-not-allowed');
    
    // Click should not trigger the callback
    fireEvent.click(nextButton!);
    expect(mockOnNext).not.toHaveBeenCalled();
  });
  
  it('enables next button when canProceed is true', () => {
    render(
      <ActivityNavigation
        currentStep={1}
        totalSteps={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        canProceed={true}
      />
    );
    
    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).not.toBeDisabled();
    expect(nextButton).toHaveClass('bg-blue-600 text-white hover:bg-blue-700');
    
    // Click should trigger the callback
    fireEvent.click(nextButton!);
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });
  
  it('shows "Complete" text on last step instead of "Next"', () => {
    render(
      <ActivityNavigation
        currentStep={4}
        totalSteps={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
        canProceed={true}
      />
    );
    
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});