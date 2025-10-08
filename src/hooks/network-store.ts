import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

type NetworkState = {
  isConnected: boolean;
  initialize: () => void;
};

export const useNetworkStatus = create<NetworkState>((set) => ({
  isConnected: true, // Assume online by default
  initialize: () => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      set({ isConnected: state.isConnected ?? false });
    });
    
    // The initialize function can be called once, for example, in App.tsx
    // For simplicity, we can let it be called by the stores that need it.
    return unsubscribe;
  },
}));

// Initialize the network listener as soon as the app loads
useNetworkStatus.getState().initialize();
