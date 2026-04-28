import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("saved_posts")
            .select("post_slug")
            .eq("username", session.username);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, saved_posts: data.map((item) => item.post_slug) });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { slug } = await req.json();
        const normalizedSlug = typeof slug === "string" ? slug.trim() : "";

        if (!normalizedSlug) {
            return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
        }

        const { data: post, error: postError } = await supabaseAdmin
            .from("wiki_posts")
            .select("slug")
            .eq("slug", normalizedSlug)
            .maybeSingle();

        if (postError || !post) {
            return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from("saved_posts")
            .insert([{ username: session.username, post_slug: normalizedSlug }]);

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ success: true, message: "Already saved" });
            }

            throw error;
        }

        return NextResponse.json({ success: true, message: "Saved successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug")?.trim() || "";

        if (!slug) {
            return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("saved_posts")
            .delete()
            .eq("username", session.username)
            .eq("post_slug", slug);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, message: "Unsaved successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
