import { create } from "zustand";
import storageService from "../services/storageService";
import { favoritesService } from "../services/favoritesService";
import { eventService } from "../services/eventService";
import { Alert } from "react-native";
import { getCurrentSession } from "../utils/sessionHelper";
import { Event } from "../types/event";
import { useNetworkStatus } from "./network-store";
import { storageKeys } from "../utils/storageKeys"; 

type FavoritesState = {
  favorites: number[];
  favoriteEvents: Event[];
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (event: Event) => Promise<void>;
};

export const useFavorites = create<FavoritesState>()((set, get) => ({
  favorites: [],
  favoriteEvents: [],
  isLoading: false,

  loadFavorites: async () => {
    const session = await getCurrentSession();
    const userId = session?.user?.id;

    // If there is no user, clear the state and finish.
    if (!userId) {
      set({ favorites: [], favoriteEvents: [], isLoading: false });
      return;
    }

    set({ isLoading: true });
    
    // Get user-specific keys for caching favorites.
    const favoritesIdsKey = storageKeys.getFavoritesIdsKey(userId);
    const lastSyncKey = storageKeys.getFavoritesSyncKey(userId);

    // Load from user-specific cache for instant UI.
    const cachedIds = await storageService.getItem<number[]>(favoritesIdsKey) || [];
    set({ favorites: cachedIds });
    if (cachedIds.length > 0) {
        const cachedEvents = await eventService.fetchEventsByIds(cachedIds);
        set({ favoriteEvents: cachedEvents });
    }

    if (!useNetworkStatus.getState().isConnected) {
        set({ isLoading: false });
        return;
    }

    try {
      const lastSync = await storageService.getItem<string>(lastSyncKey);
      const newIds = await favoritesService.getFavorites(lastSync);

      if (newIds.length > 0) {
        const combinedIds = [...new Set([...cachedIds, ...newIds])];
        set({ favorites: combinedIds });
        await storageService.setItem(favoritesIdsKey, combinedIds);
        
        const events = await eventService.fetchEventsByIds(combinedIds);
        set({ favoriteEvents: events });
      }

      const latestTimestamp = await favoritesService.getLatestFavoriteTimestamp();
      if (latestTimestamp) {
        await storageService.setItem(lastSyncKey, latestTimestamp);
      }

    } catch (error) {
      console.error("Failed to sync favorites:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (event: Event) => {
    const eventId = event.id;
    const session = await getCurrentSession();
    const userId = session?.user?.id;

    if (!userId) return;
    
    const favoritesIdsKey = storageKeys.getFavoritesIdsKey(userId);
    const { favorites, favoriteEvents } = get();
    const isCurrentlyFavorite = favorites.includes(eventId);

    const updatedIds = isCurrentlyFavorite
      ? favorites.filter((id) => id !== eventId)
      : [...favorites, eventId];
    
    const updatedEvents = isCurrentlyFavorite
      ? favoriteEvents.filter((e) => e.id !== eventId)
      : [...favoriteEvents, event];

    set({ favorites: updatedIds, favoriteEvents: updatedEvents });
    await storageService.setItem(favoritesIdsKey, updatedIds);

    try {
      if (isCurrentlyFavorite) {
        await favoritesService.removeFavorite(eventId, userId);
      } else {
        await favoritesService.addFavorite(eventId, userId);
      }
    } catch (error) {
      set({ favorites, favoriteEvents });
      await storageService.setItem(favoritesIdsKey, favorites);
      Alert.alert("Update Failed", "Could not update your favorites.");
    }
  },
}));

