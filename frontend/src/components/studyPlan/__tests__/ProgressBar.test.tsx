import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../ProgressBar';
import '@testing-library/jest-dom';

describe('ProgressBar', () => {
  it('renders correctly with basic props', () => {
    render(
      <ProgressBar
        currentStep={3}
        totalSteps={10}
        timeSpent={120}
        estimatedDuration={300}
      />
    );
    
    // Check for step progress text
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('3 of 10 steps')).toBeInTheDocument();
    
    // Check for time progress text
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('2:00 / 5:00')).toBeInTheDocument();
    
    // Check for progress bars
    const progressBars = document.querySelectorAll('.bg-gray-200');
    expect(progressBars).toHaveLength(2);
  });
  
  it('calculates step progress percentage correctly', () => {
    render(
      <ProgressBar
        currentStep={5}
        totalSteps={10}
        timeSpent={120}
        estimatedDuration={300}
      />
    );
    
    // Step progress should be 50%
    const stepProgressBar = document.querySelector('.bg-blue-600');
    expect(stepProgressBar).toHaveStyle('width: 50%');
  });
  
  it('calculates time progress percentage correctly', () => {
    render(
      <ProgressBar
        currentStep={3}
        totalSteps={10}
        timeSpent={150}
        estimatedDuration={300}
      />
    );
    
    // Time progress should be 50%
    const timeProgressBar = document.querySelector('.bg-green-500');
    expect(timeProgressBar).toHaveStyle('width: 50%');
  });
  
  it('caps progress percentage at 100%', () => {
    render(
      <ProgressBar
        currentStep={15}
        totalSteps={10}
        timeSpent={120}
        estimatedDuration={300}
      />
    );
    
    // Step progress should be capped at 100%
    const stepProgressBar = document.querySelector('.bg-blue-600');
    expect(stepProgressBar).toHaveStyle('width: 100%');
  });
  
  it('shows red time progress bar when time exceeds estimated duration', () => {
    render(
      <ProgressBar
        currentStep={3}
        totalSteps={10}
        timeSpent={400}
        estimatedDuration={300}
      />
    );
    
    // Time progress bar should be red
    const timeProgressBar = document.querySelector('.bg-red-500');
    expect(timeProgressBar).toBeInTheDocument();
    expect(timeProgressBar).toHaveStyle('width: 100%');
  });
  
  it('formats time correctly', () => {
    render(
      <ProgressBar
        currentStep={3}
        totalSteps={10}
        timeSpent={65}
        estimatedDuration={125}
      />
    );
    
    // Time should be formatted as mm:ss
    expect(screen.getByText('1:05 / 2:05')).toBeInTheDocument();
  });
  
  it('pads seconds with leading zero', () => {
    render(
      <ProgressBar
        currentStep={3}
        totalSteps={10}
        timeSpent={61}
        estimatedDuration={300}
      />
    );
    
    // Seconds should be padded with leading zero
    expect(screen.getByText('1:01 / 5:00')).toBeInTheDocument();
  });
});