import { create } from 'zustand';
import { supabase } from "@/src/lib/supabase"; 
import { Session, User } from '@supabase/supabase-js';
import storageService from '@/src/services/storageService';

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,

  initialize: () => {
    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false });
    });

    // Check for an initial session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      set({ session: data.session, user: data.session?.user ?? null, isLoading: false });
    };

    checkSession();
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // Use the storage service to clear all local data on sign out
    await storageService.clearAll();
    set({ session: null, user: null });
  },
}));

// Initialize the auth listener when the store is first used
useAuth.getState().initialize();

