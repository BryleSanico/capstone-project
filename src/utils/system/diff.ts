/**
 * An interface representing the difference between two sets of data.
 */
interface DiffResult<T> {
  added: T[];
  removed: T[];
}

/**
 * Compares an initial Set with a current array to find what items were
 * added and what items were removed.
 * @param initialSet The original Set of items.
 * @param currentArray The latest array of items.
 * @returns An object containing arrays of 'added' and 'removed' items.
 */
export function diffSets<T>(initialSet: Set<T>, currentArray: T[]): DiffResult<T> {
  const currentSet = new Set(currentArray);

  const added = currentArray.filter(item => !initialSet.has(item));
  const removed = Array.from(initialSet).filter(item => !currentSet.has(item));

  return { added, removed };
}
