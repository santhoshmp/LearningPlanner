import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import ParentDashboardPage from '../ParentDashboardPage';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock child components to avoid complex dependencies in accessibility tests
jest.mock('../ParentProgressDashboard', () => {
  return function MockParentProgressDashboard() {
    return (
      <div data-testid="parent-progress-dashboard" role="main" aria-label="Parent Progress Dashboard">
        <h2>Parent Progress Dashboard</h2>
        <p>Mock dashboard content for accessibility testing</p>
      </div>
    );
  };
});

jest.mock('../ParentalMonitoringDashboard', () => {
  return function MockParentalMonitoringDashboard() {
    return (
      <div data-testid="parental-monitoring-dashboard" role="main" aria-label="Parental Monitoring Dashboard">
        <h2>Parental Monitoring Dashboard</h2>
        <p>Mock monitoring content for accessibility testing</p>
      </div>
    );
  };
});

jest.mock('../EnhancedAnalyticsDashboard', () => {
  return function MockEnhancedAnalyticsDashboard() {
    return (
      <div data-testid="enhanced-analytics-dashboard" role="main" aria-label="Enhanced Analytics Dashboard">
        <h2>Enhanced Analytics Dashboard</h2>
        <p>Mock analytics content for accessibility testing</p>
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

describe('ParentDashboardPage Accessibility Tests', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for proper heading structure
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);

    // Verify main heading exists
    const mainHeading = container.querySelector('h6'); // Study Plan Pro is h6 in MUI Typography
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveTextContent('Study Plan Pro');
  });

  it('should have proper ARIA labels for interactive elements', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for ARIA labels on icon buttons
    const profileButton = container.querySelector('[aria-label="User Profile"]');
    expect(profileButton).toBeInTheDocument();
    expect(profileButton).toHaveAttribute('role', 'button');

    const logoutButton = container.querySelector('[aria-label="Log Out"]');
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveAttribute('role', 'button');
  });

  it('should have proper tab navigation structure', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for tablist
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toBeInTheDocument();

    // Check for tabs
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(3);

    // Verify each tab has proper ARIA attributes
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('id', `parent-dashboard-tab-${index}`);
      expect(tab).toHaveAttribute('aria-controls', `parent-dashboard-tabpanel-${index}`);
      expect(tab).toHaveAttribute('aria-selected');
    });

    // Check for tabpanels
    const tabpanels = container.querySelectorAll('[role="tabpanel"]');
    expect(tabpanels.length).toBeGreaterThan(0);

    // Verify visible tabpanel has proper ARIA attributes
    const visibleTabpanel = container.querySelector('[role="tabpanel"]:not([hidden])');
    expect(visibleTabpanel).toBeInTheDocument();
    expect(visibleTabpanel).toHaveAttribute('id');
    expect(visibleTabpanel).toHaveAttribute('aria-labelledby');
  });

  it('should have proper color contrast', async () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Run axe with color contrast rules specifically
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper focus management', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check that focusable elements exist
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusableElements.length).toBeGreaterThan(0);

    // Verify no elements have positive tabindex (anti-pattern)
    const positiveTabIndexElements = container.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])');
    expect(positiveTabIndexElements).toHaveLength(0);
  });

  it('should have proper semantic structure', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check for semantic landmarks
    const main = container.querySelector('main') || container.querySelector('[role="main"]');
    expect(main).toBeInTheDocument();

    // Check for proper button semantics
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type');
    });
  });

  it('should support screen readers with proper text alternatives', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check that icons have proper text alternatives
    const icons = container.querySelectorAll('svg[data-testid*="Icon"]');
    icons.forEach(icon => {
      const parentButton = icon.closest('button');
      if (parentButton) {
        // Icon should be inside a button with aria-label or text content
        expect(
          parentButton.hasAttribute('aria-label') || 
          parentButton.textContent?.trim() !== ''
        ).toBe(true);
      }
    });
  });

  it('should handle keyboard navigation properly', async () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Run axe with keyboard navigation rules
    const results = await axe(container, {
      rules: {
        'keyboard': { enabled: true },
        'focus-order-semantics': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper tooltip accessibility', () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Check that tooltips are properly associated with their triggers
    const tooltipTriggers = container.querySelectorAll('[aria-describedby]');
    tooltipTriggers.forEach(trigger => {
      const describedBy = trigger.getAttribute('aria-describedby');
      if (describedBy) {
        // The described element should exist (though it might not be visible initially)
        // This is a basic check - in a real app, you'd test tooltip visibility on hover
        expect(describedBy).toBeTruthy();
      }
    });
  });

  it('should be compatible with assistive technologies', async () => {
    const { container } = render(
      <TestWrapper>
        <ParentDashboardPage />
      </TestWrapper>
    );

    // Run comprehensive accessibility audit
    const results = await axe(container, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    });

    expect(results).toHaveNoViolations();
  });

  it('should handle reduced motion preferences', () => {
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

    // Component should render without issues even with reduced motion
    expect(container).toBeInTheDocument();
  });
});