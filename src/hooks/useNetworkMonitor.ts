import { useEffect } from "react";
import { useNetworkStatus } from "../stores/network-store";

export function useNetworkMonitor() {
  const { subscribe } = useNetworkStatus();

  useEffect(() => {
    // Start the global listener once
    subscribe();
  }, [subscribe]);
}
