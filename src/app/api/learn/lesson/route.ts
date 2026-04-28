import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeText(value: unknown, maxLength = 200) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
}

function normalizeTags(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean)
                .slice(0, 25),
        ),
    );
}

export async function POST(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const title = normalizeText(body.title);
        const slug = normalizeText(body.slug, 120).toLowerCase();
        const content = typeof body.content === "string" ? body.content : "";
        const chapterId = normalizeText(body.chapter_id, 120);
        const order = Number(body.order);
        const aiQuestionEnabled = Boolean(body.ai_question_enabled);
        const tags = normalizeTags(body.tags);

        if (!title || !slug || !chapterId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const { data: chapter } = await supabaseAdmin
            .from("chapters")
            .select("id")
            .eq("id", chapterId)
            .maybeSingle();

        if (!chapter) {
            return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
        }

        const { data, error } = await supabaseAdmin
            .from("lessons")
            .insert([{
                title,
                slug,
                content,
                chapter_id: chapterId,
                order: Number.isFinite(order) && order > 0 ? Math.floor(order) : 1,
                ai_question_enabled: aiQuestionEnabled,
                tags,
            }])
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ success: false, error: "Slug này đã tồn tại trong chương này" }, { status: 400 });
            }

            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/learn");
        return NextResponse.json({ success: true, lesson: data });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const id = normalizeText(body.id, 120);
        const title = normalizeText(body.title);
        const slug = normalizeText(body.slug, 120).toLowerCase();
        const content = typeof body.content === "string" ? body.content : "";
        const chapterId = normalizeText(body.chapter_id, 120);
        const order = Number(body.order);
        const aiQuestionEnabled = Boolean(body.ai_question_enabled);
        const tags = normalizeTags(body.tags);

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing Lesson ID" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("lessons")
            .update({
                ...(title ? { title } : {}),
                ...(slug ? { slug } : {}),
                content,
                ...(chapterId ? { chapter_id: chapterId } : {}),
                ...(Number.isFinite(order) && order > 0 ? { order: Math.floor(order) } : {}),
                ai_question_enabled: aiQuestionEnabled,
                tags,
            })
            .eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/learn");
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id) {
        return NextResponse.json({ success: false, error: "Missing Lesson ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
        .from("lessons")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    revalidatePath("/learn");
    return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id) {
        return NextResponse.json({ success: false, error: "Missing Lesson ID" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lesson: data });
}
