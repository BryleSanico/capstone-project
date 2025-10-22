import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { useFavorites } from "./favorites-store";
import { useTickets } from "./tickets-store";
import { cacheManager } from "../services/cacheManager";
import { notificationService } from "../services/notificationService";

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
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
  isLoading: true,

  initialize: () => {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null, isLoading: true });

      // If a user is logged in, initialize their services and load their data.
      if (session?.user) {
        await notificationService.initialize(session.user.id);
        // Load data for the newly logged-in user.
        await Promise.all([
          useFavorites.getState().loadFavorites(),
          useTickets.getState().loadTickets(),
        ]);
      } else {
        // If no user, ensure stores are cleared (handles initial guest state).
        useFavorites.getState().clearUserFavorites();
        useTickets.getState().clearUserTickets();
      }

      // Done with initial loading/state changes.
      if (get().isLoading) {
        set({ isLoading: false });
      }
    });

    // Manually check the session on app start, the listener will handle the rest.
    supabase.auth.getSession().then(({ data: { session } }) => {
      // The onAuthStateChange listener will fire if the session state changes.
      // If it doesn't fire, we know the initial state is 'logged out'.
      if (!session && get().isLoading) {
        set({ isLoading: false });
      }
    });
  },

  signInWithPassword: async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    return { error };
  },

  signUp: async (fullName: string, email: string, pass:string) => {
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

  // Centralized and atomic sign-out logic.
  signOut: async () => {
    const currentUser = get().user;
    if (!currentUser) return;

    // synchronously clear the state of other stores.
    useTickets.getState().clearUserTickets();
    useFavorites.getState().clearUserFavorites();
    console.log("Zustand state cleared for tickets and favorites.");

    // Perform asynchronous cleanup operations.
    await notificationService.unregisterPushNotifications(currentUser.id);
    await cacheManager.clearUserSpecificCache(currentUser.id);
    
    // Sign out from Supabase, which will trigger onAuthStateChange.
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error.message);
    }

    // Manually set local auth state to null to ensure immediate UI update,
    // even before the onAuthStateChange listener fires.
    set({ session: null, user: null });
    console.log("Sign-out process complete.");
  },
}));

// Initialize the auth listener when the app loads.
useAuth.getState().initialize();
