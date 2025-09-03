/**
 * Design System Tokens
 * 
 * This file contains all the design tokens used throughout the application.
 * These tokens ensure consistency across all components and themes.
 */

// Color Tokens
export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Child Theme Primary (Purple)
  childPrimary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Secondary Colors
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Subject Colors
  subjects: {
    mathematics: '#3b82f6',
    science: '#10b981',
    english: '#8b5cf6',
    socialStudies: '#f59e0b',
    art: '#ec4899',
    music: '#06b6d4',
    physicalEducation: '#ef4444',
    technology: '#6366f1',
    foreignLanguage: '#84cc16',
    health: '#14b8a6',
    default: '#64748b',
  },
  
  // Proficiency Colors
  proficiency: {
    beginner: '#ef4444',
    developing: '#f59e0b',
    proficient: '#10b981',
    advanced: '#3b82f6',
    expert: '#8b5cf6',
  },
  
  // Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    pending: '#64748b',
    completed: '#10b981',
    inProgress: '#f59e0b',
    notStarted: '#64748b',
  },
  
  // Neutral Colors
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

// Typography Tokens
export const typography = {
  fontFamilies: {
    parent: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    child: '"Quicksand", "Roboto", "Helvetica", "Arial", sans-serif',
    mono: '"Fira Code", "Monaco", "Consolas", monospace',
  },
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.75rem', // 28px
    '4xl': '2rem',    // 32px
    '5xl': '2.5rem',  // 40px
    '6xl': '3rem',    // 48px
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// Spacing Tokens
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
} as const;

// Border Radius Tokens
export const borderRadius = {
  none: '0px',
  sm: '0.25rem',    // 4px
  base: '0.375rem', // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
} as const;

// Shadow Tokens
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Dark mode shadows
  dark: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  },
} as const;

// Animation Tokens
export const animations = {
  duration: {
    fastest: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Breakpoint Tokens
export const breakpoints = {
  xs: '0px',
  sm: '600px',
  md: '900px',
  lg: '1200px',
  xl: '1536px',
} as const;

// Z-Index Tokens
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      small: '2rem',    // 32px
      medium: '2.5rem', // 40px
      large: '3rem',    // 48px
    },
    padding: {
      small: {
        parent: '0.5rem 1rem',     // 8px 16px
        child: '0.75rem 1.25rem',  // 12px 20px
      },
      medium: {
        parent: '0.75rem 1.5rem',  // 12px 24px
        child: '1rem 1.75rem',     // 16px 28px
      },
      large: {
        parent: '1rem 2rem',       // 16px 32px
        child: '1.25rem 2.25rem',  // 20px 36px
      },
    },
    borderRadius: {
      parent: {
        small: borderRadius.md,
        medium: borderRadius.md,
        large: borderRadius.lg,
      },
      child: {
        small: borderRadius.lg,
        medium: borderRadius.xl,
        large: borderRadius['2xl'],
      },
    },
  },
  
  card: {
    padding: {
      small: spacing[3],   // 12px
      medium: spacing[4],  // 16px
      large: spacing[6],   // 24px
    },
    borderRadius: {
      parent: {
        small: borderRadius.md,
        medium: borderRadius.lg,
        large: borderRadius.xl,
      },
      child: {
        small: borderRadius.lg,
        medium: borderRadius.xl,
        large: borderRadius['2xl'],
      },
    },
  },
  
  input: {
    height: {
      small: '2rem',    // 32px
      medium: '2.5rem', // 40px
      large: '3rem',    // 48px
    },
    borderRadius: {
      parent: borderRadius.md,
      child: borderRadius.lg,
    },
  },
} as const;

// Accessibility tokens
export const accessibility = {
  focusRing: {
    width: {
      parent: '2px',
      child: '3px',
    },
    offset: {
      parent: '2px',
      child: '3px',
    },
    color: {
      parent: colors.primary[500],
      child: colors.childPrimary[500],
    },
  },
  
  minTouchTarget: '44px', // WCAG AA minimum
  
  contrast: {
    aa: 4.5,      // WCAG AA standard
    aaa: 7,       // WCAG AAA standard
    large: 3,     // WCAG AA for large text
  },
} as const;

// Export all tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  components,
  accessibility,
} as const;

// Type definitions for better TypeScript support
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ShadowToken = keyof typeof shadows;
export type BreakpointToken = keyof typeof breakpoints;
export type ZIndexToken = keyof typeof zIndex;