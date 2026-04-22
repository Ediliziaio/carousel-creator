import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  init: () => () => void;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  init: () => {
    void supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false });
    });
    return () => sub.subscription.unsubscribe();
  },
}));
