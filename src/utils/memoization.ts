import { useCallback, useRef, useMemo } from 'react';

/**
 * Hook to create a stable event handler that doesn't change on every render
 */
export function useStableEventHandler<T extends (...args: unknown[]) => unknown>(
  handler: T
): T {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  return useCallback(
    ((...args: unknown[]) => handlerRef.current(...args)) as T,
    []
  );
}

/**
 * Hook to create a stable reference that doesn't change on every render
 */
export function useStableReference<T>(value: T): T {
  const ref = useRef(value);
  ref.current = value;
  return ref.current;
}

/**
 * Hook to memoize array creation with deep equality checking
 */
export function useMemoizedArray<T>(
  factory: () => T[],
  deps: React.DependencyList
): T[] {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(), [factory, ...deps]);
}