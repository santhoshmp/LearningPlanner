import { createTheme, responsiveFontSizes, Theme } from '@mui/material/styles';
import { ThemeMode, UserRole } from './theme.types';

// Subject-specific color schemes for consistent visual identity
export const SUBJECT_COLORS = {
  mathematics: '#3b82f6', // Blue
  science: '#10b981', // Green
  english: '#8b5cf6', // Purple
  'social-studies': '#f59e0b', // Amber
  art: '#ec4899', // Pink
  music: '#06b6d4', // Cyan
  'physical-education': '#ef4444', // Red
  technology: '#6366f1', // Indigo
  'foreign-language': '#84cc16', // Lime
  health: '#14b8a6', // Teal
  default: '#64748b', // Slate
} as const;

// Proficiency level color coding
export const PROFICIENCY_COLORS = {
  beginner: '#ef4444', // Red
  developing: '#f59e0b', // Amber
  proficient: '#10b981', // Green
  advanced: '#3b82f6', // Blue
  expert: '#8b5cf6', // Purple
} as const;

// Status colors for consistent feedback
export const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  pending: '#64748b',
  completed: '#10b981',
  'in-progress': '#f59e0b',
  'not-started': '#64748b',
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// Spacing system
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Typography scale
export const TYPOGRAPHY_SCALE = {
  h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
  h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.35 },
  h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
  h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
  subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
  body1: { fontSize: '1rem', lineHeight: 1.6 },
  body2: { fontSize: '0.875rem', lineHeight: 1.6 },
  button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none' as const },
  caption: { fontSize: '0.75rem', lineHeight: 1.4 },
  overline: { fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' as const },
} as const;

// Animation configurations
export const ANIMATIONS = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
} as const;

// Shadow system
export const SHADOWS = {
  light: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    floating: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  dark: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12)',
    elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
    floating: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  },
} as const;

