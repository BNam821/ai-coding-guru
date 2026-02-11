import { createClient } from "@supabase/supabase-js";

// Lưu ý: Chỉ sử dụng client này ở Server-side (API Routes, Server Actions)
// Tuyệt đối KHÔNG import vào Client Components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Missing Supabase Service Key. Admin operations may fail.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
