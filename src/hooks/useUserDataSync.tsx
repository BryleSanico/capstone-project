import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../stores/auth-store';
import { useNetworkStatus } from '../stores/network-store';
import * as sqliteService from '../services/sqliteService';
import { ticketsQueryKey } from './useTickets';
import { favoritesQueryKey } from './useFavorites';
import { myEventsQueryKey } from './useMyEvents';

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
      console.log(`[UserDataSync] Loading user data. App Launch: ${isAppLaunch}`);

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
            console.log('[UserDataSync] SQLite data found. Hydrating cache...');
            queryClient.setQueryData(myEventsQueryKey, cachedMyEvents);
            queryClient.setQueryData(ticketsQueryKey, cachedTickets);
            queryClient.setQueryData(favoritesQueryKey, cachedFavorites);
          } else {
            console.log('[UserDataSync] SQLite is empty. Skipping hydration.');
          }
        } catch (error) {
          console.error('[UserDataSync] Failed to read from SQLite:', error);
        }
      }

      // Network Refresh Logic
      const isConnected = useNetworkStatus.getState().isConnected;

      if (isConnected) {
        console.log('[UserDataSync] Online. Triggering query invalidation...');
        queryClient.invalidateQueries();
      } else {
        console.log('[UserDataSync] Offline. Skipping network refresh.');
      }
    };

    const handleLogout = () => {
      console.log('[UserDataSync] User logged out. Clearing caches.');
      queryClient.clear();
      sqliteService.clearPrivateData();
    };

    if (!hasAuthBeenInitialized.current) {
      hasAuthBeenInitialized.current = true;
      if (user) {
        // App Start + Logged In -> Hydrate & Refresh
        loadUserData(true);
      } else {
        // App Start + Logged Out -> Refresh Public Data Only
        console.log('[UserDataSync] App start, user is logged out.');
        queryClient.invalidateQueries({ queryKey: ['events'] });
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