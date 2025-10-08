// src/hooks/useNetworkReconnector.ts
import { useEffect } from "react";
import { useNetworkStatus } from "@/src/stores/network-store";
import { useEvents } from "@/src/stores/event-store";
import { useFavorites } from "@/src/stores/favorites-store";
import { useTickets } from "@/src/stores/tickets-store";

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
      // Fetch only if we’re connected again
      fetchEvents({ query: "", category: "All" });
      loadFavorites();
      loadTickets();
    } else {
      console.log("🔴 Network disconnected — offline mode");
    }
  }, [isConnected]);
}
