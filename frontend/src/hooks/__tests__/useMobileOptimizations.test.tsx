/**
 * Tests for mobile optimization hooks
 */

import { renderHook, act } from '@testing-library/react';
import { useMobileOptimizations, useSwipeGestures, useTouchFriendly } from '../useMobileOptimizations';

// Mock the mobile optimization utilities
jest.mock('../../utils/mobileOptimizations', () => ({
  getBatteryStatus: jest.fn(() => Promise.resolve({
    reducedAnimations: false,
    lowPowerMode: false,
    backgroundProcessing: true
  })),
  getOptimizedAnimationConfig: jest.fn(() => ({
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    reduceMotion: false,
    disableParticles: false
  })),
  isEducationalTablet: jest.fn(() => false),
  optimizeForExtendedSessions: jest.fn(() => () => {}),
  SwipeHandler: jest.fn().mockImplementation(() => ({
    destroy: jest.fn()
  }))
}));

// Mock window properties
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
});

Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  configurable: true,
  value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
});

describe('useMobileOptimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', async () => {
    const { result } = renderHook(() => useMobileOptimizations());
    
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isEducationalMode).toBe(false);
    expect(result.current.orientation).toBe('landscape');
    expect(result.current.screenSize).toBe('medium');
  });

  it('detects orientation changes', async () => {
    const { result } = renderHook(() => useMobileOptimizations());
    
    // Simulate orientation change
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      window.dispatchEvent(new Event('orientationchange'));
    });

    expect(result.current.orientation).toBe('portrait');
  });

  it('updates screen size based on window dimensions', async () => {
    const { result } = renderHook(() => useMobileOptimizations());
    
    // Simulate small screen
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.screenSize).toBe('small');
  });

  it('handles battery status updates', async () => {
    const mockGetBatteryStatus = require('../../utils/mobileOptimizations').getBatteryStatus;
    mockGetBatteryStatus.mockResolvedValue({
      reducedAnimations: true,
      lowPowerMode: true,
      backgroundProcessing: false
    });

    const { result, waitForNextUpdate } = renderHook(() => useMobileOptimizations());
    
    await waitForNextUpdate();
    
    expect(result.current.batteryStatus.lowPowerMode).toBe(true);
    expect(result.current.animationConfig.reduceMotion).toBe(true);
  });
});

describe('useSwipeGestures', () => {
  it('attaches swipe handler to element', () => {
    const handlers = {
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn()
    };

    const { result } = renderHook(() => useSwipeGestures(handlers));
    
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.attachSwipeHandler(mockElement);
    });

    const SwipeHandler = require('../../utils/mobileOptimizations').SwipeHandler;
    expect(SwipeHandler).toHaveBeenCalledWith(mockElement, expect.any(Function));
  });

  it('cleans up swipe handler on unmount', () => {
    const handlers = {
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn()
    };

    const { result, unmount } = renderHook(() => useSwipeGestures(handlers));
    
    const mockElement = document.createElement('div');
    const mockDestroy = jest.fn();
    
    const SwipeHandler = require('../../utils/mobileOptimizations').SwipeHandler;
    SwipeHandler.mockImplementation(() => ({
      destroy: mockDestroy
    }));

    act(() => {
      result.current.attachSwipeHandler(mockElement);
    });

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });
});

describe('useTouchFriendly', () => {
  it('handles touch start and end events', () => {
    const { result } = renderHook(() => useTouchFriendly());
    
    expect(result.current.isPressed).toBe(false);
    expect(result.current.ripplePosition).toBe(null);

    const mockTouchEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0 })
      },
      touches: [{ clientX: 50, clientY: 50 }]
    } as any;

    act(() => {
      result.current.touchProps.onTouchStart(mockTouchEvent);
    });

    expect(result.current.isPressed).toBe(true);
    expect(result.current.ripplePosition).toEqual({ x: 50, y: 50 });

    act(() => {
      result.current.touchProps.onTouchEnd();
    });

    expect(result.current.isPressed).toBe(false);
  });

  it('clears ripple position after animation', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useTouchFriendly());
    
    const mockTouchEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0 })
      },
      touches: [{ clientX: 50, clientY: 50 }]
    } as any;

    act(() => {
      result.current.touchProps.onTouchStart(mockTouchEvent);
    });

    act(() => {
      result.current.touchProps.onTouchEnd();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.ripplePosition).toBe(null);
    
    jest.useRealTimers();
  });
});