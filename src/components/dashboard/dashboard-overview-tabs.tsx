"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { BookOpen, ChevronRight, FileText, Layers3 } from "lucide-react";
import type { NextLearningLesson, RecentLearningLesson } from "@/lib/user-progress";
import { cn } from "@/lib/utils";

type DashboardOverviewTabsProps = {
    lessonCount: number;
    recentLessons: RecentLearningLesson[];
    nextLesson: NextLearningLesson | null;
};

function formatLessonTimestamp(value: string | null) {
    if (!value) return "Vừa cập nhật";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Vừa cập nhật";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function DashboardOverviewTabs({
    lessonCount,
    recentLessons,
    nextLesson,
}: DashboardOverviewTabsProps) {
    const [isLearningOpen, setIsLearningOpen] = useState(false);
    const panelId = useId();
    const latestLesson = recentLessons[0] || null;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors"
                >
                    <Layers3 className="h-4 w-4" />
                    Tổng quan
                </Link>

                <button
                    type="button"
                    aria-controls={panelId}
                    aria-expanded={isLearningOpen}
                    onClick={() => setIsLearningOpen((value) => !value)}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                        isLearningOpen
                            ? "border border-[#90defa]/25 bg-[#90defa]/10 text-white"
                            : "text-white/46 hover:bg-white/[0.04] hover:text-white/80",
                    )}
                >
                    <BookOpen className="h-4 w-4" />
                    Học tập
                </button>

                <Link
                    href="/wiki/manage"
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/46 transition-colors hover:bg-white/[0.04] hover:text-white/80"
                >
                    <FileText className="h-4 w-4" />
                    Bài viết
                </Link>
            </div>

            <div
                id={panelId}
                className={cn(
                    "overflow-hidden transition-all duration-300",
                    isLearningOpen ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0",
                )}
            >
                <section className="grid gap-4 rounded-[1.6rem] border border-[#90defa]/12 bg-[#111214] p-5 lg:grid-cols-[0.9fr_1.2fr_1fr]">
                    <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
                        <p className="text-xs uppercase tracking-[0.28em] text-[#90defa]/72">Learning</p>
                        <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{lessonCount}</p>
                        <p className="mt-2 text-sm leading-6 text-white/48">
                            Bài học duy nhất đã mở trong <code>/learn</code>.
                        </p>
                        <Link
                            href="/learn"
                            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#8fe1ff] transition-opacity hover:opacity-80"
                        >
                            Mở trung tâm học tập
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-white">5 bài học gần nhất</h3>
                                <p className="mt-1 text-sm text-white/46">Lấy trực tiếp từ lịch sử học trong hệ thống.</p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {recentLessons.length > 0 ? recentLessons.map((lesson, index) => (
                                <Link
                                    key={lesson.lessonId}
                                    href={`/learn/${lesson.courseSlug}/${lesson.lessonSlug}`}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#0f0f10] px-4 py-3 transition-colors hover:bg-white/[0.05]"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs uppercase tracking-[0.22em] text-white/28">#{index + 1}</p>
                                        <p className="mt-1 truncate text-sm font-medium text-white">{lesson.lessonTitle}</p>
                                        <p className="mt-1 text-xs text-white/38">{formatLessonTimestamp(lesson.updatedAt)}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-white/24" />
                                </Link>
                            )) : (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-[#0f0f10] px-4 py-5 text-sm text-white/46">
                                    Chưa có lịch sử học. Hãy mở một bài trong <code>/learn</code> để hệ thống bắt đầu theo dõi.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
                        <h3 className="text-base font-semibold text-white">Đề xuất tiếp theo</h3>
                        {latestLesson ? (
                            <p className="mt-2 text-sm leading-6 text-white/46">
                                Dựa trên bài gần nhất là <span className="text-white/74">{latestLesson.lessonTitle}</span>.
                            </p>
                        ) : (
                            <p className="mt-2 text-sm leading-6 text-white/46">
                                Chưa có dữ liệu bài gần nhất để đề xuất lộ trình tiếp theo.
                            </p>
                        )}

                        {nextLesson ? (
                            <div className="mt-5 rounded-[1.25rem] border border-[#90defa]/15 bg-[#90defa]/[0.06] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[#90defa]/72">{nextLesson.courseTitle}</p>
                                <p className="mt-2 text-lg font-semibold text-white">{nextLesson.lessonTitle}</p>
                                <p className="mt-2 text-sm leading-6 text-white/48">
                                    Đây là bài tiếp theo ngay sau lesson gần nhất của bạn trong course hiện tại.
                                </p>
                                <Link
                                    href={`/learn/${nextLesson.courseSlug}/${nextLesson.lessonSlug}`}
                                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#90defa] px-4 py-3 text-sm font-medium text-slate-950 transition-transform hover:-translate-y-0.5"
                                >
                                    Học bài tiếp theo
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-[#0f0f10] p-4">
                                <p className="text-sm leading-6 text-white/48">
                                    Không tìm thấy bài kế tiếp trong course gần nhất. Bạn có thể quay lại <code>/learn</code> để chọn course khác hoặc xem lại bài hiện tại.
                                </p>
                                <Link
                                    href={latestLesson ? `/learn/${latestLesson.courseSlug}` : "/learn"}
                                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#8fe1ff] transition-opacity hover:opacity-80"
                                >
                                    Đi tới học tập
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
