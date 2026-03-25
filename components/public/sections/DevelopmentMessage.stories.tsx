import type { Meta, StoryObj } from '@storybook/react';
import { DevelopmentMessage } from './DevelopmentMessage';

const meta: Meta<typeof DevelopmentMessage> = {
  title: 'Public/DevelopmentMessage',
  component: DevelopmentMessage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
