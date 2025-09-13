import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Button } from '@mui/material';
import { Refresh, ContactSupport } from '@mui/icons-material';
import { ErrorState } from './index';
import { ThemeProvider } from '../../theme/ThemeContext';

const meta: Meta<typeof ErrorState> = {
  title: 'Components/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A standardized error state component with multiple variants and customizable actions.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['error', 'warning', 'info'],
      description: 'Type of error/message',
    },
    variant: {
      control: 'select',
      options: ['card', 'inline', 'banner'],
      description: 'Display variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the error display',
    },
    title: {
      control: 'text',
      description: 'Error title',
    },
    message: {
      control: 'text',
      description: 'Error message',
    },
    details: {
      control: 'text',
      description: 'Additional error details',
    },
    dismissible: {
      control: 'boolean',
      description: 'Show dismiss button',
    },
  },
  decorators: [
    (Story, context) => (
      <ThemeProvider initialRole={context.globals.theme === 'child' ? 'child' : 'parent'}>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {
  args: {
    type: 'error',
    title: 'Something went wrong',
    message: 'We encountered an unexpected error. Please try again.',
    onRetry: action('retry-clicked'),
  },
};

export const Types: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <ErrorState
        type="error"
        title="Error"
        message="Something went wrong with your request."
        onRetry={action('error-retry')}
      />
      <ErrorState
        type="warning"
        title="Warning"
        message="Your session will expire in 5 minutes."
        dismissible
        onDismiss={action('warning-dismiss')}
      />
      <ErrorState
        type="info"
        title="Information"
        message="New features are available in this update."
        dismissible
        onDismiss={action('info-dismiss')}
      />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-2xl">
      <div>
        <h4 className="mb-4 font-semibold">Inline</h4>
        <ErrorState
          variant="inline"
          type="error"
          message="Failed to load data. Please try again."
          onRetry={action('inline-retry')}
        />
      </div>
      <div>
        <h4 className="mb-4 font-semibold">Banner</h4>
        <ErrorState
          variant="banner"
          type="warning"
          title="Maintenance Notice"
          message="Scheduled maintenance will begin at 2:00 AM EST."
          dismissible
          onDismiss={action('banner-dismiss')}
        />
      </div>
      <div>
        <h4 className="mb-4 font-semibold">Card</h4>
        <ErrorState
          variant="card"
          type="error"
          title="Connection Failed"
          message="Unable to connect to the server. Check your internet connection and try again."
          details="Error code: NET_ERR_CONNECTION_REFUSED"
          onRetry={action('card-retry')}
        />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <div>
        <h4 className="mb-2 font-semibold">Small</h4>
        <ErrorState
          size="small"
          type="error"
          message="Small error message"
          onRetry={action('small-retry')}
        />
      </div>
      <div>
        <h4 className="mb-2 font-semibold">Medium</h4>
        <ErrorState
          size="medium"
          type="error"
          title="Medium Error"
          message="Medium sized error message with more details"
          onRetry={action('medium-retry')}
        />
      </div>
      <div>
        <h4 className="mb-2 font-semibold">Large</h4>
        <ErrorState
          size="large"
          type="error"
          title="Large Error Title"
          message="Large sized error message with comprehensive details and explanations"
          details="Additional technical details for debugging"
          onRetry={action('large-retry')}
        />
      </div>
    </div>
  ),
};

export const WithCustomActions: Story = {
  args: {
    type: 'error',
    title: 'Upload Failed',
    message: 'The file could not be uploaded. Please check the file size and format.',
    details: 'Maximum file size: 10MB. Supported formats: JPG, PNG, PDF',
    onRetry: action('retry-upload'),
    actions: (
      <Button
        variant="outlined"
        size="small"
        startIcon={<ContactSupport />}
        onClick={action('contact-support')}
      >
        Contact Support
      </Button>
    ),
  },
};

export const NetworkError: Story = {
  args: {
    type: 'error',
    title: 'Network Error',
    message: 'Unable to connect to the server. Please check your internet connection.',
    details: 'If the problem persists, please contact support.',
    retryLabel: 'Retry Connection',
    onRetry: action('retry-connection'),
  },
};

export const ValidationError: Story = {
  args: {
    type: 'warning',
    variant: 'banner',
    title: 'Form Validation Error',
    message: 'Please correct the highlighted fields before submitting.',
    dismissible: true,
    onDismiss: action('dismiss-validation'),
  },
};

export const MaintenanceNotice: Story = {
  args: {
    type: 'info',
    variant: 'banner',
    title: 'Scheduled Maintenance',
    message: 'The system will be unavailable for maintenance from 2:00 AM to 4:00 AM EST.',
    dismissible: true,
    onDismiss: action('dismiss-maintenance'),
  },
};

export const ParentTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider initialRole="parent">
        <div className="p-4 bg-gray-50 rounded-lg w-96">
          <h3 className="mb-4 text-lg font-semibold">Parent Theme</h3>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  args: {
    type: 'error',
    title: 'Professional Error',
    message: 'A system error has occurred. Please contact your administrator.',
    onRetry: action('parent-retry'),
  },
};

export const ChildTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider initialRole="child">
        <div className="p-4 bg-purple-50 rounded-lg w-96">
          <h3 className="mb-4 text-lg font-semibold">Child Theme</h3>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  args: {
    type: 'error',
    title: 'Oops! Something went wrong',
    message: "Don't worry! Let's try that again.",
    retryLabel: 'Try Again',
    onRetry: action('child-retry'),
  },
};