"use client";

import { useState } from "react";
import { MoveVertical, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LessonReorderView } from "./lesson-reorder-view";
import { toRoman } from "@/lib/utils";

interface Lesson {
    id: string;
    title: string;
    slug: string;
    order: number;
}

interface Chapter {
    id: string;
    title: string;
    lessons: Lesson[];
}

interface CourseManagerProps {
    course: {
        id: string;
        title: string;
        slug: string;
    };
    chapters: Chapter[];
    isAdmin: boolean;
}

export function CourseManager({ course, chapters, isAdmin }: CourseManagerProps) {
    const [isReordering, setIsReordering] = useState(false);

    if (isReordering) {
        return <LessonReorderView chapters={chapters} onClose={() => setIsReordering(false)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Nội dung khóa học</h2>
                {isAdmin && chapters.length > 0 && (
                    <button
                        onClick={() => setIsReordering(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 rounded-lg text-sm text-gray-300 hover:text-blue-400 transition-all font-bold"
                    >
                        <MoveVertical className="w-4 h-4" />
                        Sắp xếp bài học
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {chapters.map((chapter, chapterIndex) => (
                    <div
                        key={chapter.id}
                        className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                    >
                        {/* Chapter Header */}
                        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center justify-between group/chap">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                    <span className="text-sm font-bold">{toRoman(chapterIndex + 1)}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white group-hover/chap:text-blue-400 transition-colors">
                                    {chapter.title}
                                </h3>
                            </div>
                            {isAdmin && (
                                <Link
                                    href={`/learn/create?courseId=${course.id}&chapterId=${chapter.id}`}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-all border border-blue-500/20"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Thêm bài học
                                </Link>
                            )}
                        </div>

                        {/* Lessons */}
                        <div className="divide-y divide-white/5">
                            {chapter.lessons?.map((lesson, lessonIndex) => (
                                <Link
                                    key={lesson.id}
                                    href={`/learn/${course.slug}/${lesson.slug}`}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-medium">
                                            {lessonIndex + 1}
                                        </div>
                                        <span className="text-gray-300 group-hover:text-white transition-colors">
                                            Bài {lesson.order}: {lesson.title}
                                        </span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}

                            {(!chapter.lessons || chapter.lessons.length === 0) && (
                                <div className="px-6 py-4 text-gray-500 text-sm">
                                    Chương này chưa có bài học.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
