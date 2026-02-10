import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST: Track read article
export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Only logged in users can track wiki history" }, { status: 401 });
    }

    try {
        const { post_slug, post_title } = await req.json();

        if (!post_slug || !post_title) {
            return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
        }

        // Upsert to keep only the latest view of the same article by the same user
        const { error } = await supabase
            .from("user_wiki_history")
            .upsert({
                username: session.username,
                post_slug,
                post_title,
                viewed_at: new Date().toISOString()
            }, { onConflict: 'username,post_slug' });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// GET: Fetch read articles history
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from("user_wiki_history")
            .select("*")
            .eq("username", session.username)
            .order("viewed_at", { ascending: false })
            .limit(10);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, history: data });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
