# Exchange Rate Notification System

This directory contains the notification system for the Dynamic Exchange Rate feature. The system provides color-coded toast notifications for quota warnings, provider switches, and fallback scenarios.

## Features

- **Color-coded notifications**: Orange (warning), Red (critical), Green (success), Yellow (fallback)
- **Auto-dismiss**: Notifications automatically dismiss after 5 seconds (configurable)
- **Queue management**: Maximum 5 notifications displayed at once
- **Manual dismissal**: Users can manually dismiss notifications
- **Real-time monitoring**: Automatic polling of quota status

## Usage

### Basic Notifications

```typescript
import { exchangeRateNotifications } from '@/services/notifications/exchangeRateNotifications';

// Show quota warning (orange)
exchangeRateNotifications.showQuotaWarning('exchangerate-api.com', 50);

// Show critical warning (red)
exchangeRateNotifications.showCriticalQuotaWarning(
  'exchangerate-api.com',
  20,
  'currencyapi.com',
  300
);

// Show provider switched (green)
exchangeRateNotifications.showProviderSwitched('currencyapi.com', 300);

// Show fallback notification (yellow)
exchangeRateNotifications.showFallbackNotification(15000, '2024-01-15');

// Show stale rate warning (yellow)
exchangeRateNotifications.showStaleRateWarning(15000, 10);

// Generic notifications
exchangeRateNotifications.showError('Something went wrong');
exchangeRateNotifications.showSuccess('Operation completed');
```

### Using the Notification Hook

The notification system is automatically enabled in the AdminLayout component. You can also use the hooks directly in your components:

```typescript
import { useExchangeRateNotificationSystem } from '@/hooks/useExchangeRateNotifications';

function MyComponent() {
  const { quotaStatuses, settings, handleProviderSwitch } = useExchangeRateNotificationSystem({
    enabled: true,
    quotaPollingInterval: 60000, // Poll every 60 seconds
    staleCheckInterval: 300000,  // Check every 5 minutes
  });

  // The hook automatically displays notifications based on quota status
  // You can also manually trigger provider switch notifications
  const onProviderChange = () => {
    handleProviderSwitch('old-provider', 'new-provider', 300);
  };

  return <div>...</div>;
}
```

### Individual Hooks

You can also use individual hooks for specific functionality:

```typescript
import {
  useExchangeRateNotifications,
  useProviderSwitchListener,
  useStaleRateCheck,
} from '@/hooks/useExchangeRateNotifications';

// Monitor quota status only
const { quotaStatuses } = useExchangeRateNotifications({ enabled: true });

// Listen for provider switches
const { handleProviderSwitch } = useProviderSwitchListener((oldProvider, newProvider) => {
  console.log(`Switched from ${oldProvider} to ${newProvider}`);
});

// Check for stale rates
const { settings } = useStaleRateCheck({ enabled: true });
```

## Notification Types

### Quota Warning (Orange)
- **Trigger**: Remaining quota ≤ 50 requests
- **Message**: "API quota running low: {provider} has {remaining} requests left this month"
- **Color**: Orange border and background

### Critical Quota Warning (Red)
- **Trigger**: Remaining quota ≤ 20 requests
- **Message**: "API quota critical: {provider} has {remaining} requests left. Will switch to {nextProvider} ({nextQuota} remaining)"
- **Color**: Red border and background

### Provider Switched (Green)
- **Trigger**: System automatically switches to new provider
- **Message**: "Switched to {provider} API ({quota} requests remaining)"
- **Color**: Green border and background

### Fallback Notification (Yellow)
- **Trigger**: All API quotas exhausted, using cached rate
- **Message**: "All API quotas exhausted. Using last known rate: 1 USD = Rp {rate} (updated: {date})"
- **Color**: Yellow border and background

### Stale Rate Warning (Yellow)
- **Trigger**: Cached rate is older than 7 days
- **Message**: "Warning: Exchange rate is {days} days old (1 USD = Rp {rate}). Consider updating manually."
- **Color**: Yellow border and background

## Configuration

### Notification Duration

Default duration is 5 seconds. You can customize it:

```typescript
exchangeRateNotifications.showQuotaWarning('provider', 50, {
  duration: 10000, // 10 seconds
});
```

### Dismissibility

Notifications are dismissible by default. You can disable manual dismissal:

```typescript
exchangeRateNotifications.showQuotaWarning('provider', 50, {
  dismissible: false,
});
```

### Polling Intervals

Customize polling intervals when using hooks:

```typescript
useExchangeRateNotificationSystem({
  enabled: true,
  quotaPollingInterval: 30000,  // Poll every 30 seconds
  staleCheckInterval: 600000,   // Check every 10 minutes
});
```

## Queue Management

The system maintains a maximum of 5 active notifications. When the queue is full:
1. The oldest notification is automatically dismissed
2. The new notification is displayed
3. Critical notifications (red) are prioritized

## Testing

The notification system includes comprehensive unit tests:

```bash
# Run notification tests
npm run test -- --run src/__tests__/unit/services/exchangeRateNotifications.test.ts
npm run test -- --run src/__tests__/unit/hooks/useExchangeRateNotifications.test.tsx
```

## Integration

The notification system is automatically integrated into the AdminLayout component via the `ExchangeRateNotificationMonitor` component. No additional setup is required for admin pages.

For custom integrations outside the admin layout, mount the monitor component:

```typescript
import { ExchangeRateNotificationMonitor } from '@/components/admin/ExchangeRateNotificationMonitor';

function MyLayout() {
  return (
    <div>
      <ExchangeRateNotificationMonitor />
      {/* Your content */}
    </div>
  );
}
```

## Requirements Validation

This notification system validates the following requirements:

- **Requirement 3.5**: Orange toast notification at 50 remaining requests
- **Requirement 3.6**: Red toast notification at 20 remaining requests
- **Requirement 4.2**: Green toast notification on provider switch
- **Requirement 5.4**: Yellow toast notification on fallback
- **Requirement 5.5**: Minimum 5 second display duration
- **Requirement 5.6**: Manual dismissal capability
