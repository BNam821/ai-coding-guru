import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lưu ý: Chỉ sử dụng client này ở Server-side (API Routes, Server Actions)
// Tuyệt đối KHÔNG import vào Client Components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const missingAdminEnvMessage = "Missing Supabase Service Key. Admin operations may fail.";

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(missingAdminEnvMessage);
}

function createMissingAdminClient(): SupabaseClient {
    return new Proxy({} as SupabaseClient, {
        get() {
            throw new Error(missingAdminEnvMessage);
        },
    });
}

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : createMissingAdminClient();
