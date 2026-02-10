import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// POST: Create a new chapter
export async function POST(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, course_id, order } = await req.json();

        if (!title || !course_id) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // If order is not provided, auto-calculate the next order value
        let chapterOrder = order;
        if (!chapterOrder) {
            const { data: existing } = await supabase
                .from("chapters")
                .select("order")
                .eq("course_id", course_id)
                .order("order", { ascending: false })
                .limit(1);

            chapterOrder = existing && existing.length > 0 ? existing[0].order + 1 : 1;
        }

        const { data, error } = await supabase
            .from("chapters")
            .insert([{ title, course_id, order: chapterOrder }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/learn");
        return NextResponse.json({ success: true, chapter: data });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Update a chapter's title
export async function PUT(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, title } = await req.json();

        if (!id || !title) {
            return NextResponse.json({ success: false, error: "Missing required fields (id, title)" }, { status: 400 });
        }

        const { error } = await supabase
            .from("chapters")
            .update({ title })
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
