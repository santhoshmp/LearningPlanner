import type { Meta, StoryObj } from '@storybook/react';
import TextSizeAdjuster from './TextSizeAdjuster';

const meta = {
  title: 'Layout/TextSizeAdjuster',
  component: TextSizeAdjuster,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TextSizeAdjuster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomSizes: Story = {
  args: {
    sizes: ['small', 'medium', 'large', 'x-large'],
    defaultSize: 'medium',
  },
};