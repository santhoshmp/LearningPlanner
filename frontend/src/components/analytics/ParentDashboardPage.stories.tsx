import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ParentDashboardPage from './ParentDashboardPage';

// Mock child components for Storybook
const MockParentProgressDashboard = () => (
  <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
    <h3>Parent Progress Dashboard</h3>
    <p>This is a mock of the ParentProgressDashboard component for Storybook.</p>
  </div>
);

const MockParentalMonitoringDashboard = () => (
  <div style={{ padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
    <h3>Parental Monitoring Dashboard</h3>
    <p>This is a mock of the ParentalMonitoringDashboard component for Storybook.</p>
  </div>
);

const MockEnhancedAnalyticsDashboard = () => (
  <div style={{ padding: '20px', backgroundColor: '#f0fff0', borderRadius: '8px' }}>
    <h3>Enhanced Analytics Dashboard</h3>
    <p>This is a mock of the EnhancedAnalyticsDashboard component for Storybook.</p>
  </div>
);

// Mock the child components
jest.mock('./ParentProgressDashboard', () => MockParentProgressDashboard);
jest.mock('./ParentalMonitoringDashboard', () => MockParentalMonitoringDashboard);
jest.mock('./EnhancedAnalyticsDashboard', () => MockEnhancedAnalyticsDashboard);

const meta: Meta<typeof ParentDashboardPage> = {
  title: 'Analytics/ParentDashboardPage',
  component: ParentDashboardPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main parent dashboard page with tabbed navigation and modern header design.',
      },
    },
  },
  decorators: [
    (Story) => {
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
              <Story />
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      );
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default Dashboard',
  parameters: {
    docs: {
      description: {
        story: 'The default view of the parent dashboard with the Dashboard tab active.',
      },
    },
  },
};

export const StudyPlansTab: Story = {
  name: 'Study Plans Tab',
  parameters: {
    docs: {
      description: {
        story: 'The parent dashboard with the Study Plans tab active, showing safety and security monitoring.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const studyPlansTab = canvas.getByRole('tab', { name: /study plans/i });
    await userEvent.click(studyPlansTab);
  },
};

export const ReportsTab: Story = {
  name: 'Reports Tab',
  parameters: {
    docs: {
      description: {
        story: 'The parent dashboard with the Reports tab active, showing detailed learning analytics.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reportsTab = canvas.getByRole('tab', { name: /reports/i });
    await userEvent.click(reportsTab);
  },
};

export const MobileView: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'The parent dashboard optimized for mobile devices with responsive layout.',
      },
    },
  },
};

export const TabletView: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'The parent dashboard optimized for tablet devices.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  name: 'Interactive Demo',
  parameters: {
    docs: {
      description: {
        story: 'An interactive demo showing all the features of the parent dashboard including tab navigation and user actions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test tab navigation
    await userEvent.click(canvas.getByRole('tab', { name: /study plans/i }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await userEvent.click(canvas.getByRole('tab', { name: /reports/i }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await userEvent.click(canvas.getByRole('tab', { name: /dashboard/i }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test user action buttons
    await userEvent.hover(canvas.getByLabelText('User Profile'));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await userEvent.hover(canvas.getByLabelText('Log Out'));
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};

// Add required imports for play functions
import { within } from '@storybook/testing-library';
import { userEvent } from '@storybook/testing-library';