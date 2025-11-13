import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as favoritesService from '../services/api/favoritesService';
import * as eventService from '../services/api/eventService';
import { Alert } from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import { useAuth } from '../stores/auth-store';
import { Event } from '../types/event'; 

// Define a central query key
export const favoritesQueryKey = ['favorites'];

/**
 * Defines the shape of the context object used in optimistic updates.
 */
type FavoritesContext = {
  previousFavorites?: number[];
};

/**
 * Fetches the user's list of favorite event IDs.
 */
export function useFavoritesQuery() {
  const { user } = useAuth();

  return useQuery<number[], Error>({
    queryKey: favoritesQueryKey,
    queryFn: favoritesService.getFavorites,
    enabled: !!user, // Only run if user is logged in
  });
}

/**
 * A mutation for adding an event to favorites.
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, FavoritesContext>({
    mutationFn: favoritesService.addFavorite,
    onMutate: async (eventId) => {
      HapticFeedback.trigger('impactLight');
      await queryClient.cancelQueries({ queryKey: favoritesQueryKey });
      const previousFavorites = queryClient.getQueryData<number[]>(
        favoritesQueryKey,
      );
      queryClient.setQueryData<number[]>(
        favoritesQueryKey,
        (old = []) => [...old, eventId],
      );
      return { previousFavorites };
    },
    onError: (err, eventId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesQueryKey, context.previousFavorites);
      }
      Alert.alert('Error', 'Failed to add favorite.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
    },
  });
}

/**
 * A mutation for removing an event from favorites.
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, FavoritesContext>({
    mutationFn: favoritesService.removeFavorite,
    onMutate: async (eventId) => {
      HapticFeedback.trigger('impactLight');
      await queryClient.cancelQueries({ queryKey: favoritesQueryKey });
      const previousFavorites = queryClient.getQueryData<number[]>(
        favoritesQueryKey,
      );
      queryClient.setQueryData<number[]>(
        favoritesQueryKey,
        (old = []) => old.filter((id) => id !== eventId),
      );
      return { previousFavorites };
    },
    onError: (err, eventId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesQueryKey, context.previousFavorites);
      }
      Alert.alert('Error', 'Failed to remove favorite.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
    },
  });
}

/**
 * Fetches the hydrated Event objects for the user's favorite IDs.
 * This hook depends on useFavoritesQuery.
 */
export function useFavoriteEventsQuery() {
  const { data: favoriteEventIds, isLoading: isLoadingIds } =
    useFavoritesQuery();

  const {
    data: favoriteEvents,
    isLoading: isLoadingEvents,
    isRefetching,
    refetch,
    isError,
  } = useQuery<Event[], Error>({
    // This query key depends on the favoriteEventIds
    queryKey: ['favoriteEvents', favoriteEventIds],
    queryFn: () => eventService.fetchEventsByIds(favoriteEventIds!),
    // Only run this query if the first query (for IDs) is done
    // and has returned an array with at least one ID.
    enabled: !!favoriteEventIds && favoriteEventIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combine loading states
  const isLoading = isLoadingIds || (isLoadingEvents && (favoriteEventIds?.length ?? 0) > 0);
  
  // If the ID list is loaded and empty, set loading to false.
  if(isLoadingIds && !favoriteEventIds) {
     return { favoriteEvents: [], isLoading: true, isRefetching: false, refetch: () => {}, isError: false };
  }
  if (!favoriteEventIds || favoriteEventIds.length === 0) {
    return { favoriteEvents: [], isLoading: false, isRefetching: false, refetch: () => {}, isError: false };
  }

  return {
    favoriteEvents: favoriteEvents ?? [],
    isLoading,
    isRefetching,
    refetch,
    isError,
  };
}