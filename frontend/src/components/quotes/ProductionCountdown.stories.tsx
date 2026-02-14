/**
 * ProductionCountdown Storybook Stories
 * 
 * Visual documentation and testing for the ProductionCountdown component.
 * Demonstrates various production timeline states.
 * 
 * NOTE: This file requires @storybook/react to be installed.
 * Install with: npm install --save-dev @storybook/react @storybook/react-vite
 */

// @ts-nocheck - Storybook types not yet installed
import type { Meta, StoryObj } from '@storybook/react';
import { ProductionCountdown } from './ProductionCountdown';
import { subDays } from 'date-fns';

const meta = {
  title: 'Components/Quotes/ProductionCountdown',
  component: ProductionCountdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays production progress with countdown timer for vendor quote acceptance. Shows days elapsed, days remaining, progress bar, and overdue warnings.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    acceptedDate: {
      control: 'text',
      description: 'ISO 8601 date string when the quote was accepted',
    },
    estimatedDays: {
      control: { type: 'number', min: 1, max: 90 },
      description: 'Estimated number of days for production',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof ProductionCountdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * On Track - Production is progressing well with more than 3 days remaining.
 * Shows green progress indicator and no warnings.
 */
export const OnTrack: Story = {
  args: {
    acceptedDate: subDays(new Date(), 5).toISOString(),
    estimatedDays: 14,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is on track with more than 3 days remaining. Progress bar is green and no warnings are displayed.',
      },
    },
  },
};

/**
 * Approaching Deadline - Production has 1-3 days remaining.
 * Shows orange progress indicator and approaching deadline warning.
 */
export const ApproachingDeadline: Story = {
  args: {
    acceptedDate: subDays(new Date(), 12).toISOString(),
    estimatedDays: 14,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is approaching the deadline with only 2 days remaining. Progress bar is orange and a warning alert is displayed.',
      },
    },
  },
};

/**
 * One Day Remaining - Critical deadline approaching.
 * Shows orange progress indicator with 1 day remaining warning.
 */
export const OneDayRemaining: Story = {
  args: {
    acceptedDate: subDays(new Date(), 13).toISOString(),
    estimatedDays: 14,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production has only 1 day remaining before the deadline. Shows critical warning with singular "day" text.',
      },
    },
  },
};

/**
 * Overdue - Production has passed the estimated delivery date.
 * Shows red progress indicator and overdue warning with days count.
 */
export const Overdue: Story = {
  args: {
    acceptedDate: subDays(new Date(), 20).toISOString(),
    estimatedDays: 14,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is overdue by 6 days. Progress bar is red and a critical alert is displayed with the number of overdue days.',
      },
    },
  },
};

/**
 * Just Accepted - Production just started (0 days elapsed).
 * Shows green progress indicator at 0% with full time remaining.
 */
export const JustAccepted: Story = {
  args: {
    acceptedDate: new Date().toISOString(),
    estimatedDays: 14,
  },
  parameters: {
    docs: {
      description: {
        story: 'Quote was just accepted today. Shows 0 days elapsed and full estimated days remaining.',
      },
    },
  },
};

/**
 * Short Timeline - Production with only 3 days total.
 * Demonstrates behavior with short production timelines.
 */
export const ShortTimeline: Story = {
  args: {
    acceptedDate: subDays(new Date(), 1).toISOString(),
    estimatedDays: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production with a short 3-day timeline. Shows 1 day elapsed, 2 days remaining.',
      },
    },
  },
};

/**
 * Long Timeline - Production with extended 60-day timeline.
 * Demonstrates behavior with longer production periods.
 */
export const LongTimeline: Story = {
  args: {
    acceptedDate: subDays(new Date(), 15).toISOString(),
    estimatedDays: 60,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production with a long 60-day timeline. Shows 15 days elapsed, 45 days remaining.',
      },
    },
  },
};

/**
 * Halfway Complete - Production at 50% completion.
 * Shows progress bar at exactly 50%.
 */
export const HalfwayComplete: Story = {
  args: {
    acceptedDate: subDays(new Date(), 10).toISOString(),
    estimatedDays: 20,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is exactly halfway complete. Progress bar shows 50%.',
      },
    },
  },
};

/**
 * Nearly Complete - Production at 90% completion.
 * Shows progress bar near completion with 1 day remaining.
 */
export const NearlyComplete: Story = {
  args: {
    acceptedDate: subDays(new Date(), 19).toISOString(),
    estimatedDays: 20,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is nearly complete at 95%. Shows 1 day remaining with approaching deadline warning.',
      },
    },
  },
};

/**
 * Severely Overdue - Production significantly past deadline.
 * Shows red progress indicator with large overdue count.
 */
export const SeverelyOverdue: Story = {
  args: {
    acceptedDate: subDays(new Date(), 44).toISOString(),
    estimatedDays: 14,
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is severely overdue by 30 days. Shows critical alert with large overdue count.',
      },
    },
  },
};

/**
 * With Custom Styling - Component with custom className.
 * Demonstrates className prop usage.
 */
export const WithCustomStyling: Story = {
  args: {
    acceptedDate: subDays(new Date(), 7).toISOString(),
    estimatedDays: 14,
    className: 'p-6 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-950',
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with custom styling applied via className prop. Shows how the component can be styled to match different contexts.',
      },
    },
  },
};

/**
 * Dark Mode - Component in dark mode.
 * Demonstrates dark mode styling.
 */
export const DarkMode: Story = {
  args: {
    acceptedDate: subDays(new Date(), 5).toISOString(),
    estimatedDays: 14,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Component displayed in dark mode. All colors and contrasts are optimized for dark backgrounds.',
      },
    },
  },
  decorators: [
    (Story: any) => (
      <div className="dark">
        <div className="bg-gray-900 p-6 rounded-lg">
          <Story />
        </div>
      </div>
    ),
  ],
};

/**
 * Mobile View - Component in mobile viewport.
 * Demonstrates responsive behavior on small screens.
 */
export const MobileView: Story = {
  args: {
    acceptedDate: subDays(new Date(), 5).toISOString(),
    estimatedDays: 14,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Component displayed in mobile viewport. Layout remains readable and functional on small screens.',
      },
    },
  },
};
