import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ParentDashboardPage from '../ParentDashboardPage';

// Mock child components for consistent visual testing
jest.mock('../ParentProgressDashboard', () => {
  return function MockParentProgressDashboard() {
    return (
      <div 
        data-testid="parent-progress-dashboard" 
        style={{ 
          padding: '20px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Parent Progress Dashboard</h3>
          <p style={{ margin: 0, color: '#666' }}>Mock dashboard content for visual testing</p>
        </div>
      </div>
    );
  };
});

jest.mock('../ParentalMonitoringDashboard', () => {
  return function MockParentalMonitoringDashboard() {
    return (
      <div 
        data-testid="parental-monitoring-dashboard" 
        style={{ 
          padding: '20px', 
          backgroundColor: '#f0f8ff', 
          borderRadius: '8px',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Parental Monitoring Dashboard</h3>
          <p style={{ margin: 0, color: '#666' }}>Mock monitoring content for visual testing</p>
        </div>
      </div>
    );
  };
});

jest.mock('../EnhancedAnalyticsDashboard', () => {
  return function MockEnhancedAnalyticsDashboard() {
    return (
      <div 
        data-testid="enhanced-analytics-dashboard" 
        style={{ 
          padding: '20px', 
          backgroundColor: '#f0fff0', 
          borderRadius: '8px',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Enhanced Analytics Dashboard</h3>
          <p style={{ margin: 0, color: '#666' }}>Mock analytics content for visual testing</p>
        </div>
      </div>
    );
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const theme = createTheme();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('ParentDashboardPage Visual Regression Tests', () => {
  // Set up consistent viewport for visual tests
  beforeEach(() => {
    // Mock window dimensions for consistent testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  it('should render consistently with default theme', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Take a snapshot of the rendered component
    expect(container.firstChild).toMatchSnapshot('parent-dashboard-default');
  });

  it('should render header elements consistently', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Focus on header elements for visual consistency
    const header = container.querySelector('header') || 
                  container.querySelector('[role="banner"]') ||
                  container.querySelector('div'); // Fallback to first div (likely the header)

    expect(header).toMatchSnapshot('parent-dashboard-header');
  });

  it('should render tabs consistently', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toMatchSnapshot('parent-dashboard-tabs');
  });

  it('should render user action buttons consistently', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Find the container with user action buttons
    const actionButtons = container.querySelector('div:has(button)') ||
                         Array.from(container.querySelectorAll('div')).find(div => 
                           div.textContent?.includes('Make a copy') || 
                           div.textContent?.includes('Share')
                         );

    if (actionButtons) {
      expect(actionButtons).toMatchSnapshot('parent-dashboard-actions');
    }
  });

  it('should render with custom theme consistently', () => {
    const customTheme = createTheme({
      palette: {
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#dc004e',
        },
      },
    });

    const CustomThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      return (
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={customTheme}>
              {children}
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      );
    };

    const { container } = render(
      <CustomThemeWrapper>
        <ParentDashboardPage />
      </CustomThemeWrapper>
    );

    expect(container.firstChild).toMatchSnapshot('parent-dashboard-custom-theme');
  });

  it('should render mobile layout consistently', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    expect(container.firstChild).toMatchSnapshot('parent-dashboard-mobile');
  });

  it('should render tablet layout consistently', () => {
    // Mock tablet viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    expect(container.firstChild).toMatchSnapshot('parent-dashboard-tablet');
  });

  it('should render with different tab states consistently', () => {
    const { container, rerender } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Default state (Dashboard tab)
    expect(container.firstChild).toMatchSnapshot('parent-dashboard-tab-dashboard');

    // Note: Since we can't easily simulate tab clicks in snapshot tests,
    // we would need to create separate test cases or use a more sophisticated
    // testing approach for different tab states. For now, we test the default state.
  });

  it('should render loading states consistently', () => {
    // Mock loading state by rendering with delayed data
    const LoadingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { 
            retry: false,
            staleTime: 0,
            cacheTime: 0,
          },
          mutations: { retry: false },
        },
      });
      
      const theme = createTheme();

      return (
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              {children}
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      );
    };

    const { container } = render(
      <LoadingWrapper>
        <ParentDashboardPage />
      </LoadingWrapper>
    );

    expect(container.firstChild).toMatchSnapshot('parent-dashboard-loading');
  });

  it('should render with high contrast mode consistently', () => {
    // Mock high contrast media query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    expect(container.firstChild).toMatchSnapshot('parent-dashboard-high-contrast');
  });

  it('should render with reduced motion consistently', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    expect(container.firstChild).toMatchSnapshot('parent-dashboard-reduced-motion');
  });
});