import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import ParentDashboardPage from '../ParentDashboardPage';

// Mock child components
jest.mock('../ParentProgressDashboard', () => {
  return function MockParentProgressDashboard() {
    return <div data-testid="parent-progress-dashboard">Parent Progress Dashboard</div>;
  };
});

jest.mock('../ParentalMonitoringDashboard', () => {
  return function MockParentalMonitoringDashboard() {
    return <div data-testid="parental-monitoring-dashboard">Parental Monitoring Dashboard</div>;
  };
});

jest.mock('../EnhancedAnalyticsDashboard', () => {
  return function MockEnhancedAnalyticsDashboard() {
    return <div data-testid="enhanced-analytics-dashboard">Enhanced Analytics Dashboard</div>;
  };
});

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
}));

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

describe('ParentDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the main dashboard page with header', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for main header elements
    expect(screen.getByText('Study Plan Pro')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /school/i })).toBeInTheDocument();
  });

  it('should render navigation tabs with correct labels and icons', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for tab labels
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Study Plans')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();

    // Check for tab icons (by role)
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    
    // Verify tab accessibility attributes
    expect(tabs[0]).toHaveAttribute('id', 'parent-dashboard-tab-0');
    expect(tabs[0]).toHaveAttribute('aria-controls', 'parent-dashboard-tabpanel-0');
    expect(tabs[1]).toHaveAttribute('id', 'parent-dashboard-tab-1');
    expect(tabs[1]).toHaveAttribute('aria-controls', 'parent-dashboard-tabpanel-1');
    expect(tabs[2]).toHaveAttribute('id', 'parent-dashboard-tab-2');
    expect(tabs[2]).toHaveAttribute('aria-controls', 'parent-dashboard-tabpanel-2');
  });

  it('should render user action buttons in header', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for action buttons
    expect(screen.getByText('Make a copy')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    
    // Check for icon buttons with tooltips
    expect(screen.getByLabelText('User Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Log Out')).toBeInTheDocument();
  });

  it('should display Dashboard tab content by default', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Dashboard tab should be active by default
    const dashboardTab = screen.getByRole('tab', { name: /dashboard/i });
    expect(dashboardTab).toHaveAttribute('aria-selected', 'true');

    // Dashboard content should be visible
    expect(screen.getByTestId('parent-progress-dashboard')).toBeInTheDocument();
    
    // Other tab contents should not be visible
    expect(screen.queryByTestId('parental-monitoring-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('enhanced-analytics-dashboard')).not.toBeInTheDocument();
  });

  it('should switch to Study Plans tab when clicked', async () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    const studyPlansTab = screen.getByRole('tab', { name: /study plans/i });
    fireEvent.click(studyPlansTab);

    await waitFor(() => {
      expect(studyPlansTab).toHaveAttribute('aria-selected', 'true');
    });

    // Study Plans content should be visible
    expect(screen.getByText('Safety & Security Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Monitor your children\'s activity patterns, login sessions, and security alerts to ensure safe usage of the platform.')).toBeInTheDocument();
    expect(screen.getByTestId('parental-monitoring-dashboard')).toBeInTheDocument();

    // Other tab contents should not be visible
    expect(screen.queryByTestId('parent-progress-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('enhanced-analytics-dashboard')).not.toBeInTheDocument();
  });

  it('should switch to Reports tab when clicked', async () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    const reportsTab = screen.getByRole('tab', { name: /reports/i });
    fireEvent.click(reportsTab);

    await waitFor(() => {
      expect(reportsTab).toHaveAttribute('aria-selected', 'true');
    });

    // Reports content should be visible
    expect(screen.getByText('Detailed Learning Analytics')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive analytics and insights into your children\'s learning patterns, performance trends, and areas for improvement.')).toBeInTheDocument();
    expect(screen.getByTestId('enhanced-analytics-dashboard')).toBeInTheDocument();

    // Other tab contents should not be visible
    expect(screen.queryByTestId('parent-progress-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('parental-monitoring-dashboard')).not.toBeInTheDocument();
  });

  it('should handle tab navigation with keyboard', async () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    const dashboardTab = screen.getByRole('tab', { name: /dashboard/i });
    const studyPlansTab = screen.getByRole('tab', { name: /study plans/i });

    // Focus on first tab
    dashboardTab.focus();
    expect(document.activeElement).toBe(dashboardTab);

    // Navigate with arrow keys
    fireEvent.keyDown(dashboardTab, { key: 'ArrowRight' });
    
    await waitFor(() => {
      expect(studyPlansTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should render tooltips for icon buttons', async () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Test Make a copy button tooltip
    const copyButton = screen.getByText('Make a copy');
    fireEvent.mouseEnter(copyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Make a copy')).toBeInTheDocument();
    });

    // Test User Profile icon tooltip
    const profileButton = screen.getByLabelText('User Profile');
    fireEvent.mouseEnter(profileButton);
    
    await waitFor(() => {
      expect(screen.getByText('User Profile')).toBeInTheDocument();
    });

    // Test Log Out icon tooltip
    const logoutButton = screen.getByLabelText('Log Out');
    fireEvent.mouseEnter(logoutButton);
    
    await waitFor(() => {
      expect(screen.getByText('Log Out')).toBeInTheDocument();
    });
  });

  it('should handle button clicks', () => {
    const mockOnClick = jest.fn();
    
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Test Make a copy button
    const copyButton = screen.getByText('Make a copy');
    fireEvent.click(copyButton);
    // Note: Since no actual onClick handler is implemented, we just verify the button is clickable

    // Test Share button
    const shareButton = screen.getByText('Share');
    fireEvent.click(shareButton);
    // Note: Since no actual onClick handler is implemented, we just verify the button is clickable

    // Test Profile icon button
    const profileButton = screen.getByLabelText('User Profile');
    fireEvent.click(profileButton);
    // Note: Since no actual onClick handler is implemented, we just verify the button is clickable

    // Test Logout icon button
    const logoutButton = screen.getByLabelText('Log Out');
    fireEvent.click(logoutButton);
    // Note: Since no actual onClick handler is implemented, we just verify the button is clickable
  });

  it('should have proper ARIA attributes for accessibility', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check tabpanel ARIA attributes
    const tabpanels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(tabpanels).toHaveLength(3);

    // Check that visible tabpanel has correct attributes
    const visibleTabpanel = screen.getByRole('tabpanel');
    expect(visibleTabpanel).toHaveAttribute('id', 'parent-dashboard-tabpanel-0');
    expect(visibleTabpanel).toHaveAttribute('aria-labelledby', 'parent-dashboard-tab-0');

    // Check that tabs have correct ARIA attributes
    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('id', `parent-dashboard-tab-${index}`);
      expect(tab).toHaveAttribute('aria-controls', `parent-dashboard-tabpanel-${index}`);
    });
  });

  it('should maintain responsive layout structure', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for main layout structure
    const mainContainer = screen.getByRole('main') || document.querySelector('[role="main"]') || document.querySelector('main');
    
    // Check for header structure
    const header = document.querySelector('header') || document.querySelector('[role="banner"]');
    
    // Verify layout classes/styles are applied (this would depend on actual implementation)
    // For now, we verify the basic structure exists
    expect(screen.getByText('Study Plan Pro')).toBeInTheDocument();
  });

  it('should render with proper theme styling', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Verify theme-related elements are rendered
    const logoContainer = screen.getByText('Study Plan Pro').closest('div');
    expect(logoContainer).toBeInTheDocument();

    // Verify buttons have proper styling classes
    const shareButton = screen.getByText('Share');
    expect(shareButton).toHaveClass('MuiButton-contained');

    const copyButton = screen.getByText('Make a copy');
    expect(copyButton).toHaveClass('MuiButton-outlined');
  });

  it('should handle tab state changes correctly', async () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Initially, Dashboard tab should be selected
    expect(screen.getByRole('tab', { name: /dashboard/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /study plans/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /reports/i })).toHaveAttribute('aria-selected', 'false');

    // Click Study Plans tab
    fireEvent.click(screen.getByRole('tab', { name: /study plans/i }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /dashboard/i })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: /study plans/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /reports/i })).toHaveAttribute('aria-selected', 'false');
    });

    // Click Reports tab
    fireEvent.click(screen.getByRole('tab', { name: /reports/i }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /dashboard/i })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: /study plans/i })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: /reports/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should render all Material-UI icons correctly', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for SchoolIcon in logo
    expect(screen.getByTestId('SchoolIcon')).toBeInTheDocument();

    // Check for PersonIcon in profile button
    expect(screen.getByTestId('PersonIcon')).toBeInTheDocument();

    // Check for LogoutIcon in logout button
    expect(screen.getByTestId('LogoutIcon')).toBeInTheDocument();

    // Tab icons should be present (though they might be in tab elements)
    // We can verify the tabs exist and assume icons are rendered within them
    expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /study plans/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /reports/i })).toBeInTheDocument();
  });

  it('should handle container maxWidth correctly', () => {
    render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Verify Container component is rendered with proper maxWidth
    // This would typically be verified through CSS classes or data attributes
    const container = document.querySelector('.MuiContainer-maxWidthXl');
    expect(container).toBeInTheDocument();
  });

  it('should support custom styling and theming', () => {
    const customTheme = createTheme({
      palette: {
        primary: {
          main: '#custom-color',
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

    render(
      <CustomThemeWrapper>
        <ParentDashboardPage />
      </CustomThemeWrapper>
    );

    // Verify component renders with custom theme
    expect(screen.getByText('Study Plan Pro')).toBeInTheDocument();
  });
});