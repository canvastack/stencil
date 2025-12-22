import { useState, useRef, useCallback, TouchEvent } from 'react';
import { announceToScreenReader } from '@/lib/utils/accessibility';

interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  announceSwipe?: boolean;
}

interface SwipeState {
  isSwiping: boolean;
  swipeX: number;
  swipeY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export const useSwipeGestures = (config: SwipeGestureConfig = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    announceSwipe = false,
  } = config;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    swipeX: 0,
    swipeY: 0,
    direction: null,
  });

  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setSwipeState((prev) => ({ ...prev, isSwiping: true }));
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeState.isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const deltaX = currentX - touchStart.current.x;
    const deltaY = currentY - touchStart.current.y;

    setSwipeState((prev) => ({
      ...prev,
      swipeX: deltaX,
      swipeY: deltaY,
    }));
  }, [swipeState.isSwiping]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isSwiping) return;

    const deltaX = swipeState.swipeX;
    const deltaY = swipeState.swipeY;

    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;

    if (isHorizontalSwipe && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        direction = 'right';
        onSwipeRight?.();
        if (announceSwipe) announceToScreenReader('Swiped right');
      } else {
        direction = 'left';
        onSwipeLeft?.();
        if (announceSwipe) announceToScreenReader('Swiped left');
      }
    } else if (isVerticalSwipe && Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        direction = 'down';
        onSwipeDown?.();
        if (announceSwipe) announceToScreenReader('Swiped down');
      } else {
        direction = 'up';
        onSwipeUp?.();
        if (announceSwipe) announceToScreenReader('Swiped up');
      }
    }

    setSwipeState({
      isSwiping: false,
      swipeX: 0,
      swipeY: 0,
      direction,
    });
  }, [swipeState.swipeX, swipeState.swipeY, swipeState.isSwiping, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, announceSwipe]);

  const resetSwipe = useCallback(() => {
    setSwipeState({
      isSwiping: false,
      swipeX: 0,
      swipeY: 0,
      direction: null,
    });
  }, []);

  return {
    swipeState,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    resetSwipe,
  };
};

export const useSwipeToDelete = (onDelete: () => void, threshold: number = 100) => {
  const { swipeState, swipeHandlers, resetSwipe } = useSwipeGestures({
    threshold,
    announceSwipe: true,
  });

  const handleSwipeEnd = useCallback(() => {
    if (Math.abs(swipeState.swipeX) > threshold) {
      onDelete();
      announceToScreenReader('Item deleted');
    } else {
      resetSwipe();
    }
  }, [swipeState.swipeX, threshold, onDelete, resetSwipe]);

  const deleteProgress = Math.min(Math.abs(swipeState.swipeX) / threshold, 1);
  const shouldDelete = deleteProgress >= 1;

  return {
    swipeState,
    swipeHandlers: {
      ...swipeHandlers,
      onTouchEnd: handleSwipeEnd,
    },
    deleteProgress,
    shouldDelete,
    resetSwipe,
  };
};

export const useSwipeActions = (actions: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}) => {
  const { swipeState, swipeHandlers } = useSwipeGestures({
    onSwipeLeft: actions.onSwipeLeft,
    onSwipeRight: actions.onSwipeRight,
    threshold: actions.threshold,
    announceSwipe: true,
  });

  return {
    swipeState,
    swipeHandlers,
    getSwipeStyle: () => ({
      transform: `translateX(${swipeState.swipeX}px)`,
      transition: swipeState.isSwiping ? 'none' : 'transform 0.3s ease',
    }),
  };
};
