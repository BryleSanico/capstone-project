import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

/**
 * A utility to get the current session from Supabase on demand.
 * This helps avoid circular dependencies between Zustand stores.
 * The Supabase client is smart and checks local storage first, so this is a fast operation.
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};
