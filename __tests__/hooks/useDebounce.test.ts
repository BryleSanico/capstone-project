// Import Jest globals
import { jest, expect, describe, it, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../src/hooks/useDebounce';

describe('hooks/useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should not update value immediately when changed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    );

    expect(result.current).toBe('first');

    // Rerender with a new value
    rerender({ value: 'second', delay: 500 });

    // Value should still be the old one
    expect(result.current).toBe('first');
  });

  it('should update value after the delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    );

    rerender({ value: 'second', delay: 500 });

    // Advance timers by the exact delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now the value should be updated
    expect(result.current).toBe('second');
  });

  it('should reset the timer if the value changes within the delay period', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    );

    rerender({ value: 'second', delay: 500 });

    // Advance time, but not fully
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Rerender again, which resets the timer
    rerender({ value: 'third', delay: 500 });
    expect(result.current).toBe('first'); // Still the original value

    // Advance time by the full delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should now be 'third'
    expect(result.current).toBe('third');
  });
});