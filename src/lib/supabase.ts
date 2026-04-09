import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const isServer = typeof window === "undefined";
const activeSupabaseKey = isServer && supabaseServiceKey ? supabaseServiceKey : supabaseAnonKey;
const missingSupabaseEnvMessage = "Supabase credentials are missing. Cloud features will not work.";

if (!supabaseUrl || !activeSupabaseKey) {
  console.warn(missingSupabaseEnvMessage);
}

function createMissingEnvClient(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(missingSupabaseEnvMessage);
    },
  });
}

export const supabase = (supabaseUrl && activeSupabaseKey)
  ? createClient(supabaseUrl, activeSupabaseKey, isServer ? {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  } : undefined)
  : createMissingEnvClient();
