import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ReorderLessonInput = {
    id: string;
    order: number;
};

function normalizeLessons(value: unknown): ReorderLessonInput[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item): item is { id?: unknown; order?: unknown } => Boolean(item) && typeof item === "object")
        .map((item) => ({
            id: typeof item.id === "string" ? item.id.trim() : "",
            order: Number(item.order),
        }))
        .filter((item) => item.id && Number.isFinite(item.order) && item.order > 0)
        .map((item) => ({ id: item.id, order: Math.floor(item.order) }));
}

export async function PATCH(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const lessons = normalizeLessons(body.lessons);

        if (lessons.length === 0) {
            return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 });
        }

        const results = await Promise.all(
            lessons.map((lesson) =>
                supabaseAdmin
                    .from("lessons")
                    .update({ order: lesson.order })
                    .eq("id", lesson.id),
            ),
        );

        const errors = results.filter((result) => result.error).map((result) => result.error);
        if (errors.length > 0) {
            console.error("Batch update errors:", errors);
            return NextResponse.json({ success: false, error: "Some updates failed" }, { status: 500 });
        }

        revalidatePath("/learn");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reorder API error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
