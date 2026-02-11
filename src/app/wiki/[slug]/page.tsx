import { Calendar, User, Clock, ArrowLeft, Sparkles, Edit } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { ArticleActions } from "@/components/wiki/article-actions";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
// @ts-ignore
import { WikiImage } from "@/components/wiki/wiki-image";

const relatedPosts: any[] = [];

import { supabase } from "@/lib/supabase";
import { getSession, isUserAuthenticated } from "@/lib/auth";
import { HistoryTracker } from "@/components/history/history-tracker";

export const revalidate = 60; // Tự động cập nhật dữ liệu sau mỗi 60 giây

export default async function WikiDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    let post: any = null;
    const isLoggedIn = await isUserAuthenticated();

    try {
        const { data, error } = await supabase
            .from("wiki_posts")
            .select("*, author_details:users(display_name, avatar_url)")
            .eq("slug", slug)
            .single();

        if (!error && data) {
            post = data;
        }
    } catch (e) {
        console.error("Failed to fetch wiki post:", e);
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
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
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

            <div className="container mx-auto max-w-7xl">
                {/* Back Button */}
                {/* Top Bar: Back & Edit */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/wiki" className="inline-flex items-center gap-2 text-white font-bold hover:text-accent-secondary transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại Thư viện</span>
                    </Link>

                    {/* Show Edit button if author */}
                    {post && (await getSession())?.username === post.author && (
                        <Link
                            href={`/wiki/${slug}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/10"
                        >
                            <Edit size={16} />
                            <span>Sửa bài viết</span>
                        </Link>
                    )}
                </div>

                <div className="grid lg:grid-cols-[1fr_350px] gap-12">
                    {/* Left Column: Content */}
                    <div className="space-y-8">
                        <header className="space-y-6">
                            <div className="inline-block px-4 py-1.5 rounded-full bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-sm font-semibold">
                                {post.category || "Hướng dẫn"}
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight drop-shadow-sm">
                                {post.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-white text-sm border-y border-white/10 py-6">
                                <div className="flex items-center gap-2">
                                    {post.author_details?.avatar_url ? (
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                            <img
                                                src={post.author_details.avatar_url}
                                                alt={post.author_details.display_name || post.author}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold shrink-0">
                                            {(post.author_details?.display_name?.[0] || post.author?.[0] || 'A').toUpperCase()}
                                        </div>
                                    )}
                                    <span>Tác giả: <b className="text-white">{post.author_details?.display_name || post.author}</b></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>{post.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>{post.read_time} đọc</span>
                                </div>
                            </div>
                        </header>

                        {/* Article Content */}
                        <div className="prose prose-invert prose-slate max-w-none">
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 mb-12 block">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                {post.image_url ? (
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

                            <div className="markdown-content text-white mb-12">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        img: ({ node, ...props }) => <WikiImage {...props} />
                                    }}
                                >
                                    {post.content.trim()}
                                </ReactMarkdown>
                            </div>

                            {post.tips && (
                                <div className="glass-panel py-2.5 px-4 rounded-lg border-l-2 border-accent-secondary bg-accent-secondary/5 my-5 animate-in fade-in slide-in-from-left-4 duration-500 max-w-2xl">
                                    <div className="flex items-center gap-2.5">
                                        <Sparkles size={16} className="text-accent-secondary shrink-0" />
                                        <p className="text-white/90 italic leading-tight text-base">
                                            <span className="font-bold text-accent-secondary mr-2 uppercase tracking-tight text-sm">Mẹo:</span>
                                            "{post.tips}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Article Actions (Share & Save) */}
                        <ArticleActions slug={post.slug} />
                    </div>

                    {/* Right Column: Sidebar */}
                    <aside className="space-y-8">
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
