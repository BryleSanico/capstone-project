import { create } from 'zustand';
import { supabase } from "@/src/lib/supabase"; 
import { Session, User } from '@supabase/supabase-js';

type AuthState = {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => {
  // Check for an initial session on startup
  supabase.auth.getSession().then(({ data: { session } }) => {
    set({ session, user: session?.user ?? null, initialized: true });
  });

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    set({ session, user: session?.user ?? null, initialized: true });
  });

  return {
    session: null,
    user: null,
    initialized: false,
    signOut: async () => {
      await supabase.auth.signOut();
      // The onAuthStateChanged listener will handle setting session to null
    },
    // It's good practice to unsubscribe when the store is no longer in use,
    // though in a React Native app this is less critical than in web with HMR.
    // Zustand doesn't have a built-in 'destroy' lifecycle, so this is illustrative.
    // cleanup: () => subscription.unsubscribe(),
  };
});
