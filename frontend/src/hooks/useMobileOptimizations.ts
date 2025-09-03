/**
 * React hook for mobile optimizations in child interfaces
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getBatteryStatus, 
  getOptimizedAnimationConfig, 
  isEducationalTablet,
  optimizeForExtendedSessions,
  SwipeHandler,
  BatteryOptimization 
} from '../utils/mobileOptimizations';

export interface MobileOptimizationState {
  isTablet: boolean;
  isEducationalMode: boolean;
  batteryStatus: BatteryOptimization;
  animationConfig: ReturnType<typeof getOptimizedAnimationConfig>;
  orientation: 'portrait' | 'landscape';
  screenSize: 'small' | 'medium' | 'large';
}

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

/**
 * Hook for managing mobile optimizations
 */
export const useMobileOptimizations = () => {
  const [state, setState] = useState<MobileOptimizationState>({
    isTablet: false,
    isEducationalMode: false,
    batteryStatus: {
      reducedAnimations: false,
      lowPowerMode: false,
      backgroundProcessing: true
    },
    animationConfig: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      reduceMotion: false,
      disableParticles: false
    },
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    screenSize: 'medium'
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize mobile optimizations
  useEffect(() => {
    const initializeOptimizations = async () => {
      const batteryStatus = await getBatteryStatus();
      const animationConfig = getOptimizedAnimationConfig(batteryStatus);
      const isTablet = isEducationalTablet();
      
      setState(prev => ({
        ...prev,
        isTablet,
        isEducationalMode: isTablet,
        batteryStatus,
        animationConfig,
        screenSize: getScreenSize()
      }));

      // Start extended session optimizations
      if (isTablet) {
        cleanupRef.current = optimizeForExtendedSessions();
      }
    };

    initializeOptimizations();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setState(prev => ({
        ...prev,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        screenSize: getScreenSize()
      }));
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Monitor battery status changes
  useEffect(() => {
    const updateBatteryStatus = async () => {
      const batteryStatus = await getBatteryStatus();
      const animationConfig = getOptimizedAnimationConfig(batteryStatus);
      
      setState(prev => ({
        ...prev,
        batteryStatus,
        animationConfig
      }));
    };

    // Update battery status every 5 minutes
    const interval = setInterval(updateBatteryStatus, 300000);

    return () => clearInterval(interval);
  }, []);

  const getScreenSize = (): 'small' | 'medium' | 'large' => {
    const width = window.innerWidth;
    if (width < 768) return 'small';
    if (width < 1024) return 'medium';
    return 'large';
  };

  return state;
};

/**
 * Hook for handling swipe gestures
 */
export const useSwipeGestures = (handlers: SwipeHandlers) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const swipeHandlerRef = useRef<SwipeHandler | null>(null);

  const attachSwipeHandler = useCallback((element: HTMLElement | null) => {
    if (swipeHandlerRef.current) {
      swipeHandlerRef.current.destroy();
      swipeHandlerRef.current = null;
    }

    if (element) {
      elementRef.current = element;
      swipeHandlerRef.current = new SwipeHandler(element, (direction) => {
        switch (direction) {
          case 'left':
            handlers.onSwipeLeft?.();
            break;
          case 'right':
            handlers.onSwipeRight?.();
            break;
          case 'up':
            handlers.onSwipeUp?.();
            break;
          case 'down':
            handlers.onSwipeDown?.();
            break;
        }
      });
    }
  }, [handlers]);

  useEffect(() => {
    return () => {
      if (swipeHandlerRef.current) {
        swipeHandlerRef.current.destroy();
      }
    };
  }, []);

  return { attachSwipeHandler };
};

/**
 * Hook for touch-friendly interactions
 */
export const useTouchFriendly = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsPressed(true);
    
    // Calculate ripple position for visual feedback
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    setRipplePosition({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    // Clear ripple after animation
    setTimeout(() => setRipplePosition(null), 300);
  }, []);

  const touchProps = {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };

  return {
    isPressed,
    ripplePosition,
    touchProps
  };
};

/**
 * Hook for performance monitoring during extended sessions
 */
export const usePerformanceMonitoring = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memoryUsage: 0,
    frameRate: 60,
    batteryLevel: 1,
    sessionDuration: 0
  });

  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    const updateMetrics = async () => {
      const metrics = { ...performanceMetrics };

      // Update session duration
      metrics.sessionDuration = Date.now() - sessionStartRef.current;

      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      }

      // Battery level (if available)
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          metrics.batteryLevel = battery.level;
        }
      } catch (error) {
        // Battery API not available
      }

      setPerformanceMetrics(metrics);
    };

    const interval = setInterval(updateMetrics, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const shouldOptimizePerformance = useCallback(() => {
    return (
      performanceMetrics.memoryUsage > 0.8 ||
      performanceMetrics.batteryLevel < 0.2 ||
      performanceMetrics.sessionDuration > 1800000 // 30 minutes
    );
  }, [performanceMetrics]);

  return {
    performanceMetrics,
    shouldOptimizePerformance
  };
};