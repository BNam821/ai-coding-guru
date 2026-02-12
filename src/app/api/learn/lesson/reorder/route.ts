import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function PATCH(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { lessons } = await req.json(); // Array of { id, order }

        if (!lessons || !Array.isArray(lessons)) {
            return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 });
        }

        // Perform batch update using a loop (Supabase doesn't have a built-in batch update by ID for different values in one call easily without RPC)
        // For small number of lessons, individual updates are fine. 
        // For larger ones, a custom RPC function in Supabase would be better.

        const promises = lessons.map(lesson =>
            supabase
                .from("lessons")
                .update({ order: lesson.order })
                .eq("id", lesson.id)
        );

        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error).map(r => r.error);

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
