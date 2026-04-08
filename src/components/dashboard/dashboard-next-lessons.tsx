import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import type { DashboardNextLesson } from "@/lib/dashboard";

export function DashboardNextLessons({ lessons }: { lessons: DashboardNextLesson[] }) {
    return (
        <section className="rounded-[2rem] border border-white/10 bg-[#1d2027] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] lg:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">Bài học tiếp theo</h2>
                    <p className="mt-2 text-sm text-white/45">Ưu tiên các khóa bạn đang học trước, sau đó đến các khóa nên bắt đầu.</p>
                </div>
                <Link href="/learn" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
                    Xem tất cả
                </Link>
            </div>

            {lessons.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-[#17191f] px-5 py-8 text-center">
                    <Sparkles className="mx-auto mb-4 h-8 w-8 text-[#f4e588]" />
                    <p className="text-base font-medium text-white">Chưa có gợi ý học tiếp</p>
                    <p className="mt-2 text-sm text-white/45">Hãy bắt đầu một bài học trong trung tâm học tập để dashboard đề xuất lộ trình tiếp theo.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {lessons.map((lesson) => (
                        <Link
                            key={`${lesson.courseSlug}:${lesson.lessonSlug}`}
                            href={lesson.href}
                            className="group flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/8 bg-[#17191f] px-4 py-4 transition-colors hover:border-white/14 hover:bg-white/[0.04]"
                        >
                            <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4e588] text-[#17191f]">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.24em] text-white/35">{lesson.statusLabel}</p>
                                    <p className="mt-1 truncate text-lg font-medium text-white">{lesson.lessonTitle}</p>
                                    <p className="mt-1 truncate text-sm text-white/45">{lesson.courseTitle} • {lesson.progressLabel}</p>
                                </div>
                            </div>

                            <ArrowRight className="h-5 w-5 shrink-0 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
