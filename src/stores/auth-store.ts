import { create } from 'zustand';
import { supabase } from "../lib/supabase"; 
import { AuthError, Session, User } from '@supabase/supabase-js';
import { useFavorites } from './favorites-store';
import { useTickets } from './tickets-store';
import { useNetworkStatus } from './network-store';
import { cacheManager } from '../services/cacheManager'; 

type AuthState = {
  session: Session | null;
  user: User | null; 
  isLoading: boolean;
  initialize: () => void;
  signInWithPassword: (email: string, pass: string) => Promise<{ error: AuthError | null }>;
  signUp: (fullName: string, email: string, pass: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,

  initialize: () => {


    supabase.auth.onAuthStateChange(async (_event, session) => {
      // Get the user from the *previous* session state before updating.
      const previousUser = get().user;

      // When the user signs out, clear their specific cache.
      // This happens when the new session is null and there was a previous user.
      if (!session && previousUser) {
        await cacheManager.clearUserSpecificCache(previousUser.id);
      }
      
      // Update the session state for the entire app.
      set({ session, user: session?.user ?? null });

      // On any auth change, reload favorites and tickets.
      // The stores will now handle loading for the new user or clearing state for a guest.
      useFavorites.getState().loadFavorites();
      useTickets.getState().loadTickets();
      
      if (get().isLoading) {
        set({ isLoading: false });
      }
    });

    const checkInitialSession = async () => {
      await supabase.auth.getSession();
      // The onAuthStateChange listener will handle setting state and initial loading.
      set({ isLoading: false });
    };

    checkInitialSession();
  },

  signInWithPassword: async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  },

  signUp: async (fullName: string, email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  },

  signOut: async () => {
    // Calling signOut will trigger the onAuthStateChange listener above.
    // The listener will handle clearing the cache and resetting the session.
    await supabase.auth.signOut();
  },
}));

// Initialize the auth listener when the app loads
useAuth.getState().initialize();

