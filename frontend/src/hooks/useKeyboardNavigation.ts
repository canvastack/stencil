import { useState, useEffect, useCallback, useRef } from 'react';
import { announceNavigation } from '@/lib/utils/accessibility';

export interface KeyboardNavigationOptions {
  onSelect?: (index: number) => void;
  onEnter?: (index: number) => void;
  onEscape?: () => void;
  loop?: boolean;
  disabled?: boolean;
  announceItems?: boolean;
  itemName?: string;
}

/**
 * Hook untuk arrow key navigation dalam list
 * Mendukung:
 * - Arrow Up/Down untuk navigasi
 * - Home/End untuk jump ke awal/akhir
 * - Enter untuk select item
 * - Escape untuk clear selection
 * - Screen reader announcements
 */
export const useKeyboardNavigation = <T>(
  items: T[],
  options: KeyboardNavigationOptions = {}
) => {
  const {
    onSelect,
    onEnter,
    onEscape,
    loop = true,
    disabled = false,
    announceItems = true,
    itemName = 'item',
  } = options;

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const selectIndex = useCallback(
    (index: number, announce = true) => {
      if (items.length === 0) return;

      let newIndex = index;

      if (loop) {
        if (newIndex < 0) {
          newIndex = items.length - 1;
        } else if (newIndex >= items.length) {
          newIndex = 0;
        }
      } else {
        newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
      }

      setSelectedIndex(newIndex);
      
      if (announce && announceItems) {
        announceNavigation(newIndex, items.length, itemName);
      }

      onSelect?.(newIndex);
    },
    [items.length, loop, announceItems, itemName, onSelect]
  );

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Jangan handle jika sedang typing di input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setIsKeyboardMode(true);
          selectIndex(selectedIndex - 1);
          break;

        case 'ArrowDown':
          e.preventDefault();
          setIsKeyboardMode(true);
          selectIndex(selectedIndex + 1);
          break;

        case 'Home':
          e.preventDefault();
          setIsKeyboardMode(true);
          selectIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setIsKeyboardMode(true);
          selectIndex(items.length - 1);
          break;

        case 'Enter':
        case ' ':
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            e.preventDefault();
            onEnter?.(selectedIndex);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setSelectedIndex(-1);
          setIsKeyboardMode(false);
          onEscape?.();
          break;

        default:
          break;
      }
    };

    // Detect keyboard vs mouse usage
    const handleMouseMove = () => {
      setIsKeyboardMode(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [disabled, selectedIndex, items.length, selectIndex, onEnter, onEscape]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current && isKeyboardMode) {
      const items = containerRef.current.querySelectorAll('[data-keyboard-nav-item]');
      const selectedItem = items[selectedIndex] as HTMLElement;
      
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }
  }, [selectedIndex, isKeyboardMode]);

  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  return {
    selectedIndex,
    setSelectedIndex: selectIndex,
    clearSelection: () => {
      setSelectedIndex(-1);
      setIsKeyboardMode(false);
    },
    isKeyboardMode,
    setContainerRef,
    getItemProps: (index: number) => ({
      'data-keyboard-nav-item': true,
      'data-keyboard-selected': selectedIndex === index,
      'aria-selected': selectedIndex === index,
      tabIndex: selectedIndex === index ? 0 : -1,
    }),
  };
};

/**
 * Hook untuk grid keyboard navigation (2D navigation)
 */
export const useGridKeyboardNavigation = <T>(
  items: T[],
  columns: number,
  options: KeyboardNavigationOptions = {}
) => {
  const { onSelect, onEnter, onEscape, disabled = false } = options;
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      let newIndex = selectedIndex;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(0, selectedIndex - columns);
          break;

        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(items.length - 1, selectedIndex + columns);
          break;

        case 'ArrowLeft':
          e.preventDefault();
          newIndex = Math.max(0, selectedIndex - 1);
          break;

        case 'ArrowRight':
          e.preventDefault();
          newIndex = Math.min(items.length - 1, selectedIndex + 1);
          break;

        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;

        case 'Enter':
        case ' ':
          if (selectedIndex >= 0) {
            e.preventDefault();
            onEnter?.(selectedIndex);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setSelectedIndex(-1);
          onEscape?.();
          break;

        default:
          return;
      }

      if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < items.length) {
        setSelectedIndex(newIndex);
        onSelect?.(newIndex);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, selectedIndex, items.length, columns, onSelect, onEnter, onEscape]);

  return {
    selectedIndex,
    setSelectedIndex,
    clearSelection: () => setSelectedIndex(-1),
  };
};
