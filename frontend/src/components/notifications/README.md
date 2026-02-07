# Notification Components

This directory contains UI components for displaying and managing notifications in the CanvaStencil platform, with specialized support for quote-related notifications.

## Components

### NotificationBell

A bell icon component with an unread count badge. Used in headers and navigation bars.

**Props:**
- `unreadCount: number` - Number of unread notifications
- `onClick?: () => void` - Click handler
- `className?: string` - Additional CSS classes
- `size?: 'sm' | 'md' | 'lg'` - Icon size (default: 'md')
- `variant?: 'ghost' | 'outline' | 'default'` - Button variant (default: 'ghost')

**Example:**
```tsx
import { NotificationBell } from '@/components/notifications';

function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  
  return (
    <NotificationBell 
      unreadCount={5} 
      onClick={() => setShowNotifications(true)}
      size="md"
    />
  );
}
```

### NotificationList

A scrollable list of notifications with actions for marking as read and deleting.

**Props:**
- `notifications: Notification[]` - Array of notifications to display
- `isLoading?: boolean` - Loading state
- `unreadCount?: number` - Number of unread notifications
- `onMarkAsRead?: (id: string) => void` - Mark as read handler
- `onMarkAllAsRead?: () => void` - Mark all as read handler
- `onDelete?: (id: string) => void` - Delete handler
- `onClose?: () => void` - Close handler
- `onViewAll?: () => void` - View all handler
- `className?: string` - Additional CSS classes
- `maxHeight?: string` - Max height for scroll area (default: '96')

**Example:**
```tsx
import { NotificationList } from '@/components/notifications';
import { useQuoteNotifications } from '@/hooks/useQuoteNotifications';

function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useQuoteNotifications();
  
  return (
    <NotificationList
      notifications={notifications}
      isLoading={isLoading}
      unreadCount={unreadCount}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDelete={deleteNotification}
      onViewAll={() => navigate('/admin/notifications')}
    />
  );
}
```

### NotificationCenter

Complete notification center with bell icon, popover, and notification list. Integrates real-time notifications.

**Props:**
- `className?: string` - Additional CSS classes

**Example:**
```tsx
import { NotificationCenter } from '@/components/notifications';

function AdminHeader() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <NotificationCenter className="ml-4" />
      </nav>
    </header>
  );
}
```

### QuoteNotificationItem

Specialized notification item for quote-related notifications. Automatically used by NotificationList for quote notifications.

**Supported notification types:**
- `quote_received` - New quote request from admin
- `quote_response` - Vendor responded (accept/reject/counter)
- `quote_expired` - Quote expired without response
- `quote_extended` - Quote expiration date extended

**Props:**
- `notification: Notification` - Notification object
- `onMarkAsRead?: (id: string) => void` - Mark as read handler
- `onDelete?: (id: string) => void` - Delete handler

**Example:**
```tsx
import { QuoteNotificationItem } from '@/components/notifications';

function QuoteNotifications({ notifications }) {
  return (
    <div>
      {notifications.map(notification => (
        <QuoteNotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

## Hooks

### useQuoteNotifications

Custom hook for managing quote-related notifications.

**Options:**
- `quoteUuid?: string` - Fetch notifications for specific quote
- `autoRefresh?: boolean` - Enable auto-refresh (default: false)
- `refreshInterval?: number` - Refresh interval in ms (default: 30000)

**Returns:**
- `notifications: Notification[]` - Array of notifications
- `unreadCount: number` - Number of unread notifications
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state
- `markAsRead: (id: string) => Promise<void>` - Mark as read
- `markAllAsRead: () => Promise<void>` - Mark all as read
- `deleteNotification: (id: string) => Promise<void>` - Delete notification
- `refresh: () => Promise<void>` - Refresh notifications

**Example:**
```tsx
import { useQuoteNotifications } from '@/hooks/useQuoteNotifications';

function QuoteDetail({ quoteUuid }) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    refresh
  } = useQuoteNotifications({ 
    quoteUuid,
    autoRefresh: true,
    refreshInterval: 30000
  });
  
  return (
    <div>
      <h2>Quote Notifications ({unreadCount})</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <NotificationList
          notifications={notifications}
          onMarkAsRead={markAsRead}
        />
      )}
    </div>
  );
}
```

## Notification Data Structure

```typescript
interface Notification {
  id: string;
  type: string;
  data: {
    // Order-related fields
    order_id?: number;
    order_uuid?: string;
    order_number?: string;
    old_status?: string;
    new_status?: string;
    message: string;
    is_critical?: boolean;
    changed_by?: string;
    reason?: string;
    
    // Quote-related fields
    quote_uuid?: string;
    quote_number?: string;
    customer_name?: string;
    vendor_name?: string;
    product_name?: string;
    quantity?: number;
    response_type?: 'accept' | 'reject' | 'counter';
    response_notes?: string;
    new_expires_at?: string;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}
```

## Integration with Quote Workflow

The notification components are designed to work seamlessly with the quote workflow:

1. **Admin creates quote** → No notification (draft state)
2. **Admin sends quote to vendor** → Vendor receives `quote_received` notification
3. **Vendor responds** → Admin receives `quote_response` notification
4. **Quote expires** → Admin receives `quote_expired` notification
5. **Admin extends quote** → Vendor receives `quote_extended` notification

## Styling

All components use Tailwind CSS and shadcn-ui components for consistent styling:
- Unread notifications have blue background (`bg-blue-50/50`)
- Quote notifications have left border indicator
- Icons and colors match notification type
- Responsive design for mobile and desktop

## Accessibility

- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus management in popovers

## Real-time Updates

The NotificationCenter component integrates with `useRealTimeNotifications` hook for real-time updates:
- WebSocket connection (when available)
- Polling fallback (30-second interval)
- Toast notifications for new items
- Sound notifications (optional)

## Testing

See test files for examples:
- Unit tests for individual components
- Integration tests for notification workflows
- Property-based tests for notification handling

## Requirements Validation

This implementation validates the following requirements from the quote-workflow-fixes spec:

- **Requirement 5.5**: Vendor logs in and sees unread notification count ✅
- **Requirement 5.6**: Vendor views notification and marks as read ✅
- **Requirement 5.4**: In-app notification record created ✅

## Future Enhancements

- Push notifications for mobile devices
- Notification preferences/settings
- Notification grouping by type
- Advanced filtering and search
- Notification history archive
