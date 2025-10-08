import { create } from "zustand";
import storageService from "../services/storageService";
import { favoritesService } from "../services/favoritesService";
import { Alert } from "react-native";
import { getCurrentSession } from "../utils/sessionHelper";
import { useNetworkStatus } from "./network-store";
import { Event } from "@/src/types/event";

// Use two distinct keys to separate guest and logged-in user data
const GUEST_FAVORITES_KEY = "guest_favorite_events";
const USER_FAVORITES_KEY_PREFIX = "user_favorites"; 
const EVENTS_CACHE_KEY = "events_cache";

type FavoritesState = {
  favorites: number[];
  isLoading: boolean;
  unsyncedIds: number[]; 
  loadFavorites: () => Promise<void>;
  toggleFavorite: (event: Event) => Promise<void>;
  syncGuestFavorites: () => Promise<void>;
  checkForUnsyncedFavorites: () => Promise<void>;
};

export const useFavorites = create<FavoritesState>()((set, get) => ({
  favorites: [],
  isLoading: false,
  unsyncedIds: [],

  loadFavorites: async () => {
    set({ isLoading: true });
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    const { isConnected } = useNetworkStatus.getState();

    let ids: number[] = [];
    // Determine the correct local storage key
    const storageKey = userId ? `${USER_FAVORITES_KEY_PREFIX}${userId}` : GUEST_FAVORITES_KEY;
    
    if (userId && isConnected) {
         // ONLINE & LOGGED IN: Fetch from DB, with local cache as fallback
      try {
        ids = await favoritesService.getFavorites();
        await storageService.setItem(storageKey, ids);
      } catch (error) {
        console.log("Offline Fallback: Failed to load favorites from DB, using local cache.", error);
        ids = await storageService.getItem<number[]>(storageKey) || [];
      }
    } else {
      // OFFLINE or GUEST: Load directly from local storage
      ids = await storageService.getItem<number[]>(storageKey) || [];
    }
    set({ favorites: ids, isLoading: false });
  },

  checkForUnsyncedFavorites: async () => {
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    if (!userId) return;

    // Load both the user's current DB favorites and the guest favorites
    const userFavorites = get().favorites;
    const guestFavorites = await storageService.getItem<number[]>(GUEST_FAVORITES_KEY) || [];

    // Find favorites that exist in guest storage but not in the user's account
    const newFavorites = guestFavorites.filter(id => !userFavorites.includes(id));

    if (newFavorites.length > 0) {
      set({ unsyncedIds: newFavorites });
      Alert.alert(
        "Sync Favorites?",
        `You have ${newFavorites.length} favorite event(s) saved from when you were browsing as a guest. Would you like to add them to your account?`,
        [
          { text: "Not Now", style: "cancel", onPress: () => set({ unsyncedIds: [] }) },
          { text: "Yes, Sync", onPress: () => get().syncGuestFavorites() },
        ]
      );
    }
  },

  syncGuestFavorites: async () => {
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    const { unsyncedIds } = get();

    if (!userId || unsyncedIds.length === 0) return;

    try {
      // Add each unsynced favorite to the database
      for (const eventId of unsyncedIds) {
        await favoritesService.addFavorite(eventId, userId);
      }

      // Merge the unsynced favorites into the current state
      set(state => ({
        favorites: [...new Set([...state.favorites, ...unsyncedIds])], // Corrected to 'favorites'
        unsyncedIds: [],
      }));

      Alert.alert("Success!", "Your guest favorites have been added to your account.");

    } catch (error) {
      console.error("Error syncing guest favorites:", error);
      Alert.alert("Sync Failed", "We couldn't sync your favorites right now. Please try again later.");
    }
  },

  toggleFavorite: async (event: Event) => { // Accept the full Event object
    const eventId = event.id; 
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    const { favorites } = get();
    const isCurrentlyFavorite = favorites.includes(eventId);

    const updatedIds = isCurrentlyFavorite
      ? favorites.filter((id) => id !== eventId)
      : [...favorites, eventId];
    
    set({ favorites: updatedIds });

    // When a user favorites an event, cache its details for offline use.
    if (!isCurrentlyFavorite) {
      const cache = await storageService.getItem<Record<number, Event>>(EVENTS_CACHE_KEY) || {};
      cache[eventId] = event;
      await storageService.setItem(EVENTS_CACHE_KEY, cache);
    }

    const storageKey = userId ? `${USER_FAVORITES_KEY_PREFIX}${userId}` : GUEST_FAVORITES_KEY;
    await storageService.setItem(storageKey, updatedIds);
    
    if (userId) {
      try {
        if (isCurrentlyFavorite) {
          await favoritesService.removeFavorite(eventId, userId);
        } else {
          await favoritesService.addFavorite(eventId, userId);
        }
      } catch (error) {
        set({ favorites }); // Revert on failure
        await storageService.setItem(storageKey, favorites);
        Alert.alert("Update Failed", "Could not update your favorites. Please check your connection.");
      }
    }
  },
}));

