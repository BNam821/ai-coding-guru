import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession, isUserAuthenticated } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { calculateWikiReadTime, generateWikiSlug } from "@/lib/wiki";

function validateWikiPayload(payload: Record<string, unknown>) {
    const title = String(payload.title || "").trim();
    const excerpt = String(payload.excerpt || "").trim();
    const content = String(payload.content || "").trim();
    const category = String(payload.category || "").trim();
    const image_url = String(payload.image_url || "").trim();

    if (!title || !excerpt || !content || !category) {
        return { error: "Thiếu thông tin bài viết bắt buộc" };
    }

    return {
        title,
        excerpt,
        content,
        category,
        image_url: image_url || null,
    };
}

async function hasSlugConflict(slug: string, currentId: number) {
    const [{ data: publishedPost }, { data: pendingSubmission }] = await Promise.all([
        supabase
            .from("wiki_posts")
            .select("slug")
            .eq("slug", slug)
            .maybeSingle(),
        supabase
            .from("wiki_submissions")
            .select("id")
            .eq("slug", slug)
            .eq("status", "pending")
            .neq("id", currentId)
            .maybeSingle(),
    ]);

    return !!publishedPost || !!pendingSubmission;
}

async function getAuthorizedSubmission(id: number, username: string, role: string) {
    const { data: submission, error } = await supabase
        .from("wiki_submissions")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !submission) {
        return { error: "Không tìm thấy bài viết đang duyệt", submission: null };
    }

    if (submission.author !== username && role !== "admin") {
        return { error: "Bạn không có quyền thao tác với bài viết này", submission: null };
    }

    return { error: null, submission };
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isUserAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const submissionId = Number(id);

        if (!Number.isFinite(submissionId)) {
            return NextResponse.json({ success: false, error: "ID bài viết không hợp lệ" }, { status: 400 });
        }

        const { error, submission } = await getAuthorizedSubmission(submissionId, session.username, session.role);
        if (error || !submission) {
            return NextResponse.json({ success: false, error }, { status: error === "Không tìm thấy bài viết đang duyệt" ? 404 : 403 });
        }

        return NextResponse.json({ success: true, submission });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isUserAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const submissionId = Number(id);
        const body = await req.json();
        const payload = validateWikiPayload(body);

        if (!Number.isFinite(submissionId)) {
            return NextResponse.json({ success: false, error: "ID bài viết không hợp lệ" }, { status: 400 });
        }

        if ("error" in payload) {
            return NextResponse.json({ success: false, error: payload.error }, { status: 400 });
        }

        const { error, submission } = await getAuthorizedSubmission(submissionId, session.username, session.role);
        if (error || !submission) {
            return NextResponse.json({ success: false, error }, { status: error === "Không tìm thấy bài viết đang duyệt" ? 404 : 403 });
        }

        if (submission.status !== "pending") {
            return NextResponse.json({ success: false, error: "Chỉ bài đang duyệt mới có thể chỉnh sửa" }, { status: 400 });
        }

        const slug = generateWikiSlug(payload.title);
        if (!slug) {
            return NextResponse.json({ success: false, error: "Không thể tạo slug hợp lệ từ tiêu đề" }, { status: 400 });
        }

        if (await hasSlugConflict(slug, submissionId)) {
            return NextResponse.json({ success: false, error: "Slug này đã tồn tại hoặc đang chờ duyệt" }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from("wiki_submissions")
            .update({
                title: payload.title,
                slug,
                excerpt: payload.excerpt,
                content: payload.content,
                category: payload.category,
                image_url: payload.image_url,
                read_time: calculateWikiReadTime(payload.content),
            })
            .eq("id", submissionId);

        if (updateError) {
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        revalidatePath("/wiki/manage");
        revalidatePath("/dashboard");
        revalidatePath("/wiki/review");

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isUserAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const submissionId = Number(id);

        if (!Number.isFinite(submissionId)) {
            return NextResponse.json({ success: false, error: "ID bài viết không hợp lệ" }, { status: 400 });
        }

        const { error, submission } = await getAuthorizedSubmission(submissionId, session.username, session.role);
        if (error || !submission) {
            return NextResponse.json({ success: false, error }, { status: error === "Không tìm thấy bài viết đang duyệt" ? 404 : 403 });
        }

        const { error: deleteError } = await supabase
            .from("wiki_submissions")
            .delete()
            .eq("id", submissionId);

        if (deleteError) {
            return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
        }

        revalidatePath("/wiki/manage");
        revalidatePath("/dashboard");
        revalidatePath("/wiki/review");

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
