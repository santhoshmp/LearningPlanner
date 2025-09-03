import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createParentTheme } from './parentTheme';
import { createChildTheme } from './childTheme';
import { createStandardizedTheme } from './standardizedTheme';
import { AppTheme, ThemeMode, UserRole, TextSize } from './theme.types';
import { KeyboardShortcuts, matchesShortcut } from '../utils/keyboardNavigation';

interface ThemeContextType {
  theme: AppTheme;
  themeMode: ThemeMode;
  userRole: UserRole;
  textSize: TextSize;
  toggleThemeMode: () => void;
  setUserRole: (role: UserRole) => void;
  setTextSize: (size: TextSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
  initialRole?: UserRole;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'light',
  initialRole = 'parent',
}) => {
  // Get stored preferences from localStorage if available
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const storedMode = localStorage.getItem('themeMode');
    return (storedMode as ThemeMode) || initialMode;
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    const storedRole = localStorage.getItem('userRole');
    return (storedRole as UserRole) || initialRole;
  });
  
  const [textSize, setTextSize] = useState<TextSize>(() => {
    const storedSize = localStorage.getItem('textSize');
    return (storedSize as TextSize) || 'normal';
  });

  // Create the appropriate theme based on mode and role
  const theme = useMemo(() => {
    // Use the new standardized theme system
    return createStandardizedTheme(themeMode, userRole);
  }, [themeMode, userRole]);

  // Toggle between light and dark mode
  const toggleThemeMode = () => {
    setThemeMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      
      // Announce theme change for screen readers
      // We use a timeout to ensure the announcement happens after the state update
      setTimeout(() => {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.style.position = 'absolute';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.padding = '0';
        announcement.style.margin = '-1px';
        announcement.style.overflow = 'hidden';
        announcement.style.clip = 'rect(0, 0, 0, 0)';
        announcement.style.whiteSpace = 'nowrap';
        announcement.style.border = '0';
        announcement.textContent = `Theme changed to ${newMode} mode`;
        
        document.body.appendChild(announcement);
        
        // Remove the announcement after it's been read
        setTimeout(() => {
          document.body.removeChild(announcement);
        }, 3000);
      }, 100);
      
      return newMode;
    });
  };

  // Update role handler
  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
  };

  // Register keyboard shortcut for theme toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      if (matchesShortcut(event, KeyboardShortcuts.TOGGLE_THEME)) {
        event.preventDefault();
        toggleThemeMode();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle text size changes
  const handleSetTextSize = (size: TextSize) => {
    setTextSize(size);
    
    // Announce text size change for screen readers
    setTimeout(() => {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.style.position = 'absolute';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.padding = '0';
      announcement.style.margin = '-1px';
      announcement.style.overflow = 'hidden';
      announcement.style.clip = 'rect(0, 0, 0, 0)';
      announcement.style.whiteSpace = 'nowrap';
      announcement.style.border = '0';
      announcement.textContent = `Text size changed to ${size}`;
      
      document.body.appendChild(announcement);
      
      // Remove the announcement after it's been read
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 3000);
    }, 100);
  };

  // Store preferences in localStorage when they change
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('userRole', userRole);
  }, [userRole]);
  
  useEffect(() => {
    localStorage.setItem('textSize', textSize);
    
    // Apply text size to the document
    const htmlElement = document.documentElement;
    
    // Remove any existing text size classes
    htmlElement.classList.remove('text-size-normal', 'text-size-large', 'text-size-larger');
    
    // Add the appropriate class
    htmlElement.classList.add(`text-size-${textSize}`);
    
  }, [textSize]);

  const contextValue = useMemo(
    () => ({
      theme,
      themeMode,
      userRole,
      textSize,
      toggleThemeMode,
      setUserRole: handleSetUserRole,
      setTextSize: handleSetTextSize,
    }),
    [theme, themeMode, userRole, textSize]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};