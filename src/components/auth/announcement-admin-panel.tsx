"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, LoaderCircle, Plus, Save, Trash2, X } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { GlassCard } from "@/components/ui/glass-card";
import {
    ANNOUNCEMENT_LIMIT,
    ANNOUNCEMENT_MAX_LENGTH,
    type SiteAnnouncement,
} from "@/lib/announcements";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
});

function formatAnnouncementTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Vừa cập nhật" : dateFormatter.format(date);
}

function notifyAnnouncementsChanged() {
    window.dispatchEvent(new Event("announcements:changed"));
}

export function AnnouncementAdminPanel() {
    const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
    const [draftMessage, setDraftMessage] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingMessage, setEditingMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canCreate = announcements.length < ANNOUNCEMENT_LIMIT;
    const remainingCharacters = useMemo(
        () => ANNOUNCEMENT_MAX_LENGTH - draftMessage.length,
        [draftMessage.length]
    );

    const loadAnnouncements = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/announcements", { cache: "no-store" });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Không thể tải thông báo");
            }

            setAnnouncements(data.announcements || []);
            setError(null);
        } catch (loadError) {
            setAnnouncements([]);
            setError(loadError instanceof Error ? loadError.message : "Không thể tải thông báo");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadAnnouncements();
    }, []);

    const resetFeedback = () => {
        setFeedback(null);
        setError(null);
    };

    const handleCreate = async () => {
        resetFeedback();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/announcements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: draftMessage }),
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Không thể tạo thông báo");
            }

            setDraftMessage("");
            setFeedback("Đã thêm thông báo mới.");
            await loadAnnouncements();
            notifyAnnouncementsChanged();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể tạo thông báo");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        resetFeedback();

        if (!confirm("Bạn có chắc chắn muốn xóa thông báo này không?")) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/announcements/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Không thể xóa thông báo");
            }

            if (editingId === id) {
                setEditingId(null);
                setEditingMessage("");
            }

            setFeedback("Đã xóa thông báo.");
            await loadAnnouncements();
            notifyAnnouncementsChanged();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa thông báo");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async (id: number) => {
        resetFeedback();
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/announcements/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: editingMessage }),
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Không thể cập nhật thông báo");
            }

            setEditingId(null);
            setEditingMessage("");
            setFeedback("Đã cập nhật thông báo.");
            await loadAnnouncements();
            notifyAnnouncementsChanged();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Không thể cập nhật thông báo");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <GlassCard className="mt-8 border-white/10 p-8" hoverEffect={false}>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white">Quản lý thông báo website</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                        Widget thông báo nổi ở góc phải dưới sẽ hiển thị 2 thông báo mới nhất. Chỉ tài khoản ADMIN mới có quyền thêm, sửa hoặc xóa tại đây.
                    </p>
                </div>
                <div className="rounded-full border border-accent-secondary/25 bg-accent-secondary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-secondary">
                    {announcements.length}/{ANNOUNCEMENT_LIMIT} thông báo
                </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
                <label htmlFor="announcement-message" className="mb-3 block text-sm font-medium text-white/80">
                    Thông báo mới
                </label>
                <textarea
                    id="announcement-message"
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    rows={4}
                    maxLength={ANNOUNCEMENT_MAX_LENGTH}
                    placeholder="Nhập nội dung thông báo mà bạn muốn hiển thị cho người dùng..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-accent-secondary/40"
                    disabled={!canCreate || isSubmitting}
                />
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-white/45">
                        Tối đa {ANNOUNCEMENT_MAX_LENGTH} ký tự. Còn lại {remainingCharacters} ký tự.
                    </p>
                    <button
                        type="button"
                        onClick={() => void handleCreate()}
                        disabled={!canCreate || isSubmitting || !draftMessage.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-secondary px-5 py-2.5 text-sm font-semibold text-deep-space transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Thêm thông báo
                    </button>
                </div>
                {!canCreate && (
                    <p className="mt-3 text-sm text-amber-300">
                        Bạn đã đạt giới hạn 2 thông báo. Hãy xóa bớt hoặc sửa thông báo hiện có trước khi thêm mới.
                    </p>
                )}
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                        Xem trước Markdown
                    </p>
                    {draftMessage.trim() ? (
                        <div className="prose prose-invert prose-sm max-w-none text-white/85">
                            <MarkdownRenderer
                                content={draftMessage}
                                mode="safe"
                                preserveWikiTips
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-white/40">
                            Nhập nội dung để xem trước markdown như ở trang wiki.
                        </p>
                    )}
                </div>
            </div>

            {(feedback || error) && (
                <div
                    className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                        error
                            ? "border border-red-500/25 bg-red-500/10 text-red-200"
                            : "border border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                    }`}
                >
                    {error || feedback}
                </div>
            )}

            <div className="mt-8 space-y-4">
                {isLoading ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/60">
                        Đang tải danh sách thông báo...
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/50">
                        Chưa có thông báo nào được tạo.
                    </div>
                ) : (
                    announcements.map((announcement, index) => {
                        const isEditing = editingId === announcement.id;

                        return (
                            <div
                                key={announcement.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                            >
                                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Thông báo {index + 1}
                                        </p>
                                        <p className="mt-1 text-xs text-white/40">
                                            Cập nhật lần cuối: {formatAnnouncementTime(announcement.updated_at)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSave(announcement.id)}
                                                    disabled={isSubmitting || !editingMessage.trim()}
                                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    Lưu
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditingMessage("");
                                                        resetFeedback();
                                                    }}
                                                    disabled={isSubmitting}
                                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Hủy
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(announcement.id);
                                                    setEditingMessage(announcement.message);
                                                    resetFeedback();
                                                }}
                                                disabled={isSubmitting}
                                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                                Sửa
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => void handleDelete(announcement.id)}
                                            disabled={isSubmitting}
                                            className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Xóa
                                        </button>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <>
                                        <textarea
                                            value={editingMessage}
                                            onChange={(event) => setEditingMessage(event.target.value)}
                                            rows={4}
                                            maxLength={ANNOUNCEMENT_MAX_LENGTH}
                                            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-accent-secondary/40"
                                        />
                                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                                                Xem trước Markdown
                                            </p>
                                            {editingMessage.trim() ? (
                                                <div className="prose prose-invert prose-sm max-w-none text-white/85">
                                                    <MarkdownRenderer
                                                        content={editingMessage}
                                                        mode="safe"
                                                        preserveWikiTips
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-white/40">
                                                    Nội dung trống.
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="prose prose-invert prose-sm mt-4 max-w-none text-white/80">
                                        <MarkdownRenderer
                                            content={announcement.message}
                                            mode="safe"
                                            preserveWikiTips
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </GlassCard>
    );
}
