
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../stores/network-store';
import { useQueryClient } from '@tanstack/react-query';

export function useNetworkMonitor() {
  const { subscribe, registerReconnectCallback, isConnected } = useNetworkStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    const reconnectCallback = async () => {
      console.log('[NetworkMonitor] Reconnect detected. Invalidating queries...');
      await queryClient.invalidateQueries();
    };

    registerReconnectCallback(reconnectCallback);
    const unsubscribeNetInfo = subscribe();

    // When the app comes from background -> foreground, force a check.
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[NetworkMonitor] App became active. Forcing network check...');
        
        NetInfo.fetch().then((state) => {
          // If the store detected offline, but the OS says online
          // Force an update to "unstick" it.
          if (state.isConnected && !isConnected) {
             console.log('[NetworkMonitor] unstuck: Force-updating state to ONLINE');
             // This will trigger the store's listener, then call reconnectCallback
             useNetworkStatus.setState({ 
               isConnected: true, 
               lastKnownState: state 
             });
             // Manually trigger sync just in case
             reconnectCallback();
          }
        });
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [subscribe, registerReconnectCallback, queryClient, isConnected]);
}