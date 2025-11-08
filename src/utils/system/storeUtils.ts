import { StoreApi } from 'zustand';

// Define the basic types for set and get from a Zustand store
type StoreSet<T> = StoreApi<T>['setState'];
type StoreGet<T> = StoreApi<T>['getState'];

// Define a base state that our async actions will operate on.
// Both event-store and favorites-store match this.
type BaseAsyncState = {
  error: string | null;
  isLoading: boolean;
  isSyncing: boolean;
};

/**
 * A generic helper for Zustand actions that handles 'isLoading'/'isSyncing'
 * states and basic error handling.
 *
 * @param set - The store's 'set' function.
 * @param get - The store's 'get' function.
 * @param stateKey - The *specific* key to toggle: 'isLoading' or 'isSyncing'.
 * @param action - The async function to run, which returns the new state on success.
 */
export async function handleAsyncAction<T extends BaseAsyncState>(
  set: StoreSet<T>,
  get: StoreGet<T>,
  stateKey: 'isLoading' | 'isSyncing' | 'isNetworkSearching',
  action: () => Promise<Partial<T>>
) {
  
  // Guard against concurrent 'isSyncing' actions...
  // We can directly access the property since we know the type.
  if (stateKey === 'isSyncing' && get().isSyncing) {
    console.log("[Async] Action skipped, already syncing.");
    return;
  }

  // Use computed property key. 'as Partial<T>' is needed because
  // TS can't perfectly merge { [stateKey]: boolean } and { error: null }
  set({ [stateKey]: true, error: null } as Partial<T>);

  try {
    const newState = await action();
    set({ ...newState, [stateKey]: false } as Partial<T>);
  } catch (err: any) {
    console.error(`[Async Action] Failed: ${err.message}`);
    set({ error: err.message, [stateKey]: false } as Partial<T>);
  }
}