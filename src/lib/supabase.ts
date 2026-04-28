import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const missingSupabaseEnvMessage = "Supabase credentials are missing. Cloud features will not work.";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(missingSupabaseEnvMessage);
}

function createMissingEnvClient(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(missingSupabaseEnvMessage);
    },
  });
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, typeof window === "undefined" ? {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  } : undefined)
  : createMissingEnvClient();
