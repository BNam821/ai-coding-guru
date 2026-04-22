"use client";

import { useEffect, useRef, useState } from "react";
import { MoveVertical, Plus, ArrowRight, Pencil, Trash2, Check, X, Loader2, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

function buildQuizHref(params: { lessonIds: string[]; sourceLabel: string }) {
    const searchParams = new URLSearchParams({
        mode: "custom",
        lessonIds: params.lessonIds.join(","),
        sourceLabel: params.sourceLabel,
    });

    return `/test/exam?${searchParams.toString()}`;
}

function QuizShortcutButton({
    href,
    title,
}: {
    href: string;
    title: string;
}) {
    return (
        <Link
            href={href}
            className="group inline-flex h-9 items-center rounded-full border border-amber-300/20 bg-amber-300/8 px-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-100 transition-all duration-200 hover:border-amber-200/60 hover:bg-amber-300/18 hover:text-white hover:shadow-[0_0_24px_rgba(252,211,77,0.22)]"
            title={title}
        >
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="grid max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100">
                <span className="whitespace-nowrap pl-0 leading-[1.25] transition-all duration-200 group-hover:pl-1.5">
                    Tạo bài kiểm tra
                </span>
            </span>
        </Link>
    );
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
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-300 transition-all hover:border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-400"
                    >
                        <MoveVertical className="h-4 w-4" />
                        Sắp xếp bài học
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {chapters.map((chapter, chapterIndex) => (
                    <ChapterCard
                        key={chapter.id}
                        chapter={chapter}
                        chapterIndex={chapterIndex}
                        courseId={course.id}
                        courseSlug={course.slug}
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        </div>
    );
}

function ChapterCard({
    chapter,
    chapterIndex,
    courseId,
    courseSlug,
    isAdmin,
}: {
    chapter: Chapter;
    chapterIndex: number;
    courseId: string;
    courseSlug: string;
    isAdmin: boolean;
}) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(chapter.title);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chapterLessonIds = chapter.lessons?.map((lesson) => lesson.id) || [];
    const chapterQuizHref = buildQuizHref({
        lessonIds: chapterLessonIds,
        sourceLabel: `Chương ${toRoman(chapterIndex + 1)}: ${chapter.title}`,
    });

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleCancelEdit = () => {
        setTitle(chapter.title);
        setIsEditing(false);
    };

    const handleSaveTitle = async () => {
        const trimmed = title.trim();
        if (!trimmed || trimmed === chapter.title) {
            handleCancelEdit();
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/learn/chapter", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: chapter.id, title: trimmed }),
            });
            const data = await res.json();

            if (data.success) {
                setIsEditing(false);
                router.refresh();
                window.dispatchEvent(new CustomEvent("learn-structure-changed"));
            } else {
                alert(data.error || "Lỗi khi cập nhật chương");
            }
        } catch {
            alert("Đã có lỗi xảy ra");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xoá chương "${chapter.title}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch("/api/learn/chapter", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: chapter.id }),
            });
            const data = await res.json();

            if (data.success) {
                router.refresh();
                window.dispatchEvent(new CustomEvent("learn-structure-changed"));
            } else {
                alert(data.error || "Lỗi khi xoá chương");
            }
        } catch {
            alert("Đã có lỗi xảy ra");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <div className="group/chap flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent px-6 py-5">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                        <span className="text-sm font-bold">{toRoman(chapterIndex + 1)}</span>
                    </div>
                    {isEditing ? (
                        <div className="flex min-w-0 items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveTitle();
                                    if (e.key === "Escape") handleCancelEdit();
                                }}
                                onBlur={handleCancelEdit}
                                disabled={isSaving}
                                className="min-w-0 rounded-lg border border-blue-500/50 bg-white/10 px-3 py-2 text-sm font-bold text-white focus:border-blue-400 focus:outline-none"
                            />
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-400" />
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSaveTitle();
                                        }}
                                        className="rounded-md p-1 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                                        title="Lưu tên chương"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleCancelEdit();
                                        }}
                                        className="rounded-md p-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        title="Huỷ chỉnh sửa"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate text-lg font-bold text-white transition-colors group-hover/chap:text-blue-400">
                                {chapter.title}
                            </h3>
                            {isAdmin && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                                        title="Chỉnh sửa tên chương"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                                        title="Xoá chương"
                                    >
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <div className="flex shrink-0 items-center gap-2">
                        {chapterLessonIds.length > 0 && (
                            <QuizShortcutButton
                                href={chapterQuizHref}
                                title={`Tạo bài kiểm tra từ ${chapter.title}`}
                            />
                        )}
                        {isAdmin && (
                            <Link
                                href={`/learn/create?courseId=${courseId}&chapterId=${chapter.id}`}
                                className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Thêm bài học
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <div className="divide-y divide-white/5">
                {chapter.lessons?.map((lesson, lessonIndex) => {
                    const lessonQuizHref = buildQuizHref({
                        lessonIds: [lesson.id],
                        sourceLabel: `Bài ${lesson.order}: ${lesson.title}`,
                    });

                    return (
                        <div
                            key={lesson.id}
                            className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/5"
                        >
                            <Link
                                href={`/learn/${courseSlug}/${lesson.slug}`}
                                className="flex min-w-0 flex-1 items-center gap-3"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-medium text-blue-400">
                                    {lessonIndex + 1}
                                </div>
                                <span className="truncate text-gray-300 transition-colors group-hover:text-white">
                                    Bài {lesson.order}: {lesson.title}
                                </span>
                            </Link>

                            <div className="flex shrink-0 items-center gap-2">
                                <QuizShortcutButton
                                    href={lessonQuizHref}
                                    title={`Tạo bài kiểm tra từ bài ${lesson.title}`}
                                />
                                <Link
                                    href={`/learn/${courseSlug}/${lesson.slug}`}
                                    className="rounded-full p-1 text-gray-500 transition-all hover:text-blue-400"
                                    aria-label={`Mở bài ${lesson.title}`}
                                >
                                    <ArrowRight className="h-4 w-4 transition-all group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {(!chapter.lessons || chapter.lessons.length === 0) && (
                    <div className="px-6 py-4 text-sm text-gray-500">
                        Chương này chưa có bài học.
                    </div>
                )}
            </div>
        </div>
    );
}
