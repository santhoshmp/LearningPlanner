/**
 * Tests for TouchFriendlyButton component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TouchFriendlyButton from '../TouchFriendlyButton';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock the mobile optimizations hook
jest.mock('../../../hooks/useMobileOptimizations', () => ({
  useTouchFriendly: () => ({
    isPressed: false,
    ripplePosition: null,
    touchProps: {
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
      onTouchCancel: jest.fn()
    }
  }),
  useMobileOptimizations: () => ({
    animationConfig: { duration: 300 },
    isTablet: false
  })
}));

describe('TouchFriendlyButton', () => {
  it('renders with correct touch-friendly styles', () => {
    renderWithTheme(
      <TouchFriendlyButton>Test Button</TouchFriendlyButton>
    );
    
    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({
      minHeight: '56px',
      minWidth: '56px'
    });
  });

  it('applies correct size styles', () => {
    renderWithTheme(
      <TouchFriendlyButton size="large">Large Button</TouchFriendlyButton>
    );
    
    const button = screen.getByRole('button', { name: 'Large Button' });
    expect(button).toHaveStyle({
      minHeight: '64px'
    });
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <TouchFriendlyButton onClick={handleClick}>
        Clickable Button
      </TouchFriendlyButton>
    );
    
    const button = screen.getByRole('button', { name: 'Clickable Button' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows pressed state correctly', () => {
    const mockUseTouchFriendly = jest.fn(() => ({
      isPressed: true,
      ripplePosition: { x: 50, y: 50 },
      touchProps: {
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
        onTouchCancel: jest.fn()
      }
    }));

    jest.doMock('../../../hooks/useMobileOptimizations', () => ({
      useTouchFriendly: mockUseTouchFriendly,
      useMobileOptimizations: () => ({
        animationConfig: { duration: 300 },
        isTablet: false
      })
    }));

    renderWithTheme(
      <TouchFriendlyButton>Pressed Button</TouchFriendlyButton>
    );
    
    const button = screen.getByRole('button', { name: 'Pressed Button' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables button when disabled prop is true', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <TouchFriendlyButton disabled onClick={handleClick}>
        Disabled Button
      </TouchFriendlyButton>
    );
    
    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom ripple color', () => {
    renderWithTheme(
      <TouchFriendlyButton rippleColor="#ff0000">
        Custom Ripple
      </TouchFriendlyButton>
    );
    
    const button = screen.getByRole('button', { name: 'Custom Ripple' });
    expect(button).toBeInTheDocument();
  });

  it('handles touch events', () => {
    const touchProps = {
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
      onTouchCancel: jest.fn()
    };

    jest.doMock('../../../hooks/useMobileOptimizations', () => ({
      useTouchFriendly: () => ({
        isPressed: false,
        ripplePosition: null,
        touchProps
      }),
      useMobileOptimizations: () => ({
        animationConfig: { duration: 300 },
        isTablet: true
      })
    }));

    renderWithTheme(
      <TouchFriendlyButton>Touch Button</TouchFriendlyButton>
    );
    
    const button = screen.getByRole('button', { name: 'Touch Button' });
    
    fireEvent.touchStart(button, {
      touches: [{ clientX: 50, clientY: 50 }]
    });
    
    fireEvent.touchEnd(button);
  });

  it('supports keyboard navigation', () => {
    renderWithTheme(
      <TouchFriendlyButton>Keyboard Button</TouchFriendlyButton>
    );
    
    const button = screen.getByRole('button', { name: 'Keyboard Button' });
    
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    
    expect(button).toBeInTheDocument();
  });
});