import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../stores/auth-store";
import { useNetworkStatus } from "../../stores/network-store";
import * as sqliteService from "../../services/sqliteService";
import { ticketsQueryKey } from "../data/useTickets";
import { favoritesQueryKey } from "../data/useFavorites";
import { myEventsQueryKey } from "../data/useMyEvents";
import { eventsQueryKey } from "../data/useEvents";
import { logger } from "../../utils/system/logger";

/**
 * Manages the synchronization of user-specific data (Tickets, MyEvents, Favorites).
 * Orchestrates the flow between Auth, SQLite Cache, and React Query.
 */
export function useUserDataSync(isPublicCacheHydrated: boolean) {
  const queryClient = useQueryClient();
  const { user, isInitialized } = useAuth();
  const hasAuthBeenInitialized = useRef(false);

  useEffect(() => {
    // Wait for Auth check and Public Cache to be ready
    if (!isInitialized || !isPublicCacheHydrated) {
      return;
    }

    const loadUserData = async (isAppLaunch: boolean) => {
      logger.info(
        `[UserDataSync] Loading user data. App Launch: ${isAppLaunch}`
      );

      // Hydrate from SQLite (Only on App Launch)
      if (isAppLaunch) {
        try {
          const [cachedMyEvents, cachedTickets, cachedFavorites] =
            await Promise.all([
              sqliteService.getMyEvents(),
              sqliteService.getTickets(),
              sqliteService.getFavoriteIds(),
            ]);

          const hasPrivateCache =
            cachedMyEvents.length > 0 ||
            cachedTickets.length > 0 ||
            cachedFavorites.length > 0;

          if (hasPrivateCache) {
            logger.info("[UserDataSync] SQLite data found. Hydrating cache...");
            queryClient.setQueryData(myEventsQueryKey, cachedMyEvents);
            queryClient.setQueryData(ticketsQueryKey, cachedTickets);
            queryClient.setQueryData(favoritesQueryKey, cachedFavorites);
          } else {
            logger.info("[UserDataSync] SQLite is empty. Skipping hydration.");
          }
        } catch (error) {
          logger.error("[UserDataSync] Failed to read from SQLite:", error);
        }
      }

      // Network Refresh Logic
      const isConnected = useNetworkStatus.getState().isConnected;

      if (isConnected) {
        logger.info("[UserDataSync] Online. Triggering query invalidation...");
        queryClient.invalidateQueries();
      } else {
        logger.info("[UserDataSync] Offline. Skipping network refresh.");
      }
    };

    const handleLogout = async () => {
      logger.info(
        "[UserDataSync] User logged out. Clearing user-specific caches."
      );

      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries();

      // Surgically remove ONLY private user data
      // We DO NOT clear 'events' (public data), so DiscoverScreen stays populated.
      queryClient.removeQueries({ queryKey: ticketsQueryKey });
      queryClient.removeQueries({ queryKey: favoritesQueryKey });
      queryClient.removeQueries({ queryKey: myEventsQueryKey });

      // Remove Admin & Notification keys (using string literals to avoid circular deps)
      queryClient.removeQueries({ queryKey: ["admin"] });
      queryClient.removeQueries({ queryKey: ["notifications"] });

      // Clear Private Data from SQLite (Security)
      await sqliteService.clearPrivateData();

      // Invalidate public events not showing stale data
      // This triggers a background refetch on DiscoverScreen without showing a hard loading state
      queryClient.invalidateQueries({ queryKey: eventsQueryKey });

      logger.info("[UserDataSync] Logout cleanup complete.");
    };

    if (!hasAuthBeenInitialized.current) {
      hasAuthBeenInitialized.current = true;
      if (user) {
        // App Start + Logged In -> Hydrate & Refresh
        loadUserData(true);
      } else {
        // App Start + Logged Out -> Refresh Public Data Only
        logger.info("[UserDataSync] App start, user is logged out.");
        queryClient.invalidateQueries({ queryKey: ["events"] });
      }
      return;
    }

    // Subsequent Auth Changes
    if (!user) {
      handleLogout();
    } else {
      // Manual Login -> No Hydration, Force Refresh
      loadUserData(false);
    }
  }, [user, isInitialized, isPublicCacheHydrated, queryClient]);
}
