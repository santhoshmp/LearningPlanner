import type { Meta, StoryObj } from '@storybook/react';
import ProgressBar from './ProgressBar';

const meta = {
  title: 'StudyPlan/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    progress: 0,
    total: 100,
  },
};

export const HalfComplete: Story = {
  args: {
    progress: 50,
    total: 100,
  },
};

export const Complete: Story = {
  args: {
    progress: 100,
    total: 100,
  },
};

export const WithLabel: Story = {
  args: {
    progress: 75,
    total: 100,
    showLabel: true,
  },
};