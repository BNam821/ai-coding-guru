"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Save, Tag, Type, User } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { AuthorRoleBadge } from "@/components/wiki/author-role-badge";

type Params = Promise<{ id: string }>;

export default function EditSubmissionPage({ params }: { params: Params }) {
    const { id } = use(params);
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("Hướng dẫn");
    const [author, setAuthor] = useState("");
    const [role, setRole] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState("");
    const [formError, setFormError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sessionRes = await fetch("/api/auth/session");
                const sessionData = await sessionRes.json();

                if (!sessionData.username) {
                    router.push("/wiki");
                    return;
                }

                setAuthor(sessionData.username);
                setRole(sessionData.role);

                const response = await fetch(`/api/wiki/submissions/${id}`);
                const payload = await response.json();

                if (!response.ok || !payload.success) {
                    setPageError(payload.error || "Không thể tải bài viết đang duyệt.");
                    return;
                }

                setTitle(payload.submission.title);
                setExcerpt(payload.submission.excerpt);
                setContent(payload.submission.content);
                setCategory(payload.submission.category);
                setImageUrl(payload.submission.image_url || "");
            } catch {
                setPageError("Không thể tải dữ liệu bài viết.");
            }
        };

        fetchData();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError("");

        try {
            const response = await fetch(`/api/wiki/submissions/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    excerpt,
                    content,
                    category,
                    image_url: imageUrl,
                }),
            });

            const payload = await response.json();
            if (!response.ok || !payload.success) {
                setFormError(payload.error || "Không thể cập nhật bài viết đang duyệt.");
                return;
            }

            sessionStorage.setItem("wiki_notice", "Bài viết đang duyệt đã được cập nhật.");
            router.push("/wiki/manage");
            router.refresh();
        } catch {
            setFormError("Không thể kết nối tới server.");
        } finally {
            setIsLoading(false);
        }
    };

    if (pageError) {
        return (
            <main className="min-h-screen pt-32 pb-20 px-4 relative z-10 text-center">
                <GlassCard className="p-8 inline-block" hoverEffect={false}>
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Lỗi: {pageError}</h1>
                    <Link href="/wiki/manage" className="text-white hover:underline">Quay lại quản lý bài viết</Link>
                </GlassCard>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-accent-secondary/5 rounded-full blur-[150px] -z-10" />

            <div className="container mx-auto max-w-4xl">
                <Link href="/wiki/manage" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Quay lại quản lý bài viết</span>
                </Link>

                <header className="mb-12 space-y-4">
                    <h1 className="text-4xl font-bold text-white">Chỉnh sửa bài viết đang duyệt</h1>
                    <p className="text-white/60 max-w-3xl">
                        Bạn có thể cập nhật nội dung trước khi bài viết được đội dự án duyệt và đăng lên Wiki.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-[1fr_250px] gap-8">
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
                                    className="w-full bg-transparent p-6 text-2xl font-bold text-white focus:outline-none placeholder:text-white/20"
                                    required
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <FileText size={18} className="text-accent-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Tóm tắt ngắn</span>
                                </div>
                                <textarea
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 min-h-[100px] resize-none"
                                    required
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <Tag size={18} className="text-accent-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Link ảnh bìa</span>
                                </div>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 text-sm"
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <FileText size={18} className="text-accent-secondary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Nội dung chi tiết</span>
                                </div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 min-h-[400px] leading-relaxed font-mono"
                                    required
                                />
                            </GlassCard>
                        </div>

                        <aside className="space-y-6">
                            <GlassCard className="p-6 border-white/10 space-y-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                        <User size={14} /> Tác giả
                                    </label>
                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-bold text-accent-primary">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                            {author || "..."}
                                        </div>
                                        {role && <AuthorRoleBadge role={role} />}
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

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                                    Sau khi lưu, bài viết vẫn nằm trong hàng chờ duyệt cho tới khi được ADMIN chấp thuận.
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    {formError && <p className="text-red-400 text-xs mb-4 text-center">{formError}</p>}
                                    <NeonButton
                                        type="submit"
                                        variant="secondary"
                                        className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 normal-case tracking-normal"
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
