// src/hooks/useNetworkReconnector.ts
import { useEffect } from "react";
import { useNetworkStatus } from "../stores/network-store";
import { useTickets } from "../stores/tickets-store";
import { useFavorites } from "../stores/favorites-store";
import { useEvents } from "../stores/event-store";

export function useNetworkReconnector() {
  const { isConnected, initialize } = useNetworkStatus();
  const { fetchEvents } = useEvents();
  const { loadFavorites } = useFavorites();
  const { loadTickets } = useTickets();

  useEffect(() => {
    // Start monitoring network changes
    const unsubscribe = initialize();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialize]);

  useEffect(() => {
    if (isConnected) {
      console.log("🟢 Network reconnected — refreshing data...");
      // Fetch only if network connected again
      fetchEvents({ query: "", category: "All" });
      loadFavorites();
      loadTickets();
    } else {
      console.log("🔴 Network disconnected — offline mode");
    }
  }, [isConnected]);
}
