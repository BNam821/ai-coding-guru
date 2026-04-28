import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSession } from "@/lib/auth";

function normalizeProgressPercent(value: unknown) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
    }

    return Math.max(0, Math.min(100, Math.round(value)));
}

// POST: Track lesson (Hybrid: DB for user, local is handled by client)
export async function POST(req: Request) {
    const session = await getSession();

    try {
        const { lesson_id, course_slug, lesson_slug, lesson_title, progress_percent } = await req.json();
        const normalizedProgress = normalizeProgressPercent(progress_percent);

        if (!lesson_id || !course_slug || !lesson_slug || !lesson_title) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        if (session) {
            const { data: lesson, error: lessonError } = await supabaseAdmin
                .from("lessons")
                .select("id, title, slug, chapters!inner(course_id)")
                .eq("id", lesson_id)
                .eq("slug", lesson_slug)
                .single();

            if (lessonError || !lesson) {
                return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
            }

            const chapterCourseId = Array.isArray(lesson.chapters)
                ? lesson.chapters[0]?.course_id
                : lesson.chapters?.course_id;

            const { data: course } = await supabaseAdmin
                .from("courses")
                .select("slug")
                .eq("id", chapterCourseId)
                .maybeSingle();

            if (!course || course.slug !== course_slug) {
                return NextResponse.json({ success: false, error: "Course/lesson mismatch" }, { status: 400 });
            }

            // Fetch existing to handle max progress keep
            let finalProgress = normalizedProgress ?? 0;
            if (normalizedProgress !== null) {
                const existing = await supabaseAdmin
                    .from("user_learning_history")
                    .select("progress_percent")
                    .eq("username", session.username)
                    .eq("lesson_id", lesson_id)
                    .single();
                
                if (existing.data?.progress_percent) {
                    finalProgress = Math.max(existing.data.progress_percent, normalizedProgress);
                }
            }

            // Logged in: Upsert to user_learning_history to track multiple lessons
            // UNIQUE(username, lesson_id) allows updating the timestamp of an existing entry
            const { error } = await supabaseAdmin
                .from("user_learning_history")
                .upsert({
                    username: session.username,
                    lesson_id,
                    course_slug: course.slug,
                    lesson_slug: lesson.slug,
                    lesson_title: lesson.title,
                    updated_at: new Date().toISOString(),
                    ...(normalizedProgress !== null ? { progress_percent: finalProgress } : {})
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
        const { data, error } = await supabaseAdmin
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
