// src/stores/network-store.ts
import { create } from "zustand";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

type NetworkState = {
  isConnected: boolean;
  lastKnownState: NetInfoState | null;
  message: string | null;
  subscribe: () => void;
  setMessage: (msg: string | null) => void;
  registerReconnectCallback: (callback: () => Promise<void>) => void;
};

let reconnectCallback: (() => Promise<void>) | null = null;

export const useNetworkStatus = create<NetworkState>((set, get) => ({
  isConnected: true,
  lastKnownState: null,
  message: null,

  setMessage: (msg) => set({ message: msg }),

  registerReconnectCallback: (callback) => {
    reconnectCallback = callback;
  },

  subscribe: () => {
    NetInfo.fetch().then((state) => {
      set({
        isConnected: state.isConnected ?? false,
        lastKnownState: state,
      });
      console.log(
        state.isConnected
          ? "🟢 Connected to the internet"
          : "🔴 Disconnected from the internet"
      );
    });

    NetInfo.addEventListener(async (state) => {
      const prevConnected = get().isConnected;
      const nowConnected = state.isConnected ?? false;

      if (prevConnected !== nowConnected) {
        if (nowConnected) {
          console.log("🟢 Reconnected to the internet");
          set({ message: "Back online!" });

          // invoke the registered callback dynamically
          if (reconnectCallback) {
            await reconnectCallback();
          }
        } else {
          console.log("🔴 Disconnected from the internet");
          set({ message: "You're offline."});
        }
      }

      set({ isConnected: nowConnected, lastKnownState: state });
    });
  },
}));

