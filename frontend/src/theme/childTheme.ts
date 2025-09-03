import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { ThemeMode } from './theme.types';

// Create a child theme with engaging, age-appropriate styling
export const createChildTheme = (mode: ThemeMode) => {
  const baseTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#8b5cf6', // Purple for fun and creativity
        light: '#a78bfa',
        dark: '#7c3aed',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#f59e0b', // Orange for energy and enthusiasm
        light: '#fbbf24',
        dark: '#d97706',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#fef7ff' : '#0f0a1a', // Light purple background for warmth
        paper: mode === 'light' ? '#ffffff' : '#1e1b2e',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#64748b' : '#cbd5e1',
      },
      error: {
        main: '#b91c1c', // Darker red for better contrast
        light: '#ef4444',
        dark: '#991b1b',
      },
      warning: {
        main: '#b45309', // Darker amber for better contrast
        light: '#f59e0b',
        dark: '#92400e',
      },
      info: {
        main: '#1d4ed8', // Darker blue for better contrast
        light: '#3b82f6',
        dark: '#1e40af',
      },
      success: {
        main: '#047857', // Darker green for better contrast
        light: '#10b981',
        dark: '#065f46',
      },
    },
    typography: {
      // Changed from Comic Neue to a more readable but still child-friendly font
      fontFamily: '"Quicksand", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '0.01em',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '0.01em',
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.35,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1.1rem', // Slightly larger for better readability for children
        lineHeight: 1.6,
        letterSpacing: '0.00938em',
      },
      body2: {
        fontSize: '0.95rem', // Slightly larger for better readability for children
        lineHeight: 1.6,
        letterSpacing: '0.00938em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 20,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 12, // More rounded corners for child interface
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20, // Rounded buttons
            padding: '10px 20px',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              transform: 'scale(1.03)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            },
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          },
          contained: {
            '&:hover': {
              boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16, // Very rounded cards
            boxShadow: mode === 'light' 
              ? '0 6px 12px -2px rgba(0, 0, 0, 0.1), 0 3px 7px -3px rgba(0, 0, 0, 0.05)'
              : '0 6px 12px -2px rgba(0, 0, 0, 0.25), 0 3px 7px -3px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'light'
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
            // Increase input text size for better readability
            '& .MuiInputBase-input': {
              fontSize: '1.1rem',
            },
            // Make labels more visible
            '& .MuiInputLabel-root': {
              fontSize: '1.1rem',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      // Improve focus visibility for keyboard navigation
      MuiButtonBase: {
        defaultProps: {
          disableRipple: false,
        },
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: '3px solid', // Thicker outline for child interface
              outlineColor: mode === 'light' ? '#7c3aed' : '#a78bfa',
              outlineOffset: '3px',
            },
          },
        },
      },
      // Ensure links have proper focus styles
      MuiLink: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: '3px solid', // Thicker outline for child interface
              outlineColor: mode === 'light' ? '#7c3aed' : '#a78bfa',
              outlineOffset: '3px',
            },
          },
        },
      },
      // Improve contrast for icons
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            // Slightly increase icon size for better visibility
            fontSize: '1.2em',
          },
        },
      },
    },
  });

  // Add responsive font sizes
  const responsiveTheme = responsiveFontSizes(baseTheme);

  return {
    ...responsiveTheme,
    name: 'child' as const,
  };
};