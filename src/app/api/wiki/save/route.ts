import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET: Lấy danh sách bài viết đã lưu của người dùng hiện tại
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from("saved_posts")
            .select("post_slug")
            .eq("username", session.username);

        if (error) throw error;

        return NextResponse.json({ success: true, saved_posts: data.map(d => d.post_slug) });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Lưu bài viết
export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { slug } = await req.json();
        if (!slug) return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });

        const { error } = await supabase
            .from("saved_posts")
            .insert([{ username: session.username, post_slug: slug }]);

        if (error) {
            if (error.code === "23505") return NextResponse.json({ success: true, message: "Already saved" });
            throw error;
        }

        return NextResponse.json({ success: true, message: "Saved successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Bỏ lưu bài viết
export async function DELETE(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        if (!slug) return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });

        const { error } = await supabase
            .from("saved_posts")
            .delete()
            .eq("username", session.username)
            .eq("post_slug", slug);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Unsaved successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
