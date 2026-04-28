import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeText(value: unknown, maxLength = 200) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
}

// GET: Get all courses
export async function GET() {
    const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("order", { ascending: true });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, courses: data || [] });
}

// POST: Create a new course (Admin only)
export async function POST(request: NextRequest) {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const title = normalizeText(body.title);
        const slug = normalizeText(body.slug, 120).toLowerCase();
        const description = normalizeText(body.description, 1000) || null;

        if (!title || !slug) {
            return NextResponse.json({ success: false, error: "Title and slug are required" }, { status: 400 });
        }

        const { data: maxOrderData } = await supabaseAdmin
            .from("courses")
            .select("order")
            .order("order", { ascending: false })
            .limit(1);

        const newOrder = (maxOrderData?.[0]?.order || 0) + 1;

        const { data, error } = await supabaseAdmin
            .from("courses")
            .insert({
                title,
                slug,
                description,
                order: newOrder,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, course: data });
    } catch {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }
}
