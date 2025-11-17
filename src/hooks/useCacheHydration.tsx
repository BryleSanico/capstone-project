import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as sqliteService from '../services/sqliteService';
import { eventsQueryKey } from './useEvents';
import { ticketsQueryKey } from './useTickets';
import { favoritesQueryKey } from './useFavorites';
import { myEventsQueryKey } from './useMyEvents';
import { useAuth } from '../stores/auth-store';

export const useCacheHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    const hydrateCache = async () => {
      try {
        await sqliteService.initDB();
        
        // Hydrate Public Data
        console.log('[Hydration] Hydrating public events...');
        const cachedEvents = await sqliteService.getEvents();
        if (cachedEvents.length > 0) {
          // Manually build the structure for useInfiniteQuery
          queryClient.setQueryData(
            [...eventsQueryKey, 'list', '', 'All'],
            {
              pages: [{
                events: cachedEvents,
                totalCount: cachedEvents.length,
                nextPage: 2, 
              }],
              pageParams: [1],
            }
          );
        }

        // Hydrate Private Data (only if logged in) 
        if (user) {
          console.log('[Hydration] User is logged in, hydrating private data...');
          
          const [cachedMyEvents, cachedTickets, cachedFavorites] = await Promise.all([
            sqliteService.getMyEvents(),
            sqliteService.getTickets(),
            sqliteService.getFavoriteIds(),
          ]);

          if (cachedMyEvents.length > 0) {
            queryClient.setQueryData(myEventsQueryKey, cachedMyEvents);
          }
          if (cachedTickets.length > 0) {
            queryClient.setQueryData(ticketsQueryKey, cachedTickets);
          }
          if (cachedFavorites.length > 0) {
            queryClient.setQueryData(favoritesQueryKey, cachedFavorites);
          }
        } else {
          console.log('[Hydration] No user, skipping private data.');
        }

      } catch (error) {
        console.error('[Hydration] Failed to hydrate cache:', error);
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateCache();
  }, [queryClient, user]); // Re-run if user logs in

  return { isHydrated };
};