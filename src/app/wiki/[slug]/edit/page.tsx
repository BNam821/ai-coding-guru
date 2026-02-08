"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { ArrowLeft, Send, Save, Type, FileText, User, Tag, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export default function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);

    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [tips, setTips] = useState("");
    const [category, setCategory] = useState("Hướng dẫn");
    const [author, setAuthor] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            // 1. Check session
            const sessionRes = await fetch("/api/auth/session");
            const sessionData = await sessionRes.json();

            if (!sessionData.username) {
                router.push("/login");
                return;
            }
            setAuthor(sessionData.username);

            // 2. Fetch post data
            try {
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                const { data: post, error } = await supabase
                    .from("wiki_posts")
                    .select("*")
                    .eq("slug", slug)
                    .single();

                if (error || !post) {
                    setError("Không tìm thấy bài viết");
                    return;
                }

                // Check if user is author
                if (post.author !== sessionData.username && sessionData.role !== 'admin') {
                    setError("Bạn không có quyền sửa bài viết này");
                    setTimeout(() => router.push(`/wiki/${slug}`), 3000);
                    return;
                }

                setTitle(post.title);
                setExcerpt(post.excerpt);
                setContent(post.content);
                setTips(post.tips || "");
                setCategory(post.category);
                setImageUrl(post.image_url || "");

            } catch (err) {
                console.error(err);
                setError("Lỗi tải dữ liệu");
            }
        };
        fetchData();
    }, [slug, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/wiki", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, title, excerpt, content, tips, category, image_url: imageUrl }),
            });

            const data = await res.json();
            if (data.success) {
                router.push(`/wiki/${slug}`);
                router.refresh();
            } else {
                setError(data.error || "Không thể cập nhật bài viết.");
            }
        } catch (err) {
            setError("Đã có lỗi xảy ra khi kết nối server.");
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <main className="min-h-screen pt-32 pb-20 px-4 relative z-10 text-center">
                <GlassCard className="p-8 inline-block">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">⚠️ Lỗi: {error}</h1>
                    <Link href={`/wiki/${slug}`} className="text-white hover:underline">Quay lại bài viết</Link>
                </GlassCard>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            {/* Gentle Neon Aura */}
            <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-accent-secondary/5 rounded-full blur-[150px] -z-10" />

            <div className="container mx-auto max-w-4xl">
                <Link href={`/wiki/${slug}`} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Hủy và quay lại</span>
                </Link>

                <header className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-2">Chỉnh sửa bài viết</h1>
                    <p className="text-white/60">Cập nhật nội dung cho bài viết: <span className="text-accent-secondary">{title}</span></p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-[1fr_250px] gap-8">
                        {/* Left: Main Editor */}
                        <div className="space-y-6">
                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <Type size={18} className="text-accent-secondary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Tiêu đề bài viết</span>
                                </div>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Tiêu đề..."
                                    className="w-full bg-transparent p-6 text-2xl font-bold text-white focus:outline-none placeholder:text-white/20"
                                    required
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <FileText size={18} className="text-accent-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Tóm tắt ngắn (Excerpt)</span>
                                </div>
                                <textarea
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder="Mô tả ngắn gọn..."
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 min-h-[100px] resize-none"
                                    required
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <Tag size={18} className="text-accent-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Link ảnh bìa (Thumbnail URL)</span>
                                </div>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 text-sm"
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <FileText size={18} className="text-accent-secondary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Nội dung chi tiết (Markdown hỗ trợ)</span>
                                </div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Nội dung bài viết..."
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 min-h-[400px] leading-relaxed font-mono"
                                    required
                                />
                            </GlassCard>
                        </div>

                        {/* Right: Settings */}
                        <aside className="space-y-6">
                            <GlassCard className="p-6 border-white/10 space-y-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                        <User size={14} /> Tác giả
                                    </label>
                                    <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-accent-primary text-sm font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        {author || "..."}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                        <Tag size={14} /> Chuyên mục
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-secondary/50 appearance-none"
                                    >
                                        <option value="Hướng dẫn" className="bg-deep-space">Hướng dẫn</option>
                                        <option value="Ngôn ngữ" className="bg-deep-space">Ngôn ngữ</option>
                                        <option value="AI & ML" className="bg-deep-space">AI & ML</option>
                                        <option value="DevOps" className="bg-deep-space">DevOps</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 text-accent-secondary">
                                        <Sparkles size={14} /> Mẹo chuyên gia
                                    </label>
                                    <textarea
                                        value={tips}
                                        onChange={(e) => setTips(e.target.value)}
                                        placeholder="Mẹo..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-secondary/50 min-h-[100px] resize-none"
                                    />
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    <NeonButton
                                        type="submit"
                                        variant="secondary"
                                        className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Đang lưu..." : <><Save size={18} /> Lưu thay đổi</>}
                                    </NeonButton>
                                </div>
                            </GlassCard>
                        </aside>
                    </div>
                </form>
            </div>
        </main>
    );
}
