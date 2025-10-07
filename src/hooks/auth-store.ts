import { create } from 'zustand';
import { supabase } from "@/src/lib/supabase"; 
import { AuthError, Session, User } from '@supabase/supabase-js';
import { useFavorites } from './favorites-store';

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
    // This listener handles all auth state changes (initial load, login, logout)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });

      // Always reload favorites to reflect the correct state (guest or user)
      useFavorites.getState().loadFavorites().then(() => {
        // After loading, if the user is now logged in, check for unsynced guest favorites
        if (session) {
          useFavorites.getState().checkForUnsyncedFavorites();
        }
      });
      
      // Ensure loading is only set to false once on initial load
      if (get().isLoading) {
        set({ isLoading: false });
      }
    });

    // Check for an initial session when the app starts
    const checkInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
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
    await supabase.auth.signOut();
    // The onAuthStateChange listener will automatically handle reloading the guest favorites.
    set({ session: null, user: null });
  },
}));

// Initialize the auth listener when the app loads
useAuth.getState().initialize();