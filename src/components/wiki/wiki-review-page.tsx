"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, ExternalLink, RefreshCcw, ShieldCheck, Tag, User, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AuthorRoleBadge } from "@/components/wiki/author-role-badge";

type SubmissionStatus = "pending" | "rejected";

interface WikiSubmission {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    author_role?: string;
    category: string;
    image_url?: string | null;
    read_time: string;
    status: SubmissionStatus;
    review_notes?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    created_at: string;
    author_details?: {
        display_name?: string | null;
        avatar_url?: string | null;
    };
}

const FILTERS: Array<{ label: string; value: SubmissionStatus | "all" }> = [
    { label: "Chờ duyệt", value: "pending" },
    { label: "Đã từ chối", value: "rejected" },
    { label: "Tất cả", value: "all" },
];

export function WikiReviewPage({ dashboardUrl }: { dashboardUrl: string | null }) {
    const [submissions, setSubmissions] = useState<WikiSubmission[]>([]);
    const [filter, setFilter] = useState<SubmissionStatus | "all">("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

    const fetchSubmissions = async (nextFilter = filter) => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/wiki/submissions?status=${nextFilter}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || "Không thể tải danh sách bài chờ duyệt.");
                setSubmissions([]);
                return;
            }

            setSubmissions(data.submissions || []);
            setReviewNotes((current) => {
                const next = { ...current };
                for (const submission of data.submissions || []) {
                    if (!(submission.id in next)) {
                        next[submission.id] = submission.review_notes || "";
                    }
                }
                return next;
            });
        } catch {
            setError("Không thể kết nối tới server.");
            setSubmissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions(filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const summary = useMemo(() => {
        return {
            pending: submissions.filter((item) => item.status === "pending").length,
            rejected: submissions.filter((item) => item.status === "rejected").length,
        };
    }, [submissions]);

    const handleReview = async (id: number, action: "approve" | "reject") => {
        setProcessingId(id);
        setError("");

        try {
            const response = await fetch("/api/wiki/submissions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    action,
                    review_notes: reviewNotes[id] || "",
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(data.error || "Không thể xử lý bài viết.");
                return;
            }

            await fetchSubmissions(filter);
        } catch {
            setError("Không thể kết nối tới server.");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-3">
                    <Link href="/wiki" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại Wiki</span>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-4xl font-bold text-white">Duyệt bài Wiki</h1>
                        <span className="inline-flex items-center gap-2 rounded-full border border-accent-secondary/20 bg-accent-secondary/10 px-3 py-1 text-xs font-semibold text-accent-secondary">
                            <ShieldCheck size={14} />
                            Admin only
                        </span>
                    </div>
                    <p className="max-w-3xl text-white/60">
                        Bài do MEMBER gửi sẽ nằm trong bảng <code>wiki_submissions</code> khi đang chờ duyệt. Sau khi Admin duyệt và đăng bài, bản ghi chờ duyệt sẽ được xóa tự động để giảm dữ liệu tồn đọng.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {dashboardUrl && (
                        <Link
                            href={dashboardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-accent-primary/30 hover:bg-white/10"
                        >
                            <ExternalLink size={16} />
                            Mở Supabase
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={() => fetchSubmissions(filter)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-accent-secondary/30 hover:bg-white/10"
                    >
                        <RefreshCcw size={16} />
                        Tải lại
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <SummaryCard label="Đang chờ duyệt" value={summary.pending} tone="pending" />
                <SummaryCard label="Đã từ chối trong bộ lọc" value={summary.rejected} tone="rejected" />
            </div>

            <div className="flex flex-wrap gap-3">
                {FILTERS.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => setFilter(item.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${filter === item.value
                            ? "border-accent-secondary bg-accent-secondary text-black"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-accent-secondary/30 hover:text-white"
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {error && (
                <GlassCard className="border-red-500/20 bg-red-500/10 text-red-200" hoverEffect={false}>
                    {error}
                </GlassCard>
            )}

            {submissions.length === 0 ? (
                <GlassCard className="py-16 text-center text-white/50" hoverEffect={false}>
                    Không có bài viết nào trong bộ lọc hiện tại.
                </GlassCard>
            ) : (
                <div className="space-y-6">
                    {submissions.map((submission) => {
                        const displayName = submission.author_details?.display_name || submission.author;
                        const isPending = submission.status === "pending";

                        return (
                            <GlassCard key={submission.id} className="space-y-6 border-white/10 p-8" hoverEffect={false}>
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <StatusBadge status={submission.status} />
                                            <AuthorRoleBadge role={submission.author_role} />
                                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                                                <Tag size={12} />
                                                {submission.category}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">{submission.title}</h2>
                                        <p className="max-w-4xl text-sm leading-7 text-white/70">{submission.excerpt}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 text-sm text-white/60 md:grid-cols-3">
                                    <div className="inline-flex items-center gap-2">
                                        <User size={15} />
                                        {displayName} ({submission.author})
                                    </div>
                                    <div className="inline-flex items-center gap-2">
                                        <Clock3 size={15} />
                                        {new Date(submission.created_at).toLocaleString("vi-VN")}
                                    </div>
                                    <div className="inline-flex items-center gap-2">
                                        <Tag size={15} />
                                        Slug: {submission.slug}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Nội dung xem trước</p>
                                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-7 text-white/80">
                                        {submission.content}
                                    </pre>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                                        Ghi chú duyệt bài
                                    </label>
                                    <textarea
                                        value={reviewNotes[submission.id] || ""}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setReviewNotes((current) => ({ ...current, [submission.id]: value }));
                                        }}
                                        placeholder="Ghi chú nội bộ hoặc phản hồi cho bài viết này..."
                                        className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent-secondary/40"
                                        disabled={!isPending}
                                    />
                                </div>

                                {isPending ? (
                                    <div className="flex flex-wrap gap-3">
                                        <NeonButton
                                            type="button"
                                            variant="primary"
                                            className="rounded-xl px-5 py-3 normal-case tracking-normal"
                                            disabled={processingId === submission.id}
                                            onClick={() => handleReview(submission.id, "approve")}
                                        >
                                            <Check size={18} />
                                            {processingId === submission.id ? "Đang duyệt..." : "Duyệt và đăng"}
                                        </NeonButton>
                                        <NeonButton
                                            type="button"
                                            variant="outline"
                                            className="rounded-xl border-red-400/40 px-5 py-3 normal-case tracking-normal text-red-300 hover:border-red-400 hover:bg-red-400 hover:text-black"
                                            disabled={processingId === submission.id}
                                            onClick={() => handleReview(submission.id, "reject")}
                                        >
                                            <X size={18} />
                                            Từ chối
                                        </NeonButton>
                                    </div>
                                ) : (
                                    <div className="text-sm text-white/45">
                                        {submission.reviewed_by
                                            ? `Đã xử lý bởi ${submission.reviewed_by}${submission.reviewed_at ? ` lúc ${new Date(submission.reviewed_at).toLocaleString("vi-VN")}` : ""}.`
                                            : "Submission này đã được xử lý."}
                                    </div>
                                )}
                            </GlassCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "pending" | "rejected";
}) {
    const toneClassName = {
        pending: "text-amber-300 border-amber-400/20 bg-amber-400/10",
        rejected: "text-red-300 border-red-400/20 bg-red-400/10",
    }[tone];

    return (
        <GlassCard className={`border ${toneClassName}`} hoverEffect={false}>
            <p className="text-sm text-white/60">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </GlassCard>
    );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
    const config = {
        pending: {
            label: "Chờ duyệt",
            className: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        },
        rejected: {
            label: "Đã từ chối",
            className: "border-red-400/20 bg-red-400/10 text-red-300",
        },
    }[status];

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${config.className}`}>
            {config.label}
        </span>
    );
}
