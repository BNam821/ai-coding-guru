import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// POST: Create a new lesson
export async function POST(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, slug, content, chapter_id, order } = await req.json();

        // Validate required fields
        if (!title || !slug || !chapter_id) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("lessons")
            .insert([{ title, slug, content, chapter_id, order }])
            .select()
            .single();

        if (error) {
            if (error.code === "23505") { // Unique violation
                return NextResponse.json({ success: false, error: "Slug này đã tồn tại trong chương này" }, { status: 400 });
            }
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/learn");
        return NextResponse.json({ success: true, lesson: data });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Update an existing lesson
export async function PUT(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, title, slug, content, chapter_id, order } = await req.json();

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing Lesson ID" }, { status: 400 });
        }

        const { error } = await supabase
            .from("lessons")
            .update({ title, slug, content, chapter_id, order })
            .eq("id", id);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/learn");
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Delete a lesson
export async function DELETE(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ success: false, error: "Missing Lesson ID" }, { status: 400 });
    }

    const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }


    revalidatePath("/learn");
    return NextResponse.json({ success: true });
}

// GET: Fetch a single lesson by ID (specifically for Edit page which needs Content)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

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
