import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from './index';
import { ThemeProvider } from '../../theme/ThemeContext';

const meta: Meta<typeof LoadingState> = {
  title: 'Components/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A standardized loading state component with multiple variants and theme support.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['spinner', 'skeleton', 'pulse', 'dots'],
      description: 'Type of loading animation',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the loading indicator',
    },
    variant: {
      control: 'select',
      options: ['card', 'inline', 'overlay'],
      description: 'Display variant',
    },
    message: {
      control: 'text',
      description: 'Loading message to display',
    },
    fullHeight: {
      control: 'boolean',
      description: 'Use full screen height',
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
type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {
  args: {
    type: 'spinner',
    message: 'Loading...',
  },
};

export const Types: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-4">
      <div className="text-center">
        <h4 className="mb-4 font-semibold">Spinner</h4>
        <LoadingState type="spinner" message="Loading content..." />
      </div>
      <div className="text-center">
        <h4 className="mb-4 font-semibold">Dots</h4>
        <LoadingState type="dots" message="Processing..." />
      </div>
      <div className="text-center">
        <h4 className="mb-4 font-semibold">Skeleton</h4>
        <LoadingState type="skeleton" message="Loading data..." />
      </div>
      <div className="text-center">
        <h4 className="mb-4 font-semibold">Pulse</h4>
        <LoadingState type="pulse" message="Please wait..." />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <div className="text-center">
        <h4 className="mb-4 font-semibold">Small</h4>
        <LoadingState type="spinner" size="small" message="Loading..." />
      </div>
      <div className="text-center">
        <h4 className="mb-4 font-semibold">Medium</h4>
        <LoadingState type="spinner" size="medium" message="Loading..." />
      </div>
      <div className="text-center">
        <h4 className="mb-4 font-semibold">Large</h4>
        <LoadingState type="spinner" size="large" message="Loading..." />
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="mb-4 font-semibold">Inline</h4>
        <LoadingState variant="inline" message="Loading inline content..." />
      </div>
      <div>
        <h4 className="mb-4 font-semibold">Card</h4>
        <LoadingState variant="card" message="Loading card content..." />
      </div>
      <div className="relative h-32 bg-gray-100 rounded-lg">
        <h4 className="absolute top-2 left-2 font-semibold">Overlay</h4>
        <div className="p-4">
          <p>This is some content that would be covered by the overlay...</p>
        </div>
        <LoadingState variant="overlay" message="Loading overlay..." />
      </div>
    </div>
  ),
};

export const WithContent: Story = {
  render: () => (
    <LoadingState type="spinner" variant="overlay" message="Loading data...">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Sample Content</h3>
        <p className="text-gray-600">
          This content would normally be visible, but it's covered by the loading overlay.
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </LoadingState>
  ),
};

export const ParentTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider initialRole="parent">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Parent Theme</h3>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  render: () => (
    <div className="flex gap-8">
      <LoadingState type="spinner" message="Loading..." />
      <LoadingState type="skeleton" />
    </div>
  ),
};

export const ChildTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider initialRole="child">
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Child Theme</h3>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  render: () => (
    <div className="flex gap-8">
      <LoadingState type="dots" message="Loading fun content..." />
      <LoadingState type="pulse" message="Getting ready..." />
    </div>
  ),
};

export const FullHeight: Story = {
  args: {
    type: 'spinner',
    message: 'Loading application...',
    fullHeight: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};