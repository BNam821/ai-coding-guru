import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeText(value: unknown, maxLength = 200) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
}

function normalizeId(value: string) {
    return value.trim();
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const courseId = normalizeId(id);
        const body = await request.json();
        const title = normalizeText(body.title);
        const description = normalizeText(body.description, 1000) || null;

        if (!courseId || !title) {
            return NextResponse.json({ success: false, error: "Course ID and title are required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("courses")
            .update({ title, description })
            .eq("id", courseId)
            .select();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
        }

        revalidatePath("/learn");
        return NextResponse.json({ success: true, course: data[0] });
    } catch {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = normalizeId(id);

    if (!courseId) {
        return NextResponse.json({ success: false, error: "Missing course ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
        .from("courses")
        .delete()
        .eq("id", courseId);

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    revalidatePath("/learn");
    return NextResponse.json({ success: true });
}
