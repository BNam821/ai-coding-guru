"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, Send, Tag, Type, User } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { AuthorRoleBadge } from "@/components/wiki/author-role-badge";

type SessionData = {
    username: string | null;
    role: string | null;
};

export default function CreatePostPage() {
    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("Hướng dẫn");
    const [author, setAuthor] = useState("");
    const [role, setRole] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = (await res.json()) as SessionData;

                if (!data.username) {
                    setError("Bạn cần đăng nhập để tạo bài viết mới.");
                    return;
                }

                setAuthor(data.username);
                setRole(data.role);
            } catch {
                setError("Không thể xác thực tài khoản hiện tại.");
            } finally {
                setIsCheckingSession(false);
            }
        };

        checkSession();
    }, []);

    const isAdmin = role === "admin";
    const submitLabel = isAdmin ? "Đăng bài" : "Gửi bài để duyệt";
    const helperText = isAdmin
        ? "Bài viết của ADMIN sẽ được đăng ngay lên Wiki."
        : "Bài viết của MEMBER sẽ được lưu vào Supabase và chờ đội dự án duyệt trước khi xuất hiện trên /wiki.";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!author) {
            setError("Bạn cần đăng nhập để gửi bài viết.");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const res = await fetch("/api/wiki", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, excerpt, content, category, image_url: imageUrl }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.error || "Không thể xử lý bài viết. Vui lòng thử lại.");
                return;
            }

            if (data.moderationStatus === "published") {
                router.push("/wiki");
                router.refresh();
                return;
            }

            setSuccessMessage(data.message || "Bài viết đã được gửi thành công và đang chờ duyệt.");
            setTitle("");
            setExcerpt("");
            setContent("");
            setCategory("Hướng dẫn");
            setImageUrl("");
        } catch {
            setError("Đã có lỗi xảy ra khi kết nối server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-accent-secondary/5 rounded-full blur-[150px] -z-10" />

            <div className="container mx-auto max-w-4xl">
                <Link href="/wiki" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Hủy và quay lại</span>
                </Link>

                <header className="mb-12 space-y-4">
                    <h1 className="text-4xl font-bold text-white">Soạn bài viết mới</h1>
                    <p className="text-white/60 max-w-3xl">{helperText}</p>
                </header>

                {successMessage && (
                    <GlassCard className="mb-8 border-emerald-400/20 bg-emerald-400/10" hoverEffect={false}>
                        <div className="flex items-start gap-3 text-emerald-200">
                            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                            <div className="space-y-2">
                                <p className="font-semibold">Submission đã được gửi.</p>
                                <p className="text-sm text-emerald-100/90">{successMessage}</p>
                            </div>
                        </div>
                    </GlassCard>
                )}

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
                                    placeholder="Ví dụ: Cách tối ưu React Performance 2026"
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
                                    placeholder="Mô tả ngắn gọn nội dung bài viết..."
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
                                    placeholder="https://images.unsplash.com/..."
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
                                    placeholder="Hỗ trợ Markdown mở rộng: # Heading, **In đậm**, [Link](url), $E=mc^2$, $$a^2+b^2=c^2$$ ..."
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
                                            {isCheckingSession ? "Đang xác thực..." : (author || "Chưa đăng nhập")}
                                        </div>
                                        {role && <AuthorRoleBadge role={role} />}
                                    </div>
                                    <p className="text-[10px] text-white/30 italic">Tên tác giả được gắn tự động theo tài khoản hiện tại.</p>
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
                                    {isAdmin
                                        ? "Bạn đang ở chế độ ADMIN. Bài viết sẽ được publish ngay nếu hợp lệ."
                                        : "Bạn đang ở chế độ MEMBER. Bài viết sẽ vào hàng chờ duyệt trong Supabase trước khi publish."}
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    {error && <p className="text-red-400 text-xs mb-4 text-center">{error}</p>}
                                    <NeonButton
                                        type="submit"
                                        variant="secondary"
                                        className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 normal-case tracking-normal"
                                        disabled={isLoading || isCheckingSession || !author}
                                    >
                                        {isLoading ? "Đang xử lý..." : <><Send size={18} /> {submitLabel}</>}
                                    </NeonButton>
                                    <p className="text-[10px] text-white/30 text-center mt-4">
                                        Có thể dùng công thức toán, bảng, checklist và heading linkable.
                                    </p>
                                </div>
                            </GlassCard>
                        </aside>
                    </div>
                </form>
            </div>
        </main>
    );
}

