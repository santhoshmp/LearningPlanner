/**
 * Mobile optimization utilities for child-friendly interfaces
 * Provides touch-friendly interactions and battery optimization
 */

export interface TouchTarget {
  minSize: number;
  padding: number;
  margin: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  threshold: number;
  velocity: number;
}

export interface BatteryOptimization {
  reducedAnimations: boolean;
  lowPowerMode: boolean;
  backgroundProcessing: boolean;
}

// Touch target sizes for children (larger than standard 44px)
export const CHILD_TOUCH_TARGETS: TouchTarget = {
  minSize: 56, // Minimum 56px for child-friendly touch targets
  padding: 16,
  margin: 8
};

// Swipe gesture configuration for activity navigation
export const SWIPE_CONFIG = {
  threshold: 50, // Minimum distance for swipe recognition
  velocity: 0.3, // Minimum velocity for swipe
  maxTime: 300, // Maximum time for swipe gesture
  tolerance: 100 // Tolerance for diagonal swipes
};

/**
 * Detects if device is in battery saver mode or low battery
 */
export const getBatteryStatus = async (): Promise<BatteryOptimization> => {
  const defaultStatus: BatteryOptimization = {
    reducedAnimations: false,
    lowPowerMode: false,
    backgroundProcessing: true
  };

  try {
    // Check if Battery API is available
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      const lowBattery = battery.level < 0.2;
      const charging = battery.charging;
      
      return {
        reducedAnimations: lowBattery && !charging,
        lowPowerMode: lowBattery,
        backgroundProcessing: !lowBattery || charging
      };
    }

    // Fallback: Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      ...defaultStatus,
      reducedAnimations: prefersReducedMotion
    };
  } catch (error) {
    console.warn('Battery API not available:', error);
    return defaultStatus;
  }
};

/**
 * Creates touch-friendly button styles
 */
export const getTouchFriendlyStyles = (size: 'small' | 'medium' | 'large' = 'medium') => {
  const sizes = {
    small: { minHeight: 48, padding: '12px 16px', fontSize: '14px' },
    medium: { minHeight: 56, padding: '16px 24px', fontSize: '16px' },
    large: { minHeight: 64, padding: '20px 32px', fontSize: '18px' }
  };

  return {
    ...sizes[size],
    minWidth: sizes[size].minHeight,
    borderRadius: '12px',
    cursor: 'pointer',
    userSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation' as const
  };
};

/**
 * Optimizes animations based on battery status
 */
export const getOptimizedAnimationConfig = (batteryStatus: BatteryOptimization) => {
  if (batteryStatus.reducedAnimations) {
    return {
      duration: 150,
      easing: 'ease-out',
      reduceMotion: true,
      disableParticles: true
    };
  }

  return {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    reduceMotion: false,
    disableParticles: false
  };
};

/**
 * Detects tablet usage in educational settings
 */
export const isEducationalTablet = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isTablet = /tablet|ipad|playbook|silk/i.test(userAgent) || 
                   (window.innerWidth >= 768 && window.innerWidth <= 1024);
  
  // Check for common educational tablet indicators
  const isEducational = /school|edu|classroom/i.test(window.location.hostname) ||
                        localStorage.getItem('educational-mode') === 'true';
  
  return isTablet && isEducational;
};

/**
 * Optimizes performance for extended learning sessions
 */
export const optimizeForExtendedSessions = () => {
  // Reduce memory usage by cleaning up unused resources
  const cleanupInterval = setInterval(() => {
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    // Clear unused image caches
    const images = document.querySelectorAll('img[data-cached="true"]');
    images.forEach(img => {
      if (!img.getBoundingClientRect().width) {
        (img as HTMLImageElement).src = '';
      }
    });
  }, 300000); // Every 5 minutes

  // Return cleanup function
  return () => clearInterval(cleanupInterval);
};

/**
 * Handles swipe gestures for navigation
 */
export class SwipeHandler {
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private element: HTMLElement;
  private onSwipe: (direction: SwipeGesture['direction']) => void;

  constructor(element: HTMLElement, onSwipe: (direction: SwipeGesture['direction']) => void) {
    this.element = element;
    this.onSwipe = onSwipe;
    this.bindEvents();
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
  }

  private handleTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = endTime - this.startTime;

    // Check if gesture meets criteria
    if (deltaTime > SWIPE_CONFIG.maxTime) return;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < SWIPE_CONFIG.threshold) return;

    const velocity = distance / deltaTime;
    if (velocity < SWIPE_CONFIG.velocity) return;

    // Determine direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      this.onSwipe(deltaX > 0 ? 'right' : 'left');
    } else {
      // Vertical swipe
      this.onSwipe(deltaY > 0 ? 'down' : 'up');
    }
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}