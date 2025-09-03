import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Save, Download, Delete, Add } from '@mui/icons-material';
import StandardButton from './StandardButton';
import { ThemeProvider } from '../../theme/ThemeContext';

const meta: Meta<typeof StandardButton> = {
  title: 'Components/StandardButton',
  component: StandardButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A standardized button component that adapts to parent/child themes with consistent styling and behavior.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
      description: 'Button variant style',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'],
      description: 'Button color theme',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    animation: {
      control: 'boolean',
      description: 'Enable hover animations',
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
type Story = StoryObj<typeof StandardButton>;

export const Default: Story = {
  args: {
    children: 'Default Button',
    onClick: action('clicked'),
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <StandardButton variant="contained">Contained</StandardButton>
      <StandardButton variant="outlined">Outlined</StandardButton>
      <StandardButton variant="text">Text</StandardButton>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <StandardButton color="primary">Primary</StandardButton>
      <StandardButton color="secondary">Secondary</StandardButton>
      <StandardButton color="success">Success</StandardButton>
      <StandardButton color="error">Error</StandardButton>
      <StandardButton color="warning">Warning</StandardButton>
      <StandardButton color="info">Info</StandardButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center flex-wrap">
      <StandardButton size="small">Small</StandardButton>
      <StandardButton size="medium">Medium</StandardButton>
      <StandardButton size="large">Large</StandardButton>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <StandardButton icon={<Save />} iconPosition="start">
        Save
      </StandardButton>
      <StandardButton icon={<Download />} iconPosition="end">
        Download
      </StandardButton>
      <StandardButton icon={<Add />} variant="outlined">
        Add Item
      </StandardButton>
      <StandardButton icon={<Delete />} variant="text" color="error">
        Delete
      </StandardButton>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <StandardButton>Normal</StandardButton>
      <StandardButton loading>Loading</StandardButton>
      <StandardButton loading loadingText="Saving...">
        Custom Loading
      </StandardButton>
      <StandardButton disabled>Disabled</StandardButton>
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-80">
      <StandardButton fullWidth>Full Width Button</StandardButton>
    </div>
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
    <div className="flex gap-4 flex-wrap">
      <StandardButton variant="contained">Primary</StandardButton>
      <StandardButton variant="outlined" color="secondary">Secondary</StandardButton>
      <StandardButton variant="text" icon={<Save />}>With Icon</StandardButton>
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
    <div className="flex gap-4 flex-wrap">
      <StandardButton variant="contained">Primary</StandardButton>
      <StandardButton variant="outlined" color="secondary">Secondary</StandardButton>
      <StandardButton variant="text" icon={<Save />}>With Icon</StandardButton>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    children: 'Click me!',
    onClick: action('button-clicked'),
    onMouseEnter: action('mouse-enter'),
    onMouseLeave: action('mouse-leave'),
    onFocus: action('focus'),
    onBlur: action('blur'),
  },
};