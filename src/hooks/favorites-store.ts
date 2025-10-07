import { create } from "zustand";
import { useAuth } from "./auth-store";
import storageService from "../services/storageService";
import { favoritesService } from "../services/favoritesService";

const FAVORITES_STORAGE_KEY = "favorite_events";

type FavoritesState = {
  favorites: number[];
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (eventId: number) => Promise<void>;
};

export const useFavorites = create<FavoritesState>()((set, get) => ({
  favorites: [],
  isLoading: false,

  loadFavorites: async () => {
    set({ isLoading: true });
    const { session } = useAuth.getState();

    let ids: number[] = [];
    if (session?.user) {
      // If logged in, fetch from the database
      try {
        ids = await favoritesService.getFavorites();
        await storageService.setItem(FAVORITES_STORAGE_KEY, ids);
      } catch (error) {
        console.error("Failed to load favorites from DB, falling back to local.", error);
        ids = await storageService.getItem<number[]>(FAVORITES_STORAGE_KEY) || [];
      }
    } else {
      // If logged out, load from local storage
      ids = await storageService.getItem<number[]>(FAVORITES_STORAGE_KEY) || [];
    }
    set({ favorites: ids, isLoading: false });
  },

  toggleFavorite: async (eventId: number) => {
    const { session } = useAuth.getState();
    const { favorites } = get();
    const isCurrentlyFavorite = favorites.includes(eventId);

    // Optimistically update the UI
    const updatedIds = isCurrentlyFavorite
      ? favorites.filter((id) => id !== eventId)
      : [...favorites, eventId];
    set({ favorites: updatedIds });
    await storageService.setItem(FAVORITES_STORAGE_KEY, updatedIds);

    // If logged in, sync with the database
    if (session?.user) {
      try {
        if (isCurrentlyFavorite) {
          await favoritesService.removeFavorite(eventId, session.user.id);
        } else {
          await favoritesService.addFavorite(eventId, session.user.id);
        }
      } catch (error) {
        // If the DB update fails, revert the optimistic UI change
        console.error("Failed to sync favorite status:", error);
        set({ favorites }); // Revert to old state
        await storageService.setItem(FAVORITES_STORAGE_KEY, favorites);
        alert("Could not update your favorites. Please check your connection.");
      }
    }
  },
}));
