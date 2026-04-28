import { NextResponse } from "next/server";
import { getSession, isUserAuthenticated } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    if (!(await isUserAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = session.role === "admin";

        const [publishedResult, pendingResult] = await Promise.all([
            supabaseAdmin
                .from("wiki_posts")
                .select("slug, title, excerpt, category, image_url, read_time, date, created_at, author, author_role")
                .eq("author", session.username)
                .order("created_at", { ascending: false }),
            isAdmin
                ? Promise.resolve({ data: [], error: null })
                : supabaseAdmin
                    .from("wiki_submissions")
                    .select("id, slug, title, excerpt, category, image_url, read_time, status, created_at, updated_at, author, author_role")
                    .eq("author", session.username)
                    .eq("status", "pending")
                    .order("created_at", { ascending: false }),
        ]);

        if (publishedResult.error) {
            return NextResponse.json({ success: false, error: publishedResult.error.message }, { status: 500 });
        }

        if (pendingResult.error) {
            return NextResponse.json({ success: false, error: pendingResult.error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            isAdmin,
            publishedPosts: publishedResult.data || [],
            pendingSubmissions: pendingResult.data || [],
        });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
