import { renderHook, waitFor, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce';
import { vi, describe, test, expect, beforeEach } from 'vitest';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  test('should debounce value changes with default 300ms delay', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('updated');
  });

  test('should handle rapid value changes and only apply the last one', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'change1' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'change2' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'change3' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('change3');
  });

  test('should work with custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });

  test('should debounce different value types (string, number, object)', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: { count: 0 } } }
    );

    expect(result.current).toEqual({ count: 0 });

    rerender({ value: { count: 1 } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toEqual({ count: 1 });
  });
});

describe('useDebouncedCallback Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should debounce callback execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current();
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should cancel previous callback when called multiple times', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current('first');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current('third');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });

  test('should cleanup timeout on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current();
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
