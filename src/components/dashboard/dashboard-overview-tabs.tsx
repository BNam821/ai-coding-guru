"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Brain, ChevronRight, FileText, Layers3, Sparkles, TriangleAlert } from "lucide-react";
import type { DashboardAiEvaluation } from "@/lib/dashboard-ai-evaluation";
import type { NextLearningLesson, RecentLearningLesson } from "@/lib/user-progress";
import { cn } from "@/lib/utils";

export type DashboardTabKey = "overview" | "learning" | "articles";

type DashboardOverviewTabsProps = {
    lessonCount: number;
    recentLessons: RecentLearningLesson[];
    nextLesson: NextLearningLesson | null;
    aiEvaluation: DashboardAiEvaluation;
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
    aiEvaluation,
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
                <section className="space-y-4 rounded-[1.6rem] border border-white/28 bg-[linear-gradient(180deg,rgba(18,20,23,0.98),rgba(13,14,16,0.98))] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.3)]">
                    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
                        <div className="relative overflow-hidden rounded-[1.35rem] border border-[#90defa]/28 bg-[radial-gradient(circle_at_top_left,rgba(144,222,250,0.18),transparent_42%),linear-gradient(180deg,rgba(15,17,19,0.98),rgba(12,13,15,0.98))] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#90defa]/75 to-transparent" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#90defa]/20 bg-[#90defa]/10 px-3 py-1 text-xs font-medium text-[#c9f3ff]">
                                        <Brain className="h-3.5 w-3.5" />
                                        Đánh giá từ AI
                                    </div>
                                    <h3 className="mt-4 text-xl font-semibold text-white">Phân tích từ lịch sử làm bài trắc nghiệm</h3>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
                                        AI đọc các lần làm quiz gần đây để tóm tắt điểm mạnh, điểm yếu và gợi ý lại bài học phù hợp cho bạn.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right text-xs text-white/54">
                                    <p>{aiEvaluation.attemptCount} lượt quiz</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{aiEvaluation.averageScore}/100</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {aiEvaluation.bullets.map((bullet, index) => (
                                    <div
                                        key={`${index}-${bullet}`}
                                        className="rounded-2xl border border-white/12 bg-white/[0.035] px-4 py-4 text-sm leading-6 text-white/78"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#90defa]" />
                                            <p>{bullet}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 rounded-[1.25rem] border border-white/14 bg-[#0f1113] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/74">Biểu đồ AI</h4>
                                        <p className="mt-1 text-xs leading-5 text-white/42">
                                            Xem trang biểu đồ riêng để theo dõi số câu sai theo bài học và theo chương.
                                        </p>
                                    </div>
                                    <Link
                                        href="/dashboard/charts"
                                        className="inline-flex items-center gap-2 rounded-xl border border-[#90defa]/22 bg-[#90defa]/10 px-4 py-2 text-sm font-medium text-[#d9f7ff] transition-colors hover:bg-[#90defa]/16"
                                    >
                                        Hiển thị biểu đồ
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>

                            {!aiEvaluation.hasData ? (
                                <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                                    <TriangleAlert className="h-3.5 w-3.5" />
                                    Cần thêm dữ liệu quiz để AI phân tích chính xác hơn.
                                </div>
                            ) : null}
                        </div>

                        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/28 bg-[linear-gradient(180deg,rgba(28,30,34,0.98),rgba(17,18,21,0.98))] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffe08a]/60 to-transparent" />
                            <div className="flex items-center gap-2 text-[#90defa]">
                                <Sparkles className="h-4 w-4" />
                                <p className="text-xs uppercase tracking-[0.28em] text-[#90defa]/72">Gợi ý ôn lại</p>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-white">Bài học nên ưu tiên</h3>
                            <p className="mt-2 text-sm leading-6 text-white/46">
                                Những bài dưới đây được chọn theo nhóm nội dung mà AI nhận thấy bạn còn cần củng cố thêm.
                            </p>

                            <div className="mt-5 space-y-3">
                                {aiEvaluation.recommendedLessons.length > 0 ? aiEvaluation.recommendedLessons.map((lesson) => (
                                    <Link
                                        key={lesson.sourceKey}
                                        href={`/learn/${lesson.courseSlug}/${lesson.lessonSlug}`}
                                        className="block rounded-2xl border border-white/16 bg-[#0f0f10] px-4 py-4 transition-colors hover:bg-white/[0.05]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-white">{lesson.lessonTitle}</p>
                                                <p className="mt-2 text-xs leading-5 text-white/42">{lesson.reason}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-white/24" />
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="rounded-2xl border border-dashed border-white/20 bg-[#0f0f10] px-4 py-5 text-sm leading-6 text-white/46">
                                        Chưa có đủ tín hiệu để đề xuất bài học cụ thể. Hãy tiếp tục làm thêm quiz để AI xác định lộ trình ôn tập sát hơn.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr_1fr]">
                        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/28 bg-[linear-gradient(180deg,rgba(28,30,34,0.98),rgba(17,18,21,0.98))] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#90defa]/55 to-transparent" />
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

                        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/28 bg-[linear-gradient(180deg,rgba(28,30,34,0.98),rgba(17,18,21,0.98))] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
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

                        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/28 bg-[linear-gradient(180deg,rgba(28,30,34,0.98),rgba(17,18,21,0.98))] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8af0ff]/55 to-transparent" />
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
                    </div>
                </section>
            ) : null}

            {activeTab === "articles" ? articlesContent : null}
        </div>
    );
}
