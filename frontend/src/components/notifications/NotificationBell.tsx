import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  unreadCount: number;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
}

/**
 * NotificationBell Component
 * 
 * Displays a bell icon with an unread notification count badge.
 * Used in headers and navigation bars to indicate pending notifications.
 * 
 * Features:
 * - Displays unread count badge (shows 99+ for counts over 99)
 * - Configurable size and variant
 * - Accessible button with proper ARIA labels
 * - Animated badge for visual feedback
 * 
 * @example
 * ```tsx
 * <NotificationBell 
 *   unreadCount={5} 
 *   onClick={() => setShowNotifications(true)}
 * />
 * ```
 */
export function NotificationBell({
  unreadCount,
  onClick,
  className,
  size = 'md',
  variant = 'ghost'
}: NotificationBellProps) {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const badgeSizes = {
    sm: 'h-4 w-4 text-[10px]',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  const badgePositions = {
    sm: '-top-1 -right-1',
    md: '-top-1 -right-1',
    lg: '-top-2 -right-2'
  };

  return (
    <Button
      variant={variant}
      size={size === 'sm' ? 'sm' : 'icon'}
      onClick={onClick}
      className={cn('relative', className)}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className={iconSizes[size]} />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className={cn(
            'absolute rounded-full p-0 flex items-center justify-center',
            'animate-in fade-in zoom-in duration-200',
            badgeSizes[size],
            badgePositions[size]
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
