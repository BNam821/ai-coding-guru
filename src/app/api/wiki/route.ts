import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession, isUserAuthenticated } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeOptionalHttpUrl } from "@/lib/security";
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
    const imageUrl = normalizeOptionalHttpUrl(payload.image_url, { allowRelative: true });

    if (!title || !excerpt || !content || !category) {
        return { error: "Thiếu thông tin bài viết bắt buộc" as const };
    }

    if (payload.image_url && !imageUrl) {
        return { error: "Liên kết ảnh bìa không hợp lệ" as const };
    }

    return {
        title,
        excerpt,
        content,
        category,
        image_url: imageUrl,
    };
}

function validateEditReason(value: unknown) {
    const editReason = String(value || "").trim();

    if (!editReason) {
        return { error: "Lý do chỉnh sửa là bắt buộc" as const };
    }

    return { editReason };
}

async function hasSlugConflict(slug: string) {
    const [{ data: publishedPost }, { data: activeSubmission }] = await Promise.all([
        supabaseAdmin
            .from("wiki_posts")
            .select("slug")
            .eq("slug", slug)
            .maybeSingle(),
        supabaseAdmin
            .from("wiki_submissions")
            .select("id")
            .eq("slug", slug)
            .eq("status", "pending")
            .maybeSingle(),
    ]);

    return Boolean(publishedPost || activeSubmission);
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = String(searchParams.get("slug") || "").trim();

        if (slug) {
            const { data: post, error } = await supabaseAdmin
                .from("wiki_posts")
                .select("*")
                .eq("slug", slug)
                .maybeSingle();

            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            if (!post) {
                return NextResponse.json({ success: false, error: "Không tìm thấy bài viết" }, { status: 404 });
            }

            return NextResponse.json({ success: true, post });
        }

        const { data: posts, error } = await supabaseAdmin
            .from("wiki_posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(posts || []);
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

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
            const { data, error } = await supabaseAdmin
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
            revalidatePath("/dashboard");
            revalidatePath(`/wiki/${slug}`);

            return NextResponse.json({
                success: true,
                moderationStatus: "published",
                post: data,
            });
        }

        const { data, error } = await supabaseAdmin
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
        revalidatePath("/dashboard");
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
            return NextResponse.json({ success: false, error: "Thiếu slug" }, { status: 400 });
        }

        if ("error" in payload) {
            return NextResponse.json({ success: false, error: payload.error }, { status: 400 });
        }

        if ("error" in editReasonResult) {
            return NextResponse.json({ success: false, error: editReasonResult.error }, { status: 400 });
        }

        const [{ data: post, error: fetchError }, { data: editorProfile }] = await Promise.all([
            supabaseAdmin
                .from("wiki_posts")
                .select("author")
                .eq("slug", slug)
                .single(),
            supabaseAdmin
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

        const { error: updateError } = await supabaseAdmin
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

        const { error: historyError } = await supabaseAdmin
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
        revalidatePath("/dashboard");
        revalidatePath(`/wiki/${slug}`);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

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
        const slug = searchParams.get("slug")?.trim() || "";

        if (!slug) {
            return NextResponse.json({ success: false, error: "Thiếu slug" }, { status: 400 });
        }

        const { data: post, error: fetchError } = await supabaseAdmin
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

        const { error } = await supabaseAdmin
            .from("wiki_posts")
            .delete()
            .eq("slug", slug);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/wiki");
        revalidatePath("/wiki/manage");
        revalidatePath("/dashboard");
        revalidatePath(`/wiki/${slug}`);

        return NextResponse.json({ success: true, message: "Xóa bài thành công" });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
