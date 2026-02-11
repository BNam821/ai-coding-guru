import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession, isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
    try {
        // Chạy song song tất cả các truy vấn để tối ưu tốc độ
        const [postsResult, sessionResult, adminResult] = await Promise.all([
            supabase.from("wiki_posts").select("*, author:users(display_name, avatar_url)").order("created_at", { ascending: false }),
            getSession(),
            isAdminAuthenticated()
        ]);

        const posts = postsResult.data || [];
        const session = sessionResult;
        const isAdmin = adminResult;

        // Lấy danh sách bài viết đã lưu nếu có session
        let savedSlugs: string[] = [];
        if (session) {
            const { data: savedData } = await supabase
                .from("saved_posts")
                .select("post_slug")
                .eq("username", session.username);

            if (savedData) {
                savedSlugs = savedData.map(d => d.post_slug);
            }
        }

        // Trích xuất categories và authors từ posts (không query thêm)
        const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
        const authors = Array.from(new Set(posts.map(p => p.author).filter(Boolean)));

        return NextResponse.json({
            success: true,
            posts,
            savedSlugs,
            categories,
            authors,
            isAdmin,
            isLoggedIn: !!session
        });
    } catch (error) {
        console.error("Failed to fetch wiki data:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
    }
}
