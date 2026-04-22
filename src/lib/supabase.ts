import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY mancanti. Login e salvataggio non funzioneranno.",
  );
}

export const supabase: SupabaseClient = createClient(url ?? "", key ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
