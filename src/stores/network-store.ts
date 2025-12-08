import { create } from "zustand";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { logger } from "../utils/system/logger";

type NetworkState = {
  isConnected: boolean;
  lastKnownState: NetInfoState | null;
  message: string | null;
  subscribe: () => () => void;
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
    // Initial fetch (Fire and forget)
    NetInfo.fetch().then((state) => {
      set({
        isConnected: state.isConnected ?? false,
        lastKnownState: state,
      });
      logger.info(
        state.isConnected
          ? "🟢 Connected to the internet"
          : "🔴 Disconnected from the internet"
      );
    });

    // Listener
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const prevConnected = get().isConnected;
      const nowConnected = state.isConnected ?? false;

      // Immediately update state
      set({ isConnected: nowConnected, lastKnownState: state });

      // Check for transitions
      if (!prevConnected && nowConnected) {
        logger.info("🟢 Reconnected to the internet");
        set({ message: "Back online!" });
        if (reconnectCallback) {
          try {
            await reconnectCallback();
            logger.info("[Network] Reconnect callback successful.");
          } catch (err) {
            logger.error("[Network] Reconnect callback failed:", err);
          }
        }
      } else if (prevConnected && !nowConnected) {
        logger.info("🔴 Disconnected from the internet");
        set({ message: "You're offline." });
      }
    });
    return unsubscribe;
  },
}));