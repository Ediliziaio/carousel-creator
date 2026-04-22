import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let _client: SupabaseClient | null = null;

function buildClient(): SupabaseClient {
  if (!url || !key) {
    throw new Error(
      "Credenziali Supabase mancanti: imposta VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY come Build variables su Cloudflare.",
    );
  }
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    if (!_client) _client = buildClient();
    return Reflect.get(_client, prop);
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(url && key);
}
