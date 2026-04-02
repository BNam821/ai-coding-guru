"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronDown, Clock, History } from "lucide-react";
import { AuthorRoleBadge } from "@/components/wiki/author-role-badge";
import type { WikiEditHistoryEntry } from "@/lib/wiki";
import { cn } from "@/lib/utils";

interface WikiArticleMetaProps {
    authorUsername: string;
    authorDisplayName?: string | null;
    authorAvatarUrl?: string | null;
    authorRole?: string | null;
    date: string;
    readTime: string;
    editHistory: WikiEditHistoryEntry[];
}

function formatEditedAt(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const time = new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);

    const day = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);

    return `${time}, ${day}`;
}

export function WikiArticleMeta({
    authorUsername,
    authorDisplayName,
    authorAvatarUrl,
    authorRole,
    date,
    readTime,
    editHistory,
}: WikiArticleMetaProps) {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const panelId = useId();
    const formattedHistory = useMemo(
        () => editHistory.map((entry) => ({
            ...entry,
            formattedEditedAt: formatEditedAt(entry.edited_at),
            displayEditor: entry.editor_display_name || entry.editor_username,
        })),
        [editHistory]
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 border-y border-white/10 py-6 text-sm text-white sm:gap-6">
                <Link href={`/profile/${authorUsername}`} className="flex min-w-0 items-center gap-2 hover:opacity-80 transition-opacity">
                    {authorAvatarUrl ? (
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={authorAvatarUrl}
                                alt={authorDisplayName || authorUsername}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-primary/20 font-bold text-accent-primary">
                            {(authorDisplayName?.[0] || authorUsername?.[0] || "A").toUpperCase()}
                        </div>
                    )}
                    <span className="min-w-0">
                        Tác giả:{" "}
                        <b className="text-white underline decoration-white/20 underline-offset-4 transition-colors hover:text-accent-secondary">
                            {authorDisplayName || authorUsername}
                        </b>
                    </span>
                </Link>

                <AuthorRoleBadge role={authorRole} />

                <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{date}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{readTime} đọc</span>
                </div>

                <button
                    type="button"
                    aria-expanded={isHistoryOpen}
                    aria-controls={panelId}
                    onClick={() => setIsHistoryOpen((value) => !value)}
                    className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#6cffc9]/60 bg-[#00ff9d]/12 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#8bffd7] shadow-[0_0_24px_rgba(0,255,157,0.18)] transition-all duration-300 hover:border-[#8bffd7]/90 hover:bg-[#00ff9d]/18 hover:text-[#c5ffea] hover:shadow-[0_0_32px_rgba(0,255,157,0.28)]"
                >
                    <History size={14} />
                    <span>Lịch sử chỉnh sửa</span>
                    <ChevronDown
                        size={14}
                        className={cn("transition-transform duration-300", isHistoryOpen && "rotate-180")}
                    />
                </button>
            </div>

            <div
                id={panelId}
                aria-hidden={!isHistoryOpen}
                className={cn(
                    "rounded-2xl border border-[#00ff9d]/20 bg-white/5 p-4 shadow-[0_0_30px_rgba(0,255,157,0.06)] backdrop-blur-md sm:p-5",
                    !isHistoryOpen && "hidden"
                )}
            >
                    {formattedHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] border-collapse border border-white/10 text-left">
                                <thead className="bg-[#00ff9d]/10">
                                    <tr className="border-b border-white/10">
                                        <th className="border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#bfffe6]">
                                            Thời gian
                                        </th>
                                        <th className="border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#bfffe6]">
                                            Người chỉnh sửa
                                        </th>
                                        <th className="border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#bfffe6]">
                                            Lí do chỉnh sửa
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {formattedHistory.map((entry) => (
                                        <tr key={`${entry.edited_at}-${entry.editor_username}-${entry.edit_reason}`} className="border-b border-white/10">
                                            <td className="border border-white/10 px-4 py-3 align-top text-sm text-white/90">
                                                {entry.formattedEditedAt}
                                            </td>
                                            <td className="border border-white/10 px-4 py-3 align-top text-sm font-semibold text-white">
                                                {entry.displayEditor}
                                            </td>
                                            <td className="border border-white/10 px-4 py-3 align-top text-sm text-white/85">
                                                {entry.edit_reason}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-white/70">
                            Chưa có lịch sử chỉnh sửa.
                        </p>
                    )}
            </div>
        </div>
    );
}
