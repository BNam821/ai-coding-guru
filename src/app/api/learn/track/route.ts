import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST: Track recent lesson
export async function POST(req: Request) {
    const session = await getSession();

    try {
        const { lesson_id, course_slug, lesson_slug, lesson_title } = await req.json();

        if (!lesson_id || !course_slug || !lesson_slug || !lesson_title) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        if (session) {
            // Logged in: Save to Supabase
            const { error } = await supabase
                .from("user_learning_history")
                .upsert({
                    username: session.username,
                    lesson_id,
                    course_slug,
                    lesson_slug,
                    lesson_title,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'username' });

            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// GET: Fetch recent lesson for logged in user
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from("user_learning_history")
            .select("*")
            .eq("username", session.username)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, history: data });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
