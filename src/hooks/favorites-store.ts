import { create } from "zustand";
import storageService from "../services/storageService";
import { favoritesService } from "../services/favoritesService";
import { Alert } from "react-native";
import { getCurrentSession } from "../utils/sessionHelper";

// Use two distinct keys to separate guest and logged-in user data
const GUEST_FAVORITES_KEY = "guest_favorite_events";
const USER_FAVORITES_KEY_PREFIX = "user_favorites"; // Will be appended with user ID

type FavoritesState = {
  favorites: number[];
  isLoading: boolean;
  unsyncedIds: number[]; // Stores favorites made while logged out
  loadFavorites: () => Promise<void>;
  toggleFavorite: (eventId: number) => Promise<void>;
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

    let ids: number[] = [];
    if (userId) {
      // If logged in, fetch from the database as the source of truth
      try {
        ids = await favoritesService.getFavorites();
        // Cache the fetched favorites locally for the logged-in user
        await storageService.setItem(`${USER_FAVORITES_KEY_PREFIX}${userId}`, ids);
      } catch (error) {
        console.error("Failed to load favorites from DB, falling back to user's local cache.", error);
        ids = await storageService.getItem<number[]>(`${USER_FAVORITES_KEY_PREFIX}${userId}`) || [];
      }
    } else {
      // If logged out, load from the general guest storage
      ids = await storageService.getItem<number[]>(GUEST_FAVORITES_KEY) || [];
    }
    set({ favorites: ids, isLoading: false, unsyncedIds: [] });
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

  toggleFavorite: async (eventId: number) => {
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    const { favorites } = get();
    const isCurrentlyFavorite = favorites.includes(eventId);

    const updatedIds = isCurrentlyFavorite
      ? favorites.filter((id) => id !== eventId)
      : [...favorites, eventId];
    
    // Optimistically update the UI
    set({ favorites: updatedIds });

    if (userId) {
      // If logged in, sync with DB and user-specific storage
      await storageService.setItem(`${USER_FAVORITES_KEY_PREFIX}${userId}`, updatedIds);
      try {
        if (isCurrentlyFavorite) {
          await favoritesService.removeFavorite(eventId, userId);
        } else {
          await favoritesService.addFavorite(eventId, userId);
        }
      } catch (error) {
        // Revert on failure
        console.error("Failed to sync favorite status with DB:", error);
        set({ favorites });
        await storageService.setItem(`${USER_FAVORITES_KEY_PREFIX}${userId}`, favorites);
        Alert.alert("Update Failed", "Could not update your favorites. Please check your connection.");
      }
    } else {
      // If logged out, save only to guest storage
      await storageService.setItem(GUEST_FAVORITES_KEY, updatedIds);
    }
  },
}));

