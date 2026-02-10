import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST: Track lesson (Hybrid: DB for user, local is handled by client)
export async function POST(req: Request) {
    const session = await getSession();

    try {
        const { lesson_id, course_slug, lesson_slug, lesson_title } = await req.json();

        if (!lesson_id || !course_slug || !lesson_slug || !lesson_title) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        if (session) {
            // Logged in: Upsert to user_learning_history to track multiple lessons
            // UNIQUE(username, lesson_id) allows updating the timestamp of an existing entry
            const { error } = await supabase
                .from("user_learning_history")
                .upsert({
                    username: session.username,
                    lesson_id,
                    course_slug,
                    lesson_slug,
                    lesson_title,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'username,lesson_id' });

            if (error) {
                console.error("[Track Lesson Error]", error);
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// GET: Fetch recent lessons for logged in user
export async function GET(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    try {
        const { data, error } = await supabase
            .from("user_learning_history")
            .select("*")
            .eq("username", session.username)
            .order("updated_at", { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, history: data });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
