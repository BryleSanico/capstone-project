// src/hooks/useNetworkReconnector.ts
import { useEffect, useRef } from "react";
import { useNetworkStatus } from "../stores/network-store";
import { useTickets } from "../stores/tickets-store";
import { useFavorites } from "../stores/favorites-store";
import { useEvents } from "../stores/event-store";

export function useNetworkReconnector() {
  const { isConnected, initialize } = useNetworkStatus();
  const { loadFavorites } = useFavorites();
  const { loadTickets } = useTickets();
  const { syncEvents } = useEvents();

  // To track the previous connection state
  const wasConnected = useRef(isConnected);
  useEffect(() => {
    // Start monitoring network changes
    const unsubscribe = initialize();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialize]);

  useEffect(() => {
    if (isConnected && !wasConnected.current) {
      console.log("🟢 Network reconnected — refreshing data...");
      syncEvents({ query: "", category: "All" });
      loadFavorites();
      loadTickets();
    } else if (!isConnected) {
      console.log("🔴 Network disconnected — offline mode");
    }
    wasConnected.current = isConnected;
  }, [isConnected, syncEvents, loadFavorites, loadTickets]);
}
