import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSession, isUserAuthenticated } from "@/lib/auth";
import {
    calculateWikiReadTime,
    generateWikiSlug,
    getWikiAuthorRole,
    getWikiPublishDate,
} from "@/lib/wiki";

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

async function hasSlugConflict(slug: string) {
    const [{ data: publishedPost }, { data: activeSubmission }] = await Promise.all([
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
            .maybeSingle(),
    ]);

    return !!publishedPost || !!activeSubmission;
}

function validateEditReason(value: unknown) {
    const editReason = String(value || "").trim();

    if (!editReason) {
        return { error: "Lí do chỉnh sửa là bắt buộc" };
    }

    return { editReason };
}

// GET: Lấy danh sách bài viết đã xuất bản
export async function GET() {
    try {
        const { data: posts, error } = await supabase
            .from("wiki_posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase error:", error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(posts);
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Admin đăng trực tiếp, Member gửi bài chờ duyệt
export async function POST(req: Request) {
    if (!(await isUserAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const payload = validateWikiPayload(await req.json());
        if ("error" in payload) {
            return NextResponse.json({ success: false, error: payload.error }, { status: 400 });
        }

        const slug = generateWikiSlug(payload.title);
        if (!slug) {
            return NextResponse.json({ success: false, error: "Không thể tạo slug hợp lệ từ tiêu đề" }, { status: 400 });
        }

        if (await hasSlugConflict(slug)) {
            return NextResponse.json({ success: false, error: "Slug này đã tồn tại hoặc đang chờ duyệt" }, { status: 400 });
        }

        const authorRole = getWikiAuthorRole(session.role);
        const readTime = calculateWikiReadTime(payload.content);

        if (authorRole === "admin") {
            const { data, error } = await supabase
                .from("wiki_posts")
                .insert([{
                    ...payload,
                    slug,
                    author: session.username,
                    author_role: authorRole,
                    date: getWikiPublishDate(),
                    read_time: readTime,
                }])
                .select()
                .single();

            if (error) {
                if (error.code === "23505") {
                    return NextResponse.json({ success: false, error: "Slug này đã tồn tại" }, { status: 400 });
                }
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            revalidatePath("/wiki");
            revalidatePath("/wiki/manage");
            revalidatePath(`/wiki/${slug}`);

            return NextResponse.json({
                success: true,
                moderationStatus: "published",
                post: data,
            });
        }

        const { data, error } = await supabase
            .from("wiki_submissions")
            .insert([{
                ...payload,
                slug,
                author: session.username,
                author_role: authorRole,
                read_time: readTime,
                status: "pending",
            }])
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ success: false, error: "Slug này đã tồn tại hoặc đang chờ duyệt" }, { status: 400 });
            }
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/wiki/manage");
        revalidatePath("/wiki/review");

        return NextResponse.json({
            success: true,
            moderationStatus: "pending",
            message: "Bài viết đã được gửi để chờ duyệt trước khi đăng lên Wiki.",
            submission: data,
        });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Cập nhật bài viết đã xuất bản
export async function PUT(req: Request) {
    if (!(await isUserAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const slug = String(body.slug || "").trim();
        const payload = validateWikiPayload(body);
        const editReasonResult = validateEditReason(body.edit_reason);

        if (!slug) {
            return NextResponse.json({ success: false, error: "Thiếu Slug" }, { status: 400 });
        }

        if ("error" in payload) {
            return NextResponse.json({ success: false, error: payload.error }, { status: 400 });
        }

        if ("error" in editReasonResult) {
            return NextResponse.json({ success: false, error: editReasonResult.error }, { status: 400 });
        }

        const [{ data: post, error: fetchError }, { data: editorProfile }] = await Promise.all([
            supabase
                .from("wiki_posts")
                .select("author")
                .eq("slug", slug)
                .single(),
            supabase
                .from("users")
                .select("display_name")
                .eq("username", session.username)
                .maybeSingle(),
        ]);

        if (fetchError || !post) {
            return NextResponse.json({ success: false, error: "Bài viết không tồn tại" }, { status: 404 });
        }

        if (post.author !== session.username && session.role !== "admin") {
            return NextResponse.json({ success: false, error: "Bạn không có quyền sửa bài này" }, { status: 403 });
        }

        const readTime = calculateWikiReadTime(payload.content);

        const { error: updateError } = await supabase
            .from("wiki_posts")
            .update({
                title: payload.title,
                excerpt: payload.excerpt,
                content: payload.content,
                category: payload.category,
                image_url: payload.image_url,
                read_time: readTime,
            })
            .eq("slug", slug);

        if (updateError) {
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        const editorDisplayName = String(editorProfile?.display_name || "").trim() || session.username;

        const { error: historyError } = await supabase
            .from("wiki_post_edit_history")
            .insert([{
                post_slug: slug,
                editor_username: session.username,
                editor_display_name: editorDisplayName,
                edit_reason: editReasonResult.editReason,
            }]);

        if (historyError) {
            return NextResponse.json({ success: false, error: historyError.message }, { status: 500 });
        }

        revalidatePath("/wiki");
        revalidatePath("/wiki/manage");
        revalidatePath(`/wiki/${slug}`);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Tác giả hoặc admin có thể xóa bài đã xuất bản
export async function DELETE(req: Request) {
    if (!(await isUserAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        if (!slug) {
            return NextResponse.json({ success: false, error: "Thiếu Slug" }, { status: 400 });
        }

        const { data: post, error: fetchError } = await supabase
            .from("wiki_posts")
            .select("author")
            .eq("slug", slug)
            .single();

        if (fetchError || !post) {
            return NextResponse.json({ success: false, error: "Bài viết không tồn tại" }, { status: 404 });
        }

        if (post.author !== session.username && session.role !== "admin") {
            return NextResponse.json({ success: false, error: "Bạn không có quyền xóa bài này" }, { status: 403 });
        }

        const { error } = await supabase
            .from("wiki_posts")
            .delete()
            .eq("slug", slug);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/wiki");
        revalidatePath("/wiki/manage");
        revalidatePath(`/wiki/${slug}`);

        return NextResponse.json({ success: true, message: "Xóa bài thành công" });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
