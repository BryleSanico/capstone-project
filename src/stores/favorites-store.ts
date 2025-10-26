import { create } from "zustand";
import { Alert } from "react-native";
import { favoritesService } from "../services/favoritesService";
import { getCurrentSession } from "../helpers/sessionHelper";
import { Event } from "../types/event";
import { useNetworkStatus } from "./network-store";
import { handleAsyncAction } from "../utils/storeUtils";

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

type FavoritesState = {
  initialFavorites: Set<number>;
  favorites: number[];
  favoriteEvents: Event[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null; // Required for handleAsyncAction
  loadFavorites: () => Promise<void>;
  toggleFavorite: (event: Event) => void;
  clearUserFavorites: () => void;
};

export const useFavorites = create<FavoritesState>()((set, get) => ({
  initialFavorites: new Set(),
  favorites: [],
  favoriteEvents: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  clearUserFavorites: () => {
    set({
      favorites: [],
      favoriteEvents: [],
      initialFavorites: new Set(),
      isLoading: false,
      error: null,
    });
  },

  loadFavorites: async () => {
    await handleAsyncAction(set, get, "isLoading", async () => {
      const { events, ids } = await favoritesService.getFavoriteEvents();
      return {
        favoriteEvents: events,
        favorites: ids,
        initialFavorites: new Set(ids),
      };
    });
  },

  toggleFavorite: (event: Event) => {
    const { favorites, favoriteEvents } = get();
    const isCurrentlyFavorite = favorites.includes(event.id);

    // Optimistic UI update
    const updatedIds = isCurrentlyFavorite ? favorites.filter(id => id !== event.id) : [...favorites, event.id];
    const updatedEvents = isCurrentlyFavorite ? favoriteEvents.filter(e => e.id !== event.id) : [...favoriteEvents, event];

    set({ favorites: updatedIds, favoriteEvents: updatedEvents });

    // Debounce and sync
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    
    syncDebounceTimer = setTimeout(async () => {
      // Get the *latest* state from inside the timer
      const { favorites: finalFavorites, initialFavorites: currentInitial } = get();
      const session = await getCurrentSession();
      const userId = session?.user?.id;

      if (get().isSyncing || !userId || !useNetworkStatus.getState().isConnected) {
        return; // Skip sync
      }

      set({ isSyncing: true, error: null });

      try {
        // Call the "fat service" method
        const newInitialSet = await favoritesService.syncFavoriteChanges(
          userId,
          finalFavorites,
          currentInitial
        );
        
        // Success: update the "source of truth" set
        set({ initialFavorites: newInitialSet });
      } catch (error) {
        // Error: Revert state and show alert
        Alert.alert("Sync Failed", "Your favorite changes could not be saved.");
        set({ 
          favorites: Array.from(currentInitial), 
          favoriteEvents: get().favoriteEvents.filter(e => currentInitial.has(e.id)) 
        });
      } finally {
        set({ isSyncing: false });
      }
    }, 2000); // 2-second debounce
  },
}));