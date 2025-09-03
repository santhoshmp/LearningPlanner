# Visual Regression Testing Guide

This document explains how to use the visual regression testing setup in the AI Study Planner project.

## Overview

Visual regression testing helps ensure that UI components maintain their visual appearance across code changes. Our setup uses:

- **Storybook**: For component documentation and testing
- **Chromatic**: For visual regression testing and UI review

## Getting Started

### Local Development

1. **Run Storybook locally**:
   ```bash
   npm run storybook
   ```
   This will start Storybook on port 6006. Open http://localhost:6006 to view your component library.

2. **Create stories for components**:
   Create `.stories.tsx` files alongside your components. See existing stories for examples.

### Running Visual Tests

1. **Set up Chromatic**:
   You'll need a Chromatic project token. Set it as an environment variable:
   ```bash
   export CHROMATIC_PROJECT_TOKEN=your_token_here
   ```

2. **Run visual tests**:
   ```bash
   npm run chromatic
   ```
   This will build Storybook and upload snapshots to Chromatic for comparison.

3. **Automated testing**:
   Visual tests run automatically on pull requests via GitHub Actions.

## Best Practices

1. **Create stories for all UI components**:
   - Include different states and variations
   - Test edge cases (empty states, error states, etc.)

2. **Review visual changes carefully**:
   - Use Chromatic's UI to approve or reject changes
   - Document intentional visual changes in PR descriptions

3. **Maintain baseline snapshots**:
   - Regularly update baselines after approved changes
   - Keep the baseline branch (main) clean

## Creating Stories

Follow this pattern for creating component stories:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import YourComponent from './YourComponent';

const meta = {
  title: 'Category/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered', // or 'fullscreen' for larger components
  },
  tags: ['autodocs'],
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const Variation: Story = {
  args: {
    // Different props for this variation
  },
};
```

## Troubleshooting

- **Storybook fails to start**: Check for dependency conflicts or port issues
- **Chromatic upload fails**: Verify your project token and network connection
- **Unexpected visual changes**: Check for global style changes or theme updates