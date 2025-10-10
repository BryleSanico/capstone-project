import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

type NetworkState = {
  isConnected: boolean;
  initialize: () => () => void; // The function returns an unsubscribe function for cleanup
};

export const useNetworkStatus = create<NetworkState>((set) => ({
  isConnected: true, // Assume online by default
  initialize: () => {
    // Subscribe to network state changes and update the store
    const unsubscribe = NetInfo.addEventListener(state => {
      set({ isConnected: state.isConnected ?? false });
    });

    // Also fetch the initial state when initialized
    NetInfo.fetch().then(state => {
      set({ isConnected: state.isConnected ?? false });
    });
    
    return unsubscribe;
  },
}));
