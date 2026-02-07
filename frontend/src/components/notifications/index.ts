/**
 * Notification Components
 * 
 * This module provides UI components for displaying and managing notifications
 * in the CanvaStencil platform, with specialized support for quote-related notifications.
 * 
 * Components:
 * - NotificationBell: Bell icon with unread count badge
 * - NotificationList: Scrollable list of notifications with actions
 * - NotificationCenter: Complete notification center with popover
 * - QuoteNotificationItem: Specialized rendering for quote notifications
 * 
 * Usage:
 * ```tsx
 * import { NotificationBell, NotificationList } from '@/components/notifications';
 * 
 * function Header() {
 *   return (
 *     <NotificationBell 
 *       unreadCount={5} 
 *       onClick={() => setShowNotifications(true)}
 *     />
 *   );
 * }
 * ```
 */

export { NotificationBell } from './NotificationBell';
export { NotificationList } from './NotificationList';
export { NotificationCenter } from './NotificationCenter';
export { QuoteNotificationItem } from './QuoteNotificationItem';
