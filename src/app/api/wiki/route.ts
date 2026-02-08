import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminAuthenticated, isUserAuthenticated, getSession } from "@/lib/auth";

// GET: Lấy danh sách bài viết từ Supabase
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
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Lưu bài viết mới (Chỉ dành cho Admin)
export async function POST(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const newPost = await req.json();

        // Tạo slug từ title nếu không có
        if (!newPost.slug) {
            newPost.slug = newPost.title
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");
        }

        const date = new Date().toLocaleDateString("vi-VN");
        const readTime = `${Math.ceil((newPost.content || "").split(" ").length / 200)} phút`;

        const { data, error } = await supabase
            .from("wiki_posts")
            .insert([{
                title: newPost.title,
                slug: newPost.slug,
                excerpt: newPost.excerpt,
                content: newPost.content,
                author: session.username, // Tự động lấy từ session
                category: newPost.category,
                image_url: newPost.image_url,
                tips: newPost.tips,
                date: date,
                read_time: readTime
            }])
            .select();

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ success: false, error: "Slug này đã tồn tại" }, { status: 400 });
            }
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, post: data[0] });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Cập nhật bài viết (Chỉ tác giả)
export async function PUT(req: Request) {
    if (!(await isUserAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const session = await getSession();
        const { slug, title, excerpt, content, category, image_url, tips } = await req.json();

        if (!slug) {
            return NextResponse.json({ success: false, error: "Thiếu Slug" }, { status: 400 });
        }

        // Check ownership
        const { data: post, error: fetchError } = await supabase
            .from("wiki_posts")
            .select("author")
            .eq("slug", slug)
            .single();

        if (fetchError || !post) {
            return NextResponse.json({ success: false, error: "Bài viết không tồn tại" }, { status: 404 });
        }

        if (post.author !== session.username && session.role !== 'admin') {
            return NextResponse.json({ success: false, error: "Bạn không có quyền sửa bài này" }, { status: 403 });
        }

        const readTime = `${Math.ceil((content || "").split(" ").length / 200)} phút`;

        const { error: updateError } = await supabase
            .from("wiki_posts")
            .update({
                title,
                excerpt,
                content,
                category,
                image_url,
                tips,
                read_time: readTime,
            })
            .eq("slug", slug);

        if (updateError) {
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Xóa bài viết (Chỉ dành cho Admin)
export async function DELETE(req: Request) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        if (!slug) {
            return NextResponse.json({ success: false, error: "Thiếu Slug" }, { status: 400 });
        }

        const { error } = await supabase
            .from("wiki_posts")
            .delete()
            .eq("slug", slug);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Xóa bài thành công" });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
