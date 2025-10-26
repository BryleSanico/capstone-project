import { useEffect } from "react";
import { useNetworkStatus } from "../stores/network-store";
import { useEvents } from "../stores/event-store"; // Import the event store

export function useNetworkMonitor() {
  const { subscribe, registerReconnectCallback } = useNetworkStatus();

  useEffect(() => {
    // 1. Define the reconnect logic that was in event-store.ts
    const reconnectCallback = async () => {
      const store = useEvents.getState(); // Get event store state

      // Re-enable pagination if it was closed
      if (!store.hasMore) {
        useEvents.setState({ hasMore: true });
      }

      if (store._fullEventCache.length === 0) {
        console.log("[Reconnect] Event cache is empty. Triggering initial load.");
        await store.loadInitialEvents({ query: "", category: "All" });
      } else {
        // Just sync if we have data
        await store.syncEvents({ query: "", category: "All" });
      }
    };

    // 2. Register the callback
    registerReconnectCallback(reconnectCallback);
    
    // 3. Start the global listener
    subscribe();
    
  }, [subscribe, registerReconnectCallback]); // Add all dependencies
}