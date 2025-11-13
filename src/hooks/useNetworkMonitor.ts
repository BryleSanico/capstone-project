import { useEffect } from 'react';
import { useNetworkStatus } from '../stores/network-store';
import { useSyncEvents } from './useEvents'; // Import the new hook

export function useNetworkMonitor() {
  const { subscribe, registerReconnectCallback } = useNetworkStatus();

  // Call useSyncEvents with primitives 
  const { mutate: syncEvents, isPending } = useSyncEvents(
    '', // default query
    'All', // default category
  );

  useEffect(() => {
    // Define the reconnect logic
    const reconnectCallback = async () => {
      if (isPending) {
        console.log('[Reconnect] Sync already in progress, skipping.');
        return;
      }
      console.log('[Reconnect] Triggering event sync.');
      syncEvents(); // Call the mutation
    };

    // Register the callback
    registerReconnectCallback(reconnectCallback);

    // Start the global listener
    subscribe();
  }, [subscribe, registerReconnectCallback, syncEvents, isPending]);
}