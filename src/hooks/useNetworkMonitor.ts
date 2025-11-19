import { useEffect } from 'react';
import { useNetworkStatus } from '../stores/network-store';
import { useQueryClient } from '@tanstack/react-query';

export function useNetworkMonitor() {
  const { subscribe, registerReconnectCallback } = useNetworkStatus();

  const queryClient = useQueryClient();

  useEffect(() => {
    // Define the reconnect logic
    const reconnectCallback = async () => {
+      await queryClient.invalidateQueries();
    };

    // Register the callback
    registerReconnectCallback(reconnectCallback);

    // Start the global listener
    subscribe();
  }, [subscribe, registerReconnectCallback]);
}