import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
    normalizeAnnouncementMessage,
    validateAnnouncementMessage,
} from "@/lib/announcements";

const announcementClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

async function requireAdminSession() {
    const session = await getSession();
    if (session?.role !== "admin") {
        return null;
    }

    return session;
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAdminSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const announcementId = Number(id);

        if (!Number.isFinite(announcementId)) {
            return NextResponse.json({ success: false, error: "ID thông báo không hợp lệ" }, { status: 400 });
        }

        const body = await request.json();
        const message = normalizeAnnouncementMessage(body.message);
        const validationError = validateAnnouncementMessage(message);

        if (validationError) {
            return NextResponse.json({ success: false, error: validationError }, { status: 400 });
        }

        const { data, error } = await announcementClient
            .from("site_announcements")
            .update({
                message,
                created_by: session.username,
            })
            .eq("id", announcementId)
            .select("id, message, created_at, updated_at, created_by")
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, announcement: data });
    } catch (error) {
        console.error("Failed to update announcement:", error);
        return NextResponse.json({ success: false, error: "Không thể cập nhật thông báo" }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAdminSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const announcementId = Number(id);

        if (!Number.isFinite(announcementId)) {
            return NextResponse.json({ success: false, error: "ID thông báo không hợp lệ" }, { status: 400 });
        }

        const { error } = await announcementClient
            .from("site_announcements")
            .delete()
            .eq("id", announcementId);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete announcement:", error);
        return NextResponse.json({ success: false, error: "Không thể xóa thông báo" }, { status: 500 });
    }
}
