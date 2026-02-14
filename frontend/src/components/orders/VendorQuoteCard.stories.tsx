/**
 * VendorQuoteCard Storybook Stories
 * 
 * Visual documentation and testing for the VendorQuoteCard component.
 * Demonstrates various vendor quote states on Order Detail page.
 * 
 * NOTE: This file requires @storybook/react to be installed.
 * Install with: npm install --save-dev @storybook/react @storybook/react-vite
 */

// @ts-nocheck - Storybook types not yet installed
import type { Meta, StoryObj } from '@storybook/react';
import { VendorQuoteCard } from './VendorQuoteCard';
import { subDays } from 'date-fns';
import { BrowserRouter } from 'react-router-dom';

const meta = {
  title: 'Components/Orders/VendorQuoteCard',
  component: VendorQuoteCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays vendor quote information on Order Detail page. Shows quote status, vendor details, agreed terms, and production progress when quote is accepted.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <BrowserRouter>
        <div className="w-[400px]">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  argTypes: {
    order: {
      description: 'Order object containing vendor quote information',
      control: 'object',
    },
  },
} satisfies Meta<typeof VendorQuoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Accepted Quote with Production Progress
 * 
 * Shows a fully accepted quote with vendor details, agreed terms,
 * and active production countdown. This is the primary use case
 * after a vendor accepts a quote.
 */
export const AcceptedQuoteWithProgress: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440000',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_quote_accepted_at: subDays(new Date(), 5).toISOString(),
      vendor_agreed_price: 15000000, // 150,000 IDR in cents
      vendor_estimated_delivery_days: 14,
      vendor_name: 'PT Etching Specialist Indonesia',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Quote has been accepted by the vendor. Shows agreed price, estimated delivery, and production progress countdown. This is the most common state after successful negotiation.',
      },
    },
  },
};

/**
 * Accepted Quote - On Track
 * 
 * Production is progressing well with plenty of time remaining.
 * Shows green progress indicators.
 */
export const AcceptedQuoteOnTrack: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440001',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_quote_accepted_at: subDays(new Date(), 3).toISOString(),
      vendor_agreed_price: 25000000,
      vendor_estimated_delivery_days: 21,
      vendor_name: 'CV Metalworks Premium',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is on track with more than 3 days remaining. Progress bar shows green status.',
      },
    },
  },
};

/**
 * Accepted Quote - Approaching Deadline
 * 
 * Production is nearing completion with 1-3 days remaining.
 * Shows orange warning indicators.
 */
export const AcceptedQuoteApproachingDeadline: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440002',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_quote_accepted_at: subDays(new Date(), 12).toISOString(),
      vendor_agreed_price: 18500000,
      vendor_estimated_delivery_days: 14,
      vendor_name: 'UD Laser Engraving Jaya',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is approaching deadline with 1-3 days remaining. Shows orange warning status to alert admin.',
      },
    },
  },
};

/**
 * Accepted Quote - Overdue
 * 
 * Production has exceeded the estimated delivery date.
 * Shows red alert indicators.
 */
export const AcceptedQuoteOverdue: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440003',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_quote_accepted_at: subDays(new Date(), 18).toISOString(),
      vendor_agreed_price: 12000000,
      vendor_estimated_delivery_days: 14,
      vendor_name: 'PT Custom Fabrication',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Production is overdue. Shows red alert status with overdue days count to prompt immediate action.',
      },
    },
  },
};

/**
 * Pending Quote
 * 
 * Quote has been sent to vendor but not yet accepted.
 * Shows pending status without production progress.
 */
export const PendingQuote: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440004',
      vendor_quote_status: 'sent',
      vendor_quote_status_label: 'Sent to Vendor',
      vendor_name: 'CV Precision Etching',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Quote has been sent to vendor but awaiting response. No production progress shown as quote is not yet accepted.',
      },
    },
  },
};

/**
 * Countered Quote
 * 
 * Vendor has countered the quote with different terms.
 * Shows warning status indicating negotiation in progress.
 */
export const CounteredQuote: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440005',
      vendor_quote_status: 'countered',
      vendor_quote_status_label: 'Countered by Vendor',
      vendor_name: 'UD Metalworks Express',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Vendor has countered the quote. Shows warning status to indicate active negotiation requiring admin attention.',
      },
    },
  },
};

/**
 * Rejected Quote
 * 
 * Vendor has rejected the quote.
 * Shows destructive status indicating quote was declined.
 */
export const RejectedQuote: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440006',
      vendor_quote_status: 'rejected',
      vendor_quote_status_label: 'Rejected by Vendor',
      vendor_name: 'PT Industrial Etching',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Vendor has rejected the quote. Shows destructive status indicating quote was declined and alternative vendor needed.',
      },
    },
  },
};

/**
 * No Vendor Quote
 * 
 * Order has no associated vendor quote.
 * Component returns null and renders nothing.
 */
export const NoVendorQuote: Story = {
  args: {
    order: {
      // No vendor_quote_uuid - component should not render
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Order has no vendor quote associated. Component gracefully returns null and renders nothing. This is the default state for new orders.',
      },
    },
  },
};

/**
 * Accepted Quote - Minimal Data
 * 
 * Accepted quote with minimal information.
 * Tests graceful handling of missing optional fields.
 */
export const AcceptedQuoteMinimalData: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440007',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      // Missing: vendor_name, vendor_agreed_price, vendor_estimated_delivery_days
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Accepted quote with minimal data. Tests component resilience when optional fields are missing.',
      },
    },
  },
};

/**
 * Mobile View - Accepted Quote
 * 
 * Demonstrates responsive behavior on mobile devices.
 */
export const MobileViewAccepted: Story = {
  args: {
    order: {
      vendor_quote_uuid: '550e8400-e29b-41d4-a716-446655440008',
      vendor_quote_status: 'accepted',
      vendor_quote_status_label: 'Accepted',
      vendor_quote_accepted_at: subDays(new Date(), 7).toISOString(),
      vendor_agreed_price: 20000000,
      vendor_estimated_delivery_days: 21,
      vendor_name: 'PT Etching Solutions',
    },
  },
  decorators: [
    (Story: any) => (
      <BrowserRouter>
        <div className="w-[320px]">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile responsive view of accepted quote card. Tests touch-friendly interactions and compact layout.',
      },
    },
  },
};
  