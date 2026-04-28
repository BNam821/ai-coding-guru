import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Only logged in users can track wiki history" }, { status: 401 });
    }

    try {
        const { post_slug } = await req.json();
        const normalizedSlug = typeof post_slug === "string" ? post_slug.trim() : "";

        if (!normalizedSlug) {
            return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
        }

        const { data: post, error: postError } = await supabaseAdmin
            .from("wiki_posts")
            .select("slug, title")
            .eq("slug", normalizedSlug)
            .maybeSingle();

        if (postError || !post) {
            return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from("user_wiki_history")
            .upsert({
                username: session.username,
                post_slug: post.slug,
                post_title: post.title,
                viewed_at: new Date().toISOString(),
            }, { onConflict: "username,post_slug" });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("user_wiki_history")
            .select("*")
            .eq("username", session.username)
            .order("viewed_at", { ascending: false })
            .limit(10);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, history: data });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
