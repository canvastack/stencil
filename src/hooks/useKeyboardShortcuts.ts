import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description: string;
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 * @param shortcuts Array of keyboard shortcuts
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === (e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === e.altKey;
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.callback();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);

  return shortcuts;
};
