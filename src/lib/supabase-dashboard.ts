export function getSupabaseDashboardUrl() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co$/i);

    if (!match) {
        return null;
    }

    return `https://supabase.com/dashboard/project/${match[1]}/editor`;
}

