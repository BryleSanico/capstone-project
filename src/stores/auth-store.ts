import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { AppCacheService } from "../services/AppCacheService";
import { notificationService } from "../services/pushNotificationService";
import { UserRole } from "../types/user";

type AuthState = {
  session: Session | null;
  user: User | null;
  role: UserRole; 
  isInitialized: boolean;
  initialize: () => () => void; // Returns the unsubscribe function
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
  role: "user", 
  isInitialized: false,

  initialize: () => {
    console.log("[Auth] Initializing auth listener...");

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("[Auth] Auth state changed:", _event);

        // Extract role from metadata (default to 'user')
        const rawRole = session?.user?.app_metadata?.role;
        const role: UserRole =
          rawRole === "admin" || rawRole === "super_admin" ? rawRole : "user";

        set({
          session,
          user: session?.user ?? null,
          role,
          isInitialized: true,
        });

        if (session?.user) {
          // Initialize notification service
          await notificationService.initialize(session.user.id);
        }
      }
    );

    return () => {
      console.log("[Auth] Unsubscribing from auth state changes.");
      authListener?.subscription.unsubscribe();
    };
  },

  signInWithPassword: async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
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
    const currentUser = get().user;
    if (!currentUser) return;

    console.log("[Auth] Signing out...");

    try {
      await notificationService.unregisterPushNotifications(currentUser.id);
      await AppCacheService.handleLogout(currentUser.id);
      await supabase.auth.signOut();
      // Set local state immediately
      set({ session: null, user: null });
    } catch (error) {
      console.error("[Auth] Unexpected error during sign out:", error);
      set({ session: null, user: null, role: "user" });
    }
  },
}));
