import { Calendar, User, Clock, ArrowLeft, Share2, Bookmark, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

const relatedPosts: any[] = [];

import { supabase } from "@/lib/supabase";

export default async function WikiDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    let post: any = null;

    try {
        const { data, error } = await supabase
            .from("wiki_posts")
            .select("*")
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
            {/* Focal Gentle Aura for reading content */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent-secondary/5 rounded-full blur-[200px] -z-10" />

            <div className="container mx-auto max-w-7xl">
                {/* Back Button */}
                <Link href="/wiki" className="inline-flex items-center gap-2 text-white font-bold hover:text-accent-secondary transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Quay lại Thư viện</span>
                </Link>

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
                                    <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold">
                                        {post.author?.[0] || 'A'}
                                    </div>
                                    <span>Tác giả: <b className="text-white">{post.author}</b></span>
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
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 mb-12">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                <Image
                                    src="/bgt2.jpg"
                                    alt="Hero Image"
                                    fill
                                    className="object-cover opacity-80"
                                />
                            </div>

                            <div className="markdown-content text-white mb-12">
                                <ReactMarkdown>{post.content.trim()}</ReactMarkdown>
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

                        {/* Social Share */}
                        <div className="flex items-center gap-4 pt-12 border-t border-white/5">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm">
                                <Share2 size={16} /> Chia sẻ
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm">
                                <Bookmark size={16} /> Lưu bài viết
                            </button>
                        </div>
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
