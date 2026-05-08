import type { Meta, StoryObj } from '@storybook/react';
import { DailyOperations } from './DailyOperations';
import { TooltipProvider } from '@/components/ui/tooltip';

const meta: Meta<typeof DailyOperations> = {
  title: 'Dashboard/DailyOperations',
  component: DailyOperations,
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={0}>
        <div className="p-6 bg-slate-50 min-h-screen">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DailyOperations>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        // Mock the API response
        /*
        Note: I'll need to make sure MSW is set up in Storybook or just mock the fetch in the component if I want to be quick,
        but usually Storybook has its own ways.
        For this verification, I will just create the story and see if it renders with the loading state at least,
        or I can try to mock the global fetch in the story file.
        */
      ],
    },
  },
};
