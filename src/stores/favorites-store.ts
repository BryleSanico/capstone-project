// filename: src/stores/favorites-store.ts
import { create } from "zustand";
import { Alert } from "react-native";
import { favoritesService } from "../services/favoritesService";
import { eventService } from "../services/eventService";
import { getCurrentSession } from "../utils/sessionHelper";
import { Event } from "../types/event";
import { useNetworkStatus } from "./network-store";
import storageService from "../services/storageService";
import { storageKeys } from "../utils/storageKeys";

type CachedFavorites = {
  ids: number[];
  lastUpdatedAt: number;
};

const CACHE_EXPIRATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

type FavoritesState = {
  initialFavorites: Set<number>;
  favorites: number[];
  favoriteEvents: Event[];
  isLoading: boolean;
  isSyncing: boolean;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (event: Event) => void;
};

export const useFavorites = create<FavoritesState>()((set, get) => ({
  initialFavorites: new Set(),
  favorites: [],
  favoriteEvents: [],
  isLoading: false,
  isSyncing: false,

  loadFavorites: async () => {
    set({ isLoading: true });
    const session = await getCurrentSession();
    const userId = session?.user?.id;

    if (!userId) {
      set({ favorites: [], favoriteEvents: [], initialFavorites: new Set(), isLoading: false });
      return;
    }

    const favoritesCacheKey = storageKeys.getFavoritesIdsKey(userId);
    const cachedData = await storageService.getItem<CachedFavorites>(favoritesCacheKey);
    const isCacheExpired = !cachedData || (Date.now() - cachedData.lastUpdatedAt) > CACHE_EXPIRATION_DURATION;

    if (cachedData && !isCacheExpired) {
      // If valid cache exists, load it and stop.
      const ids = cachedData.ids;
      set({ favorites: ids, initialFavorites: new Set(ids) });
      if (ids.length > 0) {
        const events = await eventService.fetchEventsByIds(ids);
        set({ favoriteEvents: events });
      }
      set({ isLoading: false });
    } else if (useNetworkStatus.getState().isConnected) {
      // If cache is expired or missing, and we're online, fetch from server.
      try {
        const serverIds = await favoritesService.getFavorites();
        const serverIdSet = new Set(serverIds);
        set({ favorites: serverIds, initialFavorites: serverIdSet });
        
        if (serverIds.length > 0) {
          const events = await eventService.fetchEventsByIds(serverIds);
          set({ favoriteEvents: events });
        } else {
          set({ favoriteEvents: [] });
        }
        await storageService.setItem(favoritesCacheKey, { ids: serverIds, lastUpdatedAt: Date.now() });
      } catch (error) {
        console.error("Failed to load favorites from server:", error);
      } finally {
        set({ isLoading: false });
      }
    } else {
      // Offline with no valid cache.
      set({ isLoading: false });
    }
  },

  toggleFavorite: (event: Event) => {
    const { favorites, favoriteEvents, isSyncing, initialFavorites } = get();
    const isCurrentlyFavorite = favorites.includes(event.id);

    const updatedIds = isCurrentlyFavorite ? favorites.filter(id => id !== event.id) : [...favorites, event.id];
    const updatedEvents = isCurrentlyFavorite ? favoriteEvents.filter(e => e.id !== event.id) : [...favoriteEvents, event];

    set({ favorites: updatedIds, favoriteEvents: updatedEvents });

    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    
    syncDebounceTimer = setTimeout(async () => {
      const { favorites: finalFavorites } = get();
      const session = await getCurrentSession();
      const userId = session?.user?.id;

      if (isSyncing || !userId || !useNetworkStatus.getState().isConnected) return;

      set({ isSyncing: true });
      const initialSet = initialFavorites;
      const currentSet = new Set(finalFavorites);
      const added = finalFavorites.filter(id => !initialSet.has(id));
      const removed = Array.from(initialSet).filter(id => !currentSet.has(id));

      if (added.length === 0 && removed.length === 0) {
        set({ isSyncing: false });
        return;
      }

      try {
        await favoritesService.syncFavorites(userId, added, removed);
        set({ initialFavorites: currentSet });
        // Update cache timestamp after successful sync
        const favoritesCacheKey = storageKeys.getFavoritesIdsKey(userId);
        await storageService.setItem(favoritesCacheKey, { ids: finalFavorites, lastUpdatedAt: Date.now() });
      } catch (error) {
        Alert.alert("Sync Failed", "Your favorite changes could not be saved.");
        set({ favorites: Array.from(initialSet), favoriteEvents: get().favoriteEvents.filter(e => initialSet.has(e.id)) });
      } finally {
        set({ isSyncing: false });
      }
    }, 2000);
  },
}));

