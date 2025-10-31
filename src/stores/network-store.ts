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
      // Immediately update the connection state.
      set({ isConnected: nowConnected, lastKnownState: state });

      // 2. Now that the state is updated, check if we *just* reconnected.
      if (!prevConnected && nowConnected) {
        console.log("🟢 Reconnected to the internet");
        set({ message: "Back online!" });
        if (reconnectCallback) {
          try {
            await reconnectCallback();
            console.log("[Network] Reconnect callback successful.");
          } catch (err) {
            console.error("[Network] Reconnect callback failed:", err);
          }
        }
      } else if (prevConnected && !nowConnected) {
        console.log("🔴 Disconnected from the internet");
        set({ message: "You're offline."});
      }
    });
  },
}));
