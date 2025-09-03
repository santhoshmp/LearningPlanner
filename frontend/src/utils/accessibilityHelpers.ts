import { useEffect, useRef } from 'react';

// Screen reader announcement utility
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.padding = '0';
  announcement.style.margin = '-1px';
  announcement.style.overflow = 'hidden';
  announcement.style.clip = 'rect(0, 0, 0, 0)';
  announcement.style.whiteSpace = 'nowrap';
  announcement.style.border = '0';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove the announcement after it's been read
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 3000);
};

// Focus management hook
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement | null>(null);

  const setFocus = (element?: HTMLElement | null) => {
    if (element) {
      focusRef.current = element;
      element.focus();
    } else if (focusRef.current) {
      focusRef.current.focus();
    }
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  };

  return { setFocus, trapFocus, focusRef };
};

// Skip link utility
export const createSkipLink = (targetId: string, label: string = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md';
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return skipLink;
};

// ARIA attributes helper
export const getAriaAttributes = (options: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  busy?: boolean;
  controls?: string;
  owns?: string;
  haspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  level?: number;
  setsize?: number;
  posinset?: number;
}) => {
  const attributes: Record<string, string | boolean | number> = {};

  if (options.label) attributes['aria-label'] = options.label;
  if (options.labelledBy) attributes['aria-labelledby'] = options.labelledBy;
  if (options.describedBy) attributes['aria-describedby'] = options.describedBy;
  if (options.expanded !== undefined) attributes['aria-expanded'] = options.expanded;
  if (options.selected !== undefined) attributes['aria-selected'] = options.selected;
  if (options.checked !== undefined) attributes['aria-checked'] = options.checked;
  if (options.disabled !== undefined) attributes['aria-disabled'] = options.disabled;
  if (options.required !== undefined) attributes['aria-required'] = options.required;
  if (options.invalid !== undefined) attributes['aria-invalid'] = options.invalid;
  if (options.live) attributes['aria-live'] = options.live;
  if (options.atomic !== undefined) attributes['aria-atomic'] = options.atomic;
  if (options.busy !== undefined) attributes['aria-busy'] = options.busy;
  if (options.controls) attributes['aria-controls'] = options.controls;
  if (options.owns) attributes['aria-owns'] = options.owns;
  if (options.haspopup !== undefined) attributes['aria-haspopup'] = options.haspopup;
  if (options.level !== undefined) attributes['aria-level'] = options.level;
  if (options.setsize !== undefined) attributes['aria-setsize'] = options.setsize;
  if (options.posinset !== undefined) attributes['aria-posinset'] = options.posinset;

  return attributes;
};

// Keyboard navigation helper
export const handleKeyboardNavigation = (
  event: KeyboardEvent,
  options: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
    onTab?: (shiftKey: boolean) => void;
  }
) => {
  const { key, shiftKey } = event;

  switch (key) {
    case 'Enter':
      options.onEnter?.();
      break;
    case ' ':
    case 'Space':
      options.onSpace?.();
      break;
    case 'Escape':
      options.onEscape?.();
      break;
    case 'ArrowUp':
      options.onArrowUp?.();
      break;
    case 'ArrowDown':
      options.onArrowDown?.();
      break;
    case 'ArrowLeft':
      options.onArrowLeft?.();
      break;
    case 'ArrowRight':
      options.onArrowRight?.();
      break;
    case 'Home':
      options.onHome?.();
      break;
    case 'End':
      options.onEnd?.();
      break;
    case 'Tab':
      options.onTab?.(shiftKey);
      break;
  }
};

// Color contrast checker
export const checkColorContrast = (foreground: string, background: string): {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
} => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return { ratio: 0, level: 'FAIL' };
  }

  const fgLuminance = getLuminance(fg.r, fg.g, fg.b);
  const bgLuminance = getLuminance(bg.r, bg.g, bg.b);

  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                (Math.min(fgLuminance, bgLuminance) + 0.05);

  let level: 'AAA' | 'AA' | 'A' | 'FAIL';
  if (ratio >= 7) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  else if (ratio >= 3) level = 'A';
  else level = 'FAIL';

  return { ratio, level };
};

// Text size adjustment helper
export const adjustTextSize = (size: 'normal' | 'large' | 'larger') => {
  const htmlElement = document.documentElement;
  
  // Remove existing text size classes
  htmlElement.classList.remove('text-size-normal', 'text-size-large', 'text-size-larger');
  
  // Add the appropriate class
  htmlElement.classList.add(`text-size-${size}`);
  
  // Store preference
  localStorage.setItem('textSize', size);
  
  // Announce change
  announceToScreenReader(`Text size changed to ${size}`);
};

// High contrast mode detection
export const useHighContrastMode = () => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('high-contrast', e.matches);
    };

    // Set initial state
    document.documentElement.classList.toggle('high-contrast', mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
};

// Reduced motion detection
export const useReducedMotion = () => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    };

    // Set initial state
    document.documentElement.classList.toggle('reduce-motion', mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
};

// Form validation announcements
export const announceFormValidation = (
  fieldName: string, 
  isValid: boolean, 
  errorMessage?: string
) => {
  const message = isValid 
    ? `${fieldName} is valid`
    : `${fieldName} has an error: ${errorMessage || 'Please check your input'}`;
  
  announceToScreenReader(message, 'assertive');
};

// Progress announcements
export const announceProgress = (current: number, total: number, description?: string) => {
  const percentage = Math.round((current / total) * 100);
  const message = description 
    ? `${description}: ${percentage}% complete, ${current} of ${total}`
    : `Progress: ${percentage}% complete, ${current} of ${total}`;
  
  announceToScreenReader(message, 'polite');
};

// Loading state announcements
export const announceLoadingState = (isLoading: boolean, description?: string) => {
  const message = isLoading 
    ? `Loading ${description || 'content'}...`
    : `Finished loading ${description || 'content'}`;
  
  announceToScreenReader(message, 'polite');
};