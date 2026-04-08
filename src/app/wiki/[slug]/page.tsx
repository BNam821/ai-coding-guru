import { ArrowLeft, Sparkles, Edit } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { ArticleActions } from "@/components/wiki/article-actions";
import Link from "next/link";
import Image from "next/image";
import "highlight.js/styles/atom-one-dark.css";
import { WikiImage } from "@/components/wiki/wiki-image";
import { WikiArticleMeta } from "@/components/wiki/wiki-article-meta";
import { supabase } from "@/lib/supabase";
import { getSession, isUserAuthenticated } from "@/lib/auth";
import { HistoryTracker } from "@/components/history/history-tracker";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import type { WikiEditHistoryEntry } from "@/lib/wiki";

export const revalidate = 60; // Tự động cập nhật dữ liệu sau mỗi 60 giây
export const dynamic = "force-dynamic";

function getStableRelatedOrder(referenceSlug: string, candidateSlug: string) {
    const seed = `${referenceSlug}:${candidateSlug}`;
    let hash = 0;

    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
    }

    return hash;
}

export default async function WikiDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    let post: any = null;
    let relatedPosts: any[] = [];
    let editHistory: WikiEditHistoryEntry[] = [];
    const isLoggedIn = await isUserAuthenticated();
    const session = await getSession();

    try {
        const { data, error } = await supabase
            .from("wiki_posts")
            .select("*, author_details:users(display_name, avatar_url)")
            .eq("slug", slug)
            .single();

        if (error) {
            console.error("Error fetching wiki detail:", error);
            // Fallback: Query cơ bản không join nếu lỗi quan hệ
            const fallback = await supabase.from("wiki_posts").select("*").eq("slug", slug).single();
            post = fallback.data;
        } else {
            post = data;
        }

        const { data: historyData, error: historyError } = await supabase
            .from("wiki_post_edit_history")
            .select("edited_at, editor_username, editor_display_name, edit_reason")
            .eq("post_slug", slug)
            .order("edited_at", { ascending: false });

        if (historyError) {
            console.error("Error fetching wiki edit history:", historyError);
        } else {
            editHistory = historyData || [];
        }

        // Fetch related posts (same category, different slug)
        if (post) {
            const { data: relatedData } = await supabase
                .from("wiki_posts")
                .select("slug, title, category")
                .eq("category", post.category)
                .neq("slug", slug)
                .limit(10); // Get a small pool to shuffle

            if (relatedData) {
                relatedPosts = relatedData
                    .sort((left, right) => (
                        getStableRelatedOrder(slug, left.slug) - getStableRelatedOrder(slug, right.slug)
                    ))
                    .slice(0, 3);
            }
        }
    } catch (e) {
        console.error("Failed to fetch wiki post or related posts:", e);
    }

    if (!post) {
        return (
            <main className="min-h-screen pt-32 pb-20 px-4 relative z-10 text-center">
                <h1 className="text-4xl font-bold text-white mb-8">Không tìm thấy bài viết</h1>
                <Link href="/wiki" className="text-accent-secondary hover:underline">Quay lại danh sách</Link>
            </main>
        );
    }

    return (
        <main className="relative z-10 min-h-screen px-4 pb-20 pt-32">
            <HistoryTracker
                type="wiki"
                isLoggedIn={isLoggedIn}
                data={{
                    post_slug: post.slug,
                    post_title: post.title
                }}
            />
            {/* Focal Gentle Aura for reading content */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent-secondary/5 rounded-full blur-[200px] -z-10" />

            <div className="container mx-auto max-w-7xl min-w-0">
                {/* Back Button */}
                {/* Top Bar: Back & Edit */}
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link href="/wiki" className="inline-flex items-center gap-2 text-white font-bold hover:text-accent-secondary transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại Thư viện</span>
                    </Link>

                    {/* Show Edit button if author */}
                    {post && (session?.username === post.author || session?.role === "admin") && (
                        <Link
                            href={`/wiki/${slug}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/10"
                        >
                            <Edit size={16} />
                            <span>Sửa bài viết</span>
                        </Link>
                    )}
                </div>

                <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_350px]">
                    {/* Left Column: Content */}
                    <div className="min-w-0 space-y-8">
                        <header className="space-y-6">
                            <div className="inline-block px-4 py-1.5 rounded-full bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-sm font-semibold">
                                {post.category || "Hướng dẫn"}
                            </div>
                            <h1 className="break-words text-3xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl lg:text-6xl">
                                {post.title}
                            </h1>

                            <WikiArticleMeta
                                authorUsername={post.author}
                                authorDisplayName={post.author_details?.display_name || post.author}
                                authorAvatarUrl={post.author_details?.avatar_url}
                                authorRole={post.author_role}
                                date={post.date}
                                readTime={post.read_time}
                                editHistory={editHistory}
                            />
                        </header>

                        {/* Article Content */}
                        <div className="prose prose-invert prose-slate max-w-none min-w-0">
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 mb-12 block">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                {post.image_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={post.image_url}
                                        alt={post.title}
                                        className="w-full h-full object-cover opacity-90 block !m-0"
                                    />
                                ) : (
                                    <Image
                                        src="/bgt2.jpg"
                                        alt="Hero Image"
                                        fill
                                        className="object-cover opacity-80 block !m-0"
                                    />
                                )}
                            </div>

                            <MarkdownRenderer
                                content={post.content.trim()}
                                mode="full"
                                className="mb-12 text-white"
                                imageComponent={WikiImage}
                                preserveWikiTips
                            />
                        </div>

                        {/* Article Actions (Share & Save) */}
                        <ArticleActions slug={post.slug} />
                    </div>

                    {/* Right Column: Sidebar */}
                    <aside className="min-w-0 space-y-8">
                        <div className="sticky top-32 space-y-8">
                            <GlassCard className="p-6">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Sparkles size={20} className="text-accent-secondary" />
                                    Gợi ý cho bạn
                                </h3>
                                <div className="space-y-4">
                                    {relatedPosts.map((post) => (
                                        <Link
                                            key={post.slug}
                                            href={`/wiki/${post.slug}`}
                                            className="block p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent-secondary/30 hover:bg-white/10 transition-all group"
                                        >
                                            <h4 className="text-sm font-medium text-white group-hover:text-accent-secondary transition-colors line-clamp-2">
                                                {post.title}
                                            </h4>
                                            <span className="text-[10px] text-accent-secondary mt-2 inline-block font-semibold group-hover:translate-x-1 transition-transform">
                                                Đọc ngay →
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </GlassCard>

                            <div className="relative group overflow-hidden rounded-2xl border border-white/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/40 to-accent-secondary/40 z-10 group-hover:scale-110 transition-transform duration-500" />
                                <div className="relative z-20 p-8 text-center space-y-4">
                                    <h3 className="text-xl font-bold text-white">Sẵn sàng thử thách?</h3>
                                    <p className="text-sm text-white/80">Làm bài kiểm tra ngay để nhận chứng chỉ AI Guru!</p>
                                    <Link
                                        href="/test"
                                        className="inline-block w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-starlight transition-colors"
                                    >
                                        Bắt đầu thi
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
