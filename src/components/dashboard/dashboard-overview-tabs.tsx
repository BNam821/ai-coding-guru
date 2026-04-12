"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ChevronRight, FileText, Layers3 } from "lucide-react";
import type { NextLearningLesson, RecentLearningLesson } from "@/lib/user-progress";
import { cn } from "@/lib/utils";

export type DashboardTabKey = "overview" | "learning" | "articles";

type DashboardOverviewTabsProps = {
    lessonCount: number;
    recentLessons: RecentLearningLesson[];
    nextLesson: NextLearningLesson | null;
    overviewContent: ReactNode;
    articlesContent: ReactNode;
    initialTab?: DashboardTabKey;
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
    overviewContent,
    articlesContent,
    initialTab = "overview",
}: DashboardOverviewTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<DashboardTabKey>(initialTab);
    const latestLesson = recentLessons[0] || null;
    const displayedRecentLessons = recentLessons.slice(0, 3);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const setTab = (tab: DashboardTabKey) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());

        if (tab === "overview") {
            params.delete("tab");
        } else {
            params.set("tab", tab);
        }

        const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(nextUrl, { scroll: false });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setTab("overview")}
                    aria-pressed={activeTab === "overview"}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                        activeTab === "overview"
                            ? "border border-white/10 bg-white/[0.04] text-white"
                            : "text-white/46 hover:bg-white/[0.04] hover:text-white/80",
                    )}
                >
                    <Layers3 className="h-4 w-4" />
                    Tổng quan
                </button>

                <button
                    type="button"
                    aria-pressed={activeTab === "learning"}
                    onClick={() => setTab("learning")}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                        activeTab === "learning"
                            ? "border border-[#90defa]/25 bg-[#90defa]/10 text-white"
                            : "text-white/46 hover:bg-white/[0.04] hover:text-white/80",
                    )}
                >
                    <BookOpen className="h-4 w-4" />
                    Học tập
                </button>

                <button
                    type="button"
                    aria-pressed={activeTab === "articles"}
                    onClick={() => setTab("articles")}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                        activeTab === "articles"
                            ? "border border-white/10 bg-white/[0.04] text-white"
                            : "text-white/46 hover:bg-white/[0.04] hover:text-white/80",
                    )}
                >
                    <FileText className="h-4 w-4" />
                    Bài viết
                </button>
            </div>

            {activeTab === "overview" ? overviewContent : null}

            {activeTab === "learning" ? (
                <section className="grid gap-4 rounded-[1.6rem] border border-white/20 bg-[#111214] p-5 lg:grid-cols-[0.9fr_1.2fr_1fr]">
                    <div className="rounded-[1.35rem] border border-white/20 bg-white/[0.03] p-5">
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

                    <div className="rounded-[1.35rem] border border-white/20 bg-white/[0.03] p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-white">3 bài học gần nhất</h3>
                                <p className="mt-1 text-sm text-white/46">Lấy trực tiếp từ lịch sử học trong hệ thống.</p>
                            </div>
                            <Link
                                href="/history"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                            >
                                Xem tất cả
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="mt-5 space-y-3">
                            {displayedRecentLessons.length > 0 ? displayedRecentLessons.map((lesson, index) => (
                                <Link
                                    key={lesson.lessonId}
                                    href={`/learn/${lesson.courseSlug}/${lesson.lessonSlug}`}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/16 bg-[#0f0f10] px-4 py-3 transition-colors hover:bg-white/[0.05]"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs uppercase tracking-[0.22em] text-white/28">#{index + 1}</p>
                                        <p className="mt-1 truncate text-sm font-medium text-white">{lesson.lessonTitle}</p>
                                        <p className="mt-1 text-xs text-white/38">{formatLessonTimestamp(lesson.updatedAt)}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-white/24" />
                                </Link>
                            )) : (
                                <div className="rounded-2xl border border-dashed border-white/20 bg-[#0f0f10] px-4 py-5 text-sm text-white/46">
                                    Chưa có lịch sử học. Hãy mở một bài trong <code>/learn</code> để hệ thống bắt đầu theo dõi.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[1.35rem] border border-white/20 bg-white/[0.03] p-5">
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
                            <div className="mt-5 rounded-[1.25rem] border border-white/20 bg-[#90defa]/[0.06] p-4">
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
                            <div className="mt-5 rounded-[1.25rem] border border-white/20 bg-[#0f0f10] p-4">
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
            ) : null}

            {activeTab === "articles" ? articlesContent : null}
        </div>
    );
}
