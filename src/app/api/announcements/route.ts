import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
    ANNOUNCEMENT_LIMIT,
    normalizeAnnouncementMessage,
    validateAnnouncementMessage,
} from "@/lib/announcements";

const announcementClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { data, error } = await announcementClient
            .from("site_announcements")
            .select("id, message, created_at, updated_at, created_by")
            .order("updated_at", { ascending: false })
            .limit(ANNOUNCEMENT_LIMIT);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, announcements: data || [] });
    } catch (error) {
        console.error("Failed to load announcements:", error);
        return NextResponse.json({ success: false, error: "Không thể tải thông báo" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (session?.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const message = normalizeAnnouncementMessage(body.message);
        const validationError = validateAnnouncementMessage(message);

        if (validationError) {
            return NextResponse.json({ success: false, error: validationError }, { status: 400 });
        }

        const { count, error: countError } = await announcementClient
            .from("site_announcements")
            .select("id", { count: "exact", head: true });

        if (countError) {
            return NextResponse.json({ success: false, error: countError.message }, { status: 500 });
        }

        if ((count || 0) >= ANNOUNCEMENT_LIMIT) {
            return NextResponse.json(
                { success: false, error: `Chỉ được lưu tối đa ${ANNOUNCEMENT_LIMIT} thông báo` },
                { status: 400 }
            );
        }

        const { data, error } = await announcementClient
            .from("site_announcements")
            .insert({
                message,
                created_by: session.username,
            })
            .select("id, message, created_at, updated_at, created_by")
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, announcement: data });
    } catch (error) {
        console.error("Failed to create announcement:", error);
        return NextResponse.json({ success: false, error: "Không thể tạo thông báo" }, { status: 500 });
    }
}
