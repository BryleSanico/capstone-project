import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Ticket } from '@/types/event';

const TICKETS_STORAGE_KEY = 'user_tickets';
const FAVORITES_STORAGE_KEY = 'favorite_events';

export const [TicketsProvider, useTickets] = createContextHook(() => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(TICKETS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  });

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  });

  const saveTicketsMutation = useMutation({
    mutationFn: async (tickets: Ticket[]) => {
      await AsyncStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
      return tickets;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });

  const saveFavoritesMutation = useMutation({
    mutationFn: async (favorites: string[]) => {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      return favorites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  useEffect(() => {
    if (ticketsQuery.data) {
      setTickets(ticketsQuery.data);
    }
  }, [ticketsQuery.data]);

  useEffect(() => {
    if (favoritesQuery.data) {
      setFavorites(favoritesQuery.data);
    }
  }, [favoritesQuery.data]);

  const addTicket = (ticket: Ticket) => {
    const updated = [...tickets, ticket];
    setTickets(updated);
    saveTicketsMutation.mutate(updated);
  };

  const toggleFavorite = (eventId: string) => {
    const updated = favorites.includes(eventId)
      ? favorites.filter(id => id !== eventId)
      : [...favorites, eventId];
    setFavorites(updated);
    saveFavoritesMutation.mutate(updated);
  };

  const isFavorite = (eventId: string) => favorites.includes(eventId);

  return {
    tickets,
    favorites,
    addTicket,
    toggleFavorite,
    isFavorite,
    isLoading: ticketsQuery.isLoading || favoritesQuery.isLoading
  };
});