// Create standardized theme configuration
export const createStandardizedTheme = (mode: ThemeMode, role: UserRole): Theme => {
  const isChild = role === 'child';
  const isDark = mode === 'dark';

  const baseTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: isChild ? '#8b5cf6' : '#3b82f6',
        light: isChild ? '#a78bfa' : '#60a5fa',
        dark: isChild ? '#7c3aed' : '#1d4ed8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isChild ? '#f59e0b' : '#10b981',
        light: isChild ? '#fbbf24' : '#34d399',
        dark: isChild ? '#d97706' : '#047857',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark 
          ? (isChild ? '#0f0a1a' : '#0f172a')
          : (isChild ? '#fef7ff' : '#f8fafc'),
        paper: isDark 
          ? (isChild ? '#1e1b2e' : '#1e293b')
          : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#cbd5e1' : '#64748b',
      },
      error: {
        main: STATUS_COLORS.error,
        light: '#f87171',
        dark: '#dc2626',
      },
      warning: {
        main: STATUS_COLORS.warning,
        light: '#fbbf24',
        dark: '#d97706',
      },
      info: {
        main: STATUS_COLORS.info,
        light: '#60a5fa',
        dark: '#1d4ed8',
      },
      success: {
        main: STATUS_COLORS.success,
        light: '#34d399',
        dark: '#047857',
      },
    },
    typography: {
      fontFamily: isChild 
        ? '"Quicksand", "Roboto", "Helvetica", "Arial", sans-serif'
        : '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      ...TYPOGRAPHY_SCALE,
      // Adjust body text size for children
      body1: {
        ...TYPOGRAPHY_SCALE.body1,
        fontSize: isChild ? '1.1rem' : '1rem',
      },
      body2: {
        ...TYPOGRAPHY_SCALE.body2,
        fontSize: isChild ? '0.95rem' : '0.875rem',
      },
    },
    shape: {
      borderRadius: isChild ? 12 : 8,
    },
    breakpoints: {
      values: BREAKPOINTS,
    },
    spacing: 8, // Base spacing unit
    transitions: {
      duration: ANIMATIONS.duration,
      easing: ANIMATIONS.easing,
    },
    components: {
      // Button standardization
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: isChild ? 20 : 8,
            padding: isChild ? '10px 20px' : '8px 16px',
            fontWeight: 600,
            boxShadow: 'none',
            textTransform: 'none',
            transition: `all ${ANIMATIONS.duration.short}ms ${ANIMATIONS.easing.easeInOut}`,
            '&:hover': {
              transform: isChild ? 'scale(1.03)' : 'translateY(-1px)',
              boxShadow: isDark ? SHADOWS.dark.card : SHADOWS.light.card,
            },
            '&.Mui-focusVisible': {
              outline: `${isChild ? 3 : 2}px solid`,
              outlineColor: isChild ? '#a78bfa' : '#60a5fa',
              outlineOffset: `${isChild ? 3 : 2}px`,
            },
          },
          contained: {
            '&:hover': {
              boxShadow: isDark ? SHADOWS.dark.elevated : SHADOWS.light.elevated,
            },
          },
        },
      },
      // Card standardization
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: isChild ? 16 : 12,
            boxShadow: isDark ? SHADOWS.dark.card : SHADOWS.light.card,
            transition: `all ${ANIMATIONS.duration.short}ms ${ANIMATIONS.easing.easeInOut}`,
            '&:hover': {
              transform: isChild ? 'translateY(-4px)' : 'translateY(-2px)',
              boxShadow: isDark ? SHADOWS.dark.elevated : SHADOWS.light.elevated,
            },
          },
        },
      },
      // TextField standardization
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: isChild ? 12 : 8,
            },
            '& .MuiInputBase-input': {
              fontSize: isChild ? '1.1rem' : '1rem',
            },
            '& .MuiInputLabel-root': {
              fontSize: isChild ? '1.1rem' : '1rem',
            },
          },
        },
      },
      // Paper standardization
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: isChild ? 16 : 12,
          },
        },
      },
      // Chip standardization
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: isChild ? 16 : 8,
            fontWeight: 500,
          },
        },
      },
      // Focus improvements for accessibility
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `${isChild ? 3 : 2}px solid`,
              outlineColor: isChild 
                ? (isDark ? '#a78bfa' : '#7c3aed')
                : (isDark ? '#60a5fa' : '#1d4ed8'),
              outlineOffset: `${isChild ? 3 : 2}px`,
            },
          },
        },
      },
      // Link focus improvements
      MuiLink: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `${isChild ? 3 : 2}px solid`,
              outlineColor: isChild 
                ? (isDark ? '#a78bfa' : '#7c3aed')
                : (isDark ? '#60a5fa' : '#1d4ed8'),
              outlineOffset: `${isChild ? 3 : 2}px`,
            },
          },
        },
      },
      // Icon improvements for children
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            fontSize: isChild ? '1.2em' : '1em',
          },
        },
      },
      // Loading state standardization
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: isChild ? '#8b5cf6' : '#3b82f6',
          },
        },
      },
      // Alert standardization
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: isChild ? 12 : 8,
          },
        },
      },
    },
  });

  // Add responsive font sizes
  const responsiveTheme = responsiveFontSizes(baseTheme);

  return {
    ...responsiveTheme,
    // Add custom properties for our standardized system
    custom: {
      subjectColors: SUBJECT_COLORS,
      proficiencyColors: PROFICIENCY_COLORS,
      statusColors: STATUS_COLORS,
      shadows: isDark ? SHADOWS.dark : SHADOWS.light,
      animations: ANIMATIONS,
      spacing: SPACING,
    },
  } as Theme & {
    custom: {
      subjectColors: typeof SUBJECT_COLORS;
      proficiencyColors: typeof PROFICIENCY_COLORS;
      statusColors: typeof STATUS_COLORS;
      shadows: typeof SHADOWS.light | typeof SHADOWS.dark;
      animations: typeof ANIMATIONS;
      spacing: typeof SPACING;
    };
  };
};

// Helper function to get subject color
export const getSubjectColor = (subjectId: string): string => {
  return SUBJECT_COLORS[subjectId as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS.default;
};

// Helper function to get proficiency color
export const getProficiencyColor = (level: string): string => {
  return PROFICIENCY_COLORS[level as keyof typeof PROFICIENCY_COLORS] || PROFICIENCY_COLORS.beginner;
};

// Helper function to get status color
export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
};