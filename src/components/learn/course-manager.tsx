"use client";

import { useEffect, useRef, useState } from "react";
import { MoveVertical, Plus, ArrowRight, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
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
            const res = await fetch('/api/learn/chapter', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: chapter.id, title: trimmed }),
            });
            const data = await res.json();

            if (data.success) {
                setIsEditing(false);
                router.refresh();
                window.dispatchEvent(new CustomEvent('learn-structure-changed'));
            } else {
                alert(data.error || 'Lỗi khi cập nhật chương');
            }
        } catch {
            alert('Đã có lỗi xảy ra');
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
            const res = await fetch('/api/learn/chapter', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: chapter.id }),
            });
            const data = await res.json();

            if (data.success) {
                router.refresh();
                window.dispatchEvent(new CustomEvent('learn-structure-changed'));
            } else {
                alert(data.error || 'Lỗi khi xoá chương');
            }
        } catch {
            alert('Đã có lỗi xảy ra');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center justify-between gap-4 group/chap">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
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
                                    if (e.key === 'Enter') handleSaveTitle();
                                    if (e.key === 'Escape') handleCancelEdit();
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
                            <h3 className="truncate text-lg font-bold text-white group-hover/chap:text-blue-400 transition-colors">
                                {chapter.title}
                            </h3>
                            {isAdmin && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-md p-1 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                                        title="Chỉnh sửa tên chương"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="rounded-md p-1 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                        title="Xoá chương"
                                    >
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {isAdmin && !isEditing && (
                    <Link
                        href={`/learn/create?courseId=${courseId}&chapterId=${chapter.id}`}
                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-all border border-blue-500/20 shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm bài học
                    </Link>
                )}
            </div>

            <div className="divide-y divide-white/5">
                {chapter.lessons?.map((lesson, lessonIndex) => (
                    <Link
                        key={lesson.id}
                        href={`/learn/${courseSlug}/${lesson.slug}`}
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
    );
}
