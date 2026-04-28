import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeText(value: unknown, maxLength = 200) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
}

// POST: Create a new chapter
export async function POST(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const title = normalizeText(body.title);
        const courseId = normalizeText(body.course_id, 120);
        const providedOrder = Number(body.order);

        if (!title || !courseId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const { data: course } = await supabaseAdmin
            .from("courses")
            .select("id")
            .eq("id", courseId)
            .maybeSingle();

        if (!course) {
            return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
        }

        let chapterOrder = Number.isFinite(providedOrder) && providedOrder > 0 ? Math.floor(providedOrder) : 0;
        if (!chapterOrder) {
            const { data: existing } = await supabaseAdmin
                .from("chapters")
                .select("order")
                .eq("course_id", courseId)
                .order("order", { ascending: false })
                .limit(1);

            chapterOrder = existing && existing.length > 0 ? existing[0].order + 1 : 1;
        }

        const { data, error } = await supabaseAdmin
            .from("chapters")
            .insert([{ title, course_id: courseId, order: chapterOrder }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/learn");
        return NextResponse.json({ success: true, chapter: data });
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

        if (!id || !title) {
            return NextResponse.json({ success: false, error: "Missing required fields (id, title)" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("chapters")
            .update({ title })
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

    try {
        const body = await req.json();
        const id = normalizeText(body.id, 120);

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing required field (id)" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("chapters")
            .delete()
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
