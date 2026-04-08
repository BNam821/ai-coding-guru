"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Sparkles } from "lucide-react";
import type { DashboardCourseCard } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "in_progress", label: "Đang học" },
    { key: "completed", label: "Hoàn thành" },
    { key: "suggested", label: "Gợi ý" },
] as const;

type DashboardTab = typeof tabs[number]["key"];

function getStatusLabel(status: DashboardCourseCard["status"]) {
    if (status === "completed") return "Hoàn thành";
    if (status === "in_progress") return "Đang học";
    return "Gợi ý";
}

export function DashboardCoursesPanel({ courses }: { courses: DashboardCourseCard[] }) {
    const [activeTab, setActiveTab] = useState<DashboardTab>("all");

    const filteredCourses = useMemo(() => {
        if (activeTab === "all") {
            return courses;
        }

        if (activeTab === "suggested") {
            return courses.filter((course) => course.status === "not_started");
        }

        return courses.filter((course) => course.status === activeTab);
    }, [activeTab, courses]);

    return (
        <section className="rounded-[2rem] border border-[#0f1116] bg-[#f4f1e8] p-4 text-[#151720] shadow-[0_24px_60px_rgba(0,0,0,0.22)] lg:p-5">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Khóa học của tôi</h2>
                <div className="flex flex-wrap gap-2 rounded-full bg-[#151720] p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                                activeTab === tab.key ? "bg-[#f4e588] text-[#151720]" : "text-white/85 hover:text-white"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="rounded-[1.5rem] border border-[#151720]/10 bg-white/70 px-6 py-10 text-center">
                    <Sparkles className="mx-auto mb-4 h-8 w-8 text-[#6f5bd6]" />
                    <p className="text-lg font-medium">Chưa có khóa học phù hợp bộ lọc này</p>
                    <p className="mt-2 text-sm text-[#151720]/65">Hãy chuyển tab hoặc bắt đầu thêm bài học để dashboard cập nhật tiến độ.</p>
                </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {filteredCourses.map((course) => (
                        <article key={course.id} className="overflow-hidden rounded-[1.5rem] border border-[#151720]/10 bg-[#242424] text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                            <div className="relative h-48 bg-[#d9d7d0]">
                                {course.imageUrl ? (
                                    <Image src={course.imageUrl} alt={course.title} fill className="object-cover" />
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,229,136,0.4),_transparent_45%),linear-gradient(135deg,#efe7cf,#d6d1c7)]" />
                                )}

                                <div className="absolute left-4 top-4 inline-flex items-center rounded-full bg-black/55 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
                                    {getStatusLabel(course.status)}
                                </div>
                            </div>

                            <div className="space-y-5 p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-white"
                                            style={{ width: `${Math.max(course.progress, course.progress === 0 ? 8 : 0)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-white/80">{course.progress}%</span>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-semibold leading-tight">{course.title}</h3>
                                    <p className="mt-2 line-clamp-2 text-sm text-white/65">
                                        {course.description || "Khóa học đang sẵn sàng để bạn bắt đầu với lộ trình bài học có cấu trúc."}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-white/70">
                                    <span className="inline-flex items-center gap-2">
                                        <Layers3 className="h-4 w-4" />
                                        {course.chapterCount} chương
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        {course.completedLessons}/{course.lessonCount} bài
                                    </span>
                                </div>

                                <Link
                                    href={course.nextLessonHref || `/learn/${course.slug}`}
                                    className="group inline-flex items-center gap-2 text-sm font-medium text-[#f4e588] transition-colors hover:text-white"
                                >
                                    {course.nextLessonTitle ? `Học tiếp: ${course.nextLessonTitle}` : "Xem khóa học"}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
