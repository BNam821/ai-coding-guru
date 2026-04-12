"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3, Edit, FolderClock, FolderOpen, PlusCircle, RefreshCcw, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { AuthorRoleBadge } from "@/components/wiki/author-role-badge";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface PublishedPost {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    image_url?: string | null;
    read_time: string;
    date: string;
    created_at: string;
    author: string;
    author_role?: string;
}

interface PendingSubmission {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    image_url?: string | null;
    read_time: string;
    status: "pending";
    created_at: string;
    updated_at?: string | null;
    author: string;
    author_role?: string;
}

interface ManagePayload {
    isAdmin: boolean;
    publishedPosts: PublishedPost[];
    pendingSubmissions: PendingSubmission[];
}

export function WikiManagePage() {
    const router = useRouter();
    const [data, setData] = useState<ManagePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [deletingKey, setDeletingKey] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/wiki/manage");
            const payload = await response.json();

            if (!response.ok || !payload.success) {
                setError(payload.error || "Không thể tải dữ liệu quản lý bài viết.");
                setData(null);
                return;
            }

            setData({
                isAdmin: payload.isAdmin,
                publishedPosts: payload.publishedPosts || [],
                pendingSubmissions: payload.pendingSubmissions || [],
            });
        } catch {
            setError("Không thể kết nối tới server.");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const flashNotice = sessionStorage.getItem("wiki_notice");
        if (!flashNotice) {
            return;
        }

        setNotice(flashNotice);
        sessionStorage.removeItem("wiki_notice");

        const timeoutId = window.setTimeout(() => {
            setNotice("");
        }, 3000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, []);

    const handleDeletePublished = async (slug: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài viết đã đăng này không?")) {
            return;
        }

        setDeletingKey(`post:${slug}`);
        setError("");

        try {
            const response = await fetch(`/api/wiki?slug=${slug}`, { method: "DELETE" });
            const payload = await response.json();

            if (!response.ok || !payload.success) {
                setError(payload.error || "Không thể xóa bài viết.");
                return;
            }

            await fetchData();
            router.refresh();
        } catch {
            setError("Không thể kết nối tới server.");
        } finally {
            setDeletingKey(null);
        }
    };

    const handleDeleteSubmission = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài viết đang chờ duyệt này không?")) {
            return;
        }

        setDeletingKey(`submission:${id}`);
        setError("");

        try {
            const response = await fetch(`/api/wiki/submissions/${id}`, { method: "DELETE" });
            const payload = await response.json();

            if (!response.ok || !payload.success) {
                setError(payload.error || "Không thể xóa bài viết đang duyệt.");
                return;
            }

            await fetchData();
            router.refresh();
        } catch {
            setError("Không thể kết nối tới server.");
        } finally {
            setDeletingKey(null);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    const publishedPosts = data?.publishedPosts || [];
    const pendingSubmissions = data?.pendingSubmissions || [];
    const isAdmin = data?.isAdmin || false;

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                    <Link href="/wiki" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại Wiki</span>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold text-white">Quản lý bài viết</h1>
                        <p className="mt-2 max-w-3xl text-white/60">
                            {isAdmin
                                ? "Tại đây bạn quản lý các bài Wiki đã đăng bằng tài khoản ADMIN của mình."
                                : "Tại đây bạn quản lý bài viết đang chờ duyệt và các bài đã được duyệt của tài khoản MEMBER."}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link href="/wiki/create">
                        <NeonButton type="button" variant="secondary" className="rounded-xl px-5 py-3 normal-case tracking-normal">
                            <PlusCircle size={18} />
                            {isAdmin ? "Đăng bài mới" : "Gửi bài mới"}
                        </NeonButton>
                    </Link>
                    <button
                        type="button"
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-accent-secondary/30 hover:bg-white/10"
                    >
                        <RefreshCcw size={16} />
                        Tải lại
                    </button>
                </div>
            </div>

            {error && (
                <GlassCard className="border-red-500/20 bg-red-500/10 text-red-200" hoverEffect={false}>
                    {error}
                </GlassCard>
            )}

            {notice && (
                <GlassCard className="border-emerald-400/20 bg-emerald-400/10 text-center text-emerald-100" hoverEffect={false}>
                    {notice}
                </GlassCard>
            )}

            {!isAdmin && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <FolderClock className="text-accent-primary" size={22} />
                        <h2 className="text-2xl font-bold text-white">Bài viết đang duyệt</h2>
                    </div>

                    {pendingSubmissions.length === 0 ? (
                        <EmptyState message="Bạn hiện không có bài viết nào đang chờ duyệt." />
                    ) : (
                        <div className="grid gap-5 lg:grid-cols-2">
                            {pendingSubmissions.map((submission) => (
                                <ManageCard
                                    key={`submission-${submission.id}`}
                                    title={submission.title}
                                    excerpt={submission.excerpt}
                                    category={submission.category}
                                    meta={`Gửi lúc ${new Date(submission.created_at).toLocaleString("vi-VN")}`}
                                    role={submission.author_role}
                                    actions={
                                        <>
                                            <Link
                                                href={`/wiki/submissions/${submission.id}/edit`}
                                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-accent-primary/30 hover:bg-white/10"
                                            >
                                                <Edit size={16} />
                                                Chỉnh sửa
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSubmission(submission.id)}
                                                disabled={deletingKey === `submission:${submission.id}`}
                                                className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                                            >
                                                <Trash2 size={16} />
                                                {deletingKey === `submission:${submission.id}` ? "Đang xóa..." : "Xóa"}
                                            </button>
                                        </>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <FolderOpen className="text-accent-secondary" size={22} />
                    <h2 className="text-2xl font-bold text-white">Bài viết đã duyệt</h2>
                </div>

                {publishedPosts.length === 0 ? (
                    <EmptyState message="Bạn hiện chưa có bài viết nào đã đăng trên Wiki." />
                ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {publishedPosts.map((post) => (
                            <ManageCard
                                key={`post-${post.slug}`}
                                title={post.title}
                                excerpt={post.excerpt}
                                category={post.category}
                                meta={`Đăng ngày ${post.date} • ${post.read_time}`}
                                role={post.author_role}
                                actions={
                                    <>
                                        <Link
                                            href={`/wiki/${post.slug}`}
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-accent-secondary/30 hover:bg-white/10"
                                        >
                                            <BookOpen size={16} />
                                            Xem bài viết
                                        </Link>
                                        <Link
                                            href={`/wiki/${post.slug}/edit`}
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-accent-primary/30 hover:bg-white/10"
                                        >
                                            <Edit size={16} />
                                            Chỉnh sửa
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePublished(post.slug)}
                                            disabled={deletingKey === `post:${post.slug}`}
                                            className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                                        >
                                            <Trash2 size={16} />
                                            {deletingKey === `post:${post.slug}` ? "Đang xóa..." : "Xóa"}
                                        </button>
                                    </>
                                }
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function ManageCard({
    title,
    excerpt,
    category,
    meta,
    role,
    actions,
}: {
    title: string;
    excerpt: string;
    category: string;
    meta: string;
    role?: string | null;
    actions: ReactNode;
}) {
    return (
        <GlassCard className="space-y-5 border-white/10" hoverEffect={false}>
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <AuthorRoleBadge role={role} />
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/65">
                        {category}
                    </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <p className="text-sm leading-7 text-white/65">{excerpt}</p>
            </div>

            <div className="inline-flex items-center gap-2 text-sm text-white/45">
                <Clock3 size={15} />
                {meta}
            </div>

            <div className="flex flex-wrap gap-3">
                {actions}
            </div>
        </GlassCard>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <GlassCard className="py-14 text-center text-white/50" hoverEffect={false}>
            {message}
        </GlassCard>
    );
}
