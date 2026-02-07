import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";

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
                author: newPost.author,
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
