import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSession, isAdminAuthenticated } from "@/lib/auth";
import { calculateWikiReadTime, getWikiPublishDate } from "@/lib/wiki";

export async function GET(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "pending";

        let query = supabase
            .from("wiki_submissions")
            .select("*, author_details:users(display_name, avatar_url)")
            .order("created_at", { ascending: false });

        if (status !== "all") {
            query = query.eq("status", status);
        }

        const result = await query;

        if (result.error) {
            console.error("Supabase error fetching wiki submissions:", result.error);

            let fallbackQuery = supabase
                .from("wiki_submissions")
                .select("*")
                .order("created_at", { ascending: false });

            if (status !== "all") {
                fallbackQuery = fallbackQuery.eq("status", status);
            }

            const fallbackResult = await fallbackQuery;
            if (fallbackResult.error) {
                return NextResponse.json({ success: false, error: fallbackResult.error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, submissions: fallbackResult.data || [] });
        }

        return NextResponse.json({ success: true, submissions: result.data || [] });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id, action, review_notes } = await req.json();
        const normalizedReviewNotes = String(review_notes || "").trim() || null;

        if (!id || !["approve", "reject"].includes(action)) {
            return NextResponse.json({ success: false, error: "Yêu cầu duyệt bài không hợp lệ" }, { status: 400 });
        }

        const { data: submission, error: fetchError } = await supabase
            .from("wiki_submissions")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !submission) {
            return NextResponse.json({ success: false, error: "Không tìm thấy bài chờ duyệt" }, { status: 404 });
        }

        if (submission.status !== "pending") {
            return NextResponse.json({ success: false, error: "Bài viết này đã được xử lý trước đó" }, { status: 400 });
        }

        if (action === "reject") {
            const { error: rejectError } = await supabase
                .from("wiki_submissions")
                .update({
                    status: "rejected",
                    review_notes: normalizedReviewNotes,
                    reviewed_by: session.username,
                    reviewed_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (rejectError) {
                return NextResponse.json({ success: false, error: rejectError.message }, { status: 500 });
            }

            revalidatePath("/wiki/manage");
            revalidatePath("/dashboard");
            revalidatePath("/wiki/review");

            return NextResponse.json({ success: true, moderationStatus: "rejected" });
        }

        const { data: publishedPost, error: insertError } = await supabase
            .from("wiki_posts")
            .insert([{
                title: submission.title,
                slug: submission.slug,
                excerpt: submission.excerpt,
                content: submission.content,
                author: submission.author,
                author_role: submission.author_role || "member",
                category: submission.category,
                image_url: submission.image_url,
                date: getWikiPublishDate(),
                read_time: calculateWikiReadTime(submission.content || ""),
                approved_submission_id: submission.id,
            }])
            .select()
            .single();

        if (insertError) {
            if (insertError.code === "23505") {
                return NextResponse.json({ success: false, error: "Slug bài viết đã tồn tại trong Wiki" }, { status: 400 });
            }
            return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }

        const { error: deleteSubmissionError } = await supabase
            .from("wiki_submissions")
            .delete()
            .eq("id", id);

        if (deleteSubmissionError) {
            await supabase.from("wiki_posts").delete().eq("slug", publishedPost.slug);
            return NextResponse.json({ success: false, error: deleteSubmissionError.message }, { status: 500 });
        }

        revalidatePath("/wiki");
        revalidatePath("/wiki/manage");
        revalidatePath("/dashboard");
        revalidatePath("/wiki/review");
        revalidatePath(`/wiki/${publishedPost.slug}`);

        return NextResponse.json({
            success: true,
            moderationStatus: "approved",
            post: publishedPost,
        });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
