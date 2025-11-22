import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ticketsService from '../services/api/ticketsService';
import { Ticket } from '../types/ticket';
import { Alert } from 'react-native';
import { eventsQueryKey } from './useEvents';
import { useAuth } from '../stores/auth-store'; 

export const ticketsQueryKey = ['tickets'];

/**
 * Fetches the user's list of purchased tickets.
 */
export function useTicketsQuery() {
  const { user } = useAuth();

  return useQuery<Ticket[], Error>({
    queryKey: ticketsQueryKey,
    queryFn: ticketsService.getTickets,
    enabled: !!user,
  });
}

/**
 * A mutation for purchasing new tickets.
 */
export function usePurchaseTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketsService.purchaseTickets,
    
    onSuccess: (newTickets) => {
      // Invalidate the tickets list
      queryClient.invalidateQueries({ queryKey: ticketsQueryKey });
      
      // Invalidate ALL event queries (because `availableSlot` changed)
      // This will cause DiscoverScreen, EventDetails, etc., to refetch.
            queryClient.invalidateQueries({ queryKey: ['events'] });
  
      Alert.alert(
        'Tickets Purchased!',
        `You've successfully purchased ${newTickets.length} ticket(s).`,
      );
    },
    
    onError: (err: Error) => {
      if (err.message.includes('EVENT_SOLD_OUT')) {
        Alert.alert('Purchase Failed', 'Sorry, this event is now sold out.');
      } else if (err.message.includes('USER_TICKET_LIMIT_REACHED')) {
        Alert.alert('Purchase Failed', "You've reached the ticket limit.");
      } else if (err.message.includes('EVENT_NOT_FOUND')) {
        Alert.alert('Purchase Failed', "Sorry, this event is deleted by the organizer.");
      } else if (err.message.includes('EVENT_CLOSED')) {
        Alert.alert('Purchase Failed', "Sorry, this event is closed.");
      } else {
        Alert.alert('Purchase Failed', err.message);
      }
      
      queryClient.invalidateQueries({ queryKey: eventsQueryKey });
    },
  });
}