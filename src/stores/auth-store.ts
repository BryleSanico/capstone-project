import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { useFavorites } from './favorites-store';
import { useTickets } from './tickets-store';
import { useNetworkStatus } from './network-store';
import { cacheManager } from '../services/cacheManager';

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signInWithPassword: (
    email: string,
    pass: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    fullName: string,
    email: string,
    pass: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,

  /**
   * Initializes the auth listener and loads session state.
   */
  initialize: async () => {
    // Check and set initial session immediately on startup
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    });

    // Subscribe to auth changes only once
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const prevUser = get().user;
      const newUser = newSession?.user ?? null;

      // Clear cache when user signs out
      if (!newSession && prevUser) {
        await cacheManager.clearUserSpecificCache(prevUser.id);
      }

      // Update the auth state
      set({
        session: newSession,
        user: newUser,
      });

      // Reload user-specific data only when signed in
      if (newUser) {
        await Promise.all([
          useFavorites.getState().loadFavorites(),
          useTickets.getState().loadTickets(),
        ]);
      }
    });
  },

  /**
   * Signs in the user with email and password.
   */
  signInWithPassword: async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    // Sync local caches only after successful sign-in
    if (!error) {
      const session = (await supabase.auth.getSession()).data.session;
      set({
        session,
        user: session?.user ?? null,
      });

      await Promise.all([
        useFavorites.getState().loadFavorites(),
        useTickets.getState().loadTickets(),
      ]);
    }

    return { error };
  },

  /**
   * Creates a new user account.
   */
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

  /**
   * Signs out the current user.
   */
  signOut: async () => {
    const currentUser = get().user;
    await supabase.auth.signOut();

    // Clear cached data for signed-out user
    if (currentUser) {
      await cacheManager.clearUserSpecificCache(currentUser.id);
    }

    set({ session: null, user: null });
  },
}));

// Initialize auth listener once globally
useAuth.getState().initialize();
