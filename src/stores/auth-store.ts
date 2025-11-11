import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { useFavorites } from "./favorites-store";
import { useTickets } from "./tickets-store";
import { AppCacheService } from "../services/AppCacheService";
import { notificationService } from "../services/notificationService";
import { useMyEvents } from "./my-event-store";

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean; 
  initialize: () => void;
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
  isLoading: true, // Start in loading state
  isInitialized: false, // Start as false

  initialize: () => {
    const state = get();
    if (state.isInitialized) {
      console.log('[Auth] Already initialized, skipping...');
      return;
    }
    console.log('[Auth] Starting initialization...');
    
    // Set up the auth state listener. This is the single source of truth.
    supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] Auth state changed:', _event);

      // Set session and user immediately
      set({ session, user: session?.user ?? null });

      // If a user is logged in, initialize their services and load their data.
      if (session?.user) {
        console.log('[Auth] User session found, loading data...');
        // Only set loading to true if we are not already logged in
        if (!get().session) {
          set({ isLoading: true });
        }
        await notificationService.initialize(session.user.id);
        // Load data for the newly logged-in user.
        await Promise.all([
          useFavorites.getState().loadFavorites(),
          useTickets.getState().loadTickets(),
          useMyEvents.getState().loadMyEvents(),
        ]);
        console.log('[Auth] User data loaded.');
      } else {
        // If no user, ensure stores are cleared (handles initial guest state).
        useFavorites.getState().clearUserFavorites();
        useTickets.getState().clearUserTickets();
        useMyEvents.getState().clearUserEvents();
      }
      
      // Mark as initialized and loading complete *after* the first check
      set({ isLoading: false, isInitialized: true });
    });
  },

  signInWithPassword: async (email: string, pass: string) => {
    console.log('[Auth] Signing in...');
    // The onAuthStateChange listener will handle loading data
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    
    if (error) {
      console.error('[Auth] Sign in error:', error);
    } else {
      console.log('[Auth] Sign in successful');
    }
    
    return { error };
  },

  signUp: async (fullName: string, email: string, pass:string) => {
    console.log('[Auth] Signing up...');
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      console.error('[Auth] Sign up error:', error);
    } else {
      console.log('[Auth] Sign up successful');
    }
    
    return { error };
  },

  signOut: async () => {
    const currentUser = get().user;
    if (!currentUser) {
      console.log('[Auth] No user to sign out');
      return;
    }

    console.log('[Auth] Signing out...');
    
    try {
      // Remove the manual calls to clearUserTickets, clearUserFavorites, 
      // and clearUserEvents. The onAuthStateChange listener will
      // handle this automatically when supabase.auth.signOut() completes.
      console.log("[Auth] Zustand state will be cleared by onAuthStateChange listener.");

      // Perform asynchronous cleanup operations
      try {
        await notificationService.unregisterPushNotifications(currentUser.id);
      } catch (error) {
        console.warn('[Auth] Failed to unregister push notifications:', error);
      }
      
      // Call the single, unified logout handler.
      // This will trigger the onAuthStateChange listener.
      try {
        await AppCacheService.handleLogout(currentUser.id);
      } catch (error) {
        console.error('[Auth] Unexpected error during AppCacheService.handleLogout:', error);
      }

    // Manually set local auth state to null to ensure immediate UI update,
    // even before the onAuthStateChange listener fires.
      set({ session: null, user: null });
      console.log("[Auth] Sign-out process complete.");
    } catch (error) {
      console.error('[Auth] Unexpected error during sign out:', error);
      set({ session: null, user: null });
      throw error;
    }
  },
}));

// Initialize the auth listener when the app loads.
useAuth.getState().initialize();