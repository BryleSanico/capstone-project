import { useRef, useEffect } from 'react';

/**
 * A custom hook that tracks the previous value of a state or prop.
 * This is a standard React utility hook.
 * @param value The value to track (e.g., the `isConnected` boolean).
 * @returns The value from the previous render.
 */
export function usePrevious<T>(value: T): T | undefined {
  // Create a ref that can hold a value of type T or undefined, initialized to undefined.
  const ref = useRef<T | undefined>(undefined);

  // Store current value in ref after every render.
  useEffect(() => {
    ref.current = value;
  }, [value]); // Re-run only when value changes.

  // Return the value from the previous render (before the useEffect cleanup ran).
  return ref.current;
}

