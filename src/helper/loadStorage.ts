import { useEffect } from 'react';
import { useTickets } from '@/src/hooks/tickets-store'; 
import { useFavorites } from '../hooks/favorites-store';

/**
 * A custom hook to handle the side-effect of loading tickets and favorites
 * when a component mounts.
 */
export const useLoadLocalStorage = () => {
  // Get the loading functions from your Zustand store hook
  const { loadTickets } = useTickets();
  const { loadFavorites } = useFavorites();
  useEffect(() => {
    console.log('Loading tickets and favorites...');
    loadTickets();
    loadFavorites();
  }, [loadTickets, loadFavorites]); 
};
