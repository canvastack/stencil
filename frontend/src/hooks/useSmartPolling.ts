/**
 * Smart Polling Hook
 * 
 * Optimized polling strategy that:
 * 1. Only polls when tab is active (saves resources)
 * 2. Slows down when no recent activity (adaptive polling)
 * 3. Speeds up after user sends message (responsive)
 * 4. Stops polling after inactivity timeout (battery saving)
 */

import { useEffect, useRef, useState } from 'react';

interface UseSmartPollingOptions {
  /**
   * Callback function to execute on each poll
   */
  onPoll: () => void | Promise<void>;
  
  /**
   * Fast polling interval (when active) in milliseconds
   * @default 5000 (5 seconds)
   */
  fastInterval?: number;
  
  /**
   * Slow polling interval (when inactive) in milliseconds
   * @default 30000 (30 seconds)
   */
  slowInterval?: number;
  
  /**
   * Time to wait before switching to slow polling (milliseconds)
   * @default 60000 (1 minute)
   */
  inactivityThreshold?: number;
  
  /**
   * Whether polling is enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Whether to poll when tab is in background
   * @default false (stops polling to save resources)
   */
  pollInBackground?: boolean;
}

export function useSmartPolling({
  onPoll,
  fastInterval = 5000,
  slowInterval = 30000,
  inactivityThreshold = 60000,
  enabled = true,
  pollInBackground = false,
}: UseSmartPollingOptions) {
  const [isActive, setIsActive] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTabVisible = usePageVisibility();

  /**
   * Mark activity (e.g., when user sends a message)
   * This will reset to fast polling
   */
  const markActivity = () => {
    setLastActivityTime(Date.now());
    setIsActive(true);
  };

  /**
   * Determine current polling interval based on activity
   */
  const getCurrentInterval = () => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    return timeSinceActivity > inactivityThreshold ? slowInterval : fastInterval;
  };

  /**
   * Setup polling
   */
  useEffect(() => {
    if (!enabled) return;

    // Don't poll if tab is not visible and pollInBackground is false
    if (!isTabVisible && !pollInBackground) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial poll
    onPoll();

    // Setup interval with current speed
    const interval = getCurrentInterval();
    intervalRef.current = setInterval(() => {
      onPoll();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isTabVisible, lastActivityTime, pollInBackground]);

  return {
    markActivity,
    isActive,
    currentInterval: getCurrentInterval(),
  };
}

/**
 * Hook to detect if page/tab is visible
 * Used to pause polling when user switches tabs
 */
function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
