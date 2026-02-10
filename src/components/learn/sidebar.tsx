'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileText, Plus, Pencil, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseWithChapters } from '@/lib/learn-db';

interface LearnSidebarProps {
    courses: CourseWithChapters[];
    isAdmin?: boolean;
}

export function LearnSidebar({ courses, isAdmin = false }: LearnSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-full md:w-64 shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-md hidden md:block h-[calc(100vh-6rem)] sticky top-24 overflow-y-auto">
            <div className="p-4 space-y-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 px-2">
                    Học Tập
                </h2>

                <div className="space-y-2">
                    {courses.map((course) => (
                        <CourseItem key={course.id} course={course} pathname={pathname} isAdmin={isAdmin} />
                    ))}
                </div>
            </div>
        </aside>
    );
}

function CourseItem({ course, pathname, isAdmin }: { course: CourseWithChapters; pathname: string; isAdmin: boolean }) {
    const [isOpen, setIsOpen] = useState(true);
    const isActive = pathname.startsWith(`/learn/${course.slug}`);

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center w-full p-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/5",
                    isActive ? "text-blue-400" : "text-gray-400"
                )}
            >
                {isOpen ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                <span className="truncate">{course.title}</span>
            </button>

            {isOpen && (
                <div className="ml-4 space-y-1 border-l border-white/10 pl-2">
                    {course.chapters.map((chapter) => (
                        <ChapterItem
                            key={chapter.id}
                            chapter={chapter}
                            courseSlug={course.slug}
                            pathname={pathname}
                            isAdmin={isAdmin}
                        />
                    ))}

                    {/* Add New Chapter Button (Admin Only) */}
                    {isAdmin && (
                        <AddChapterInline courseId={course.id} />
                    )}
                </div>
            )}
        </div>
    );
}

// --- Chapter Item with inline edit ---
function ChapterItem({
    chapter,
    courseSlug,
    pathname,
    isAdmin,
}: {
    chapter: CourseWithChapters['chapters'][0];
    courseSlug: string;
    pathname: string;
    isAdmin: boolean;
}) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(chapter.title);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        const trimmed = editTitle.trim();
        if (!trimmed || trimmed === chapter.title) {
            setIsEditing(false);
            setEditTitle(chapter.title);
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
            } else {
                alert(data.error || 'Lỗi khi cập nhật');
            }
        } catch {
            alert('Đã có lỗi xảy ra');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditTitle(chapter.title);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    return (
        <div className="space-y-1">
            {/* Chapter Title */}
            <div className="group flex items-center gap-1 mt-2">
                {isEditing ? (
                    <div className="flex items-center gap-1 w-full px-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleCancel}
                            disabled={isSaving}
                            className="flex-1 bg-white/10 border border-blue-500/50 rounded px-2 py-0.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-400 min-w-0"
                        />
                        {isSaving ? (
                            <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />
                        ) : (
                            <>
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
                                    className="p-0.5 text-green-400 hover:text-green-300 shrink-0"
                                    title="Lưu"
                                >
                                    <Check className="w-3 h-3" />
                                </button>
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
                                    className="p-0.5 text-red-400 hover:text-red-300 shrink-0"
                                    title="Hủy"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                            {chapter.title}
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 text-gray-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                title="Sửa tên chương"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Lessons */}
            {chapter.lessons?.map((lesson) => {
                const href = `/learn/${courseSlug}/${lesson.slug}`;
                const isLessonActive = pathname === href;

                return (
                    <Link
                        key={lesson.id}
                        href={href}
                        className={cn(
                            "flex items-center px-2 py-1.5 text-sm rounded-md transition-colors",
                            isLessonActive
                                ? "bg-blue-500/10 text-blue-400"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <FileText className="w-3 h-3 mr-2 opacity-70" />
                        <span className="truncate">{lesson.title}</span>
                    </Link>
                );
            })}
        </div>
    );
}

// --- Add Chapter Inline ---
function AddChapterInline({ courseId }: { courseId: string }) {
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleCreate = async () => {
        const trimmed = newTitle.trim();
        if (!trimmed) {
            setIsAdding(false);
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/learn/chapter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: trimmed, course_id: courseId }),
            });
            const data = await res.json();
            if (data.success) {
                setNewTitle('');
                setIsAdding(false);
                router.refresh();
            } else {
                alert(data.error || 'Lỗi khi tạo chương');
            }
        } catch {
            alert('Đã có lỗi xảy ra');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setNewTitle('');
        setIsAdding(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleCreate();
        if (e.key === 'Escape') handleCancel();
    };

    if (!isAdding) {
        return (
            <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 mt-1 text-xs text-gray-600 hover:text-blue-400 hover:bg-white/5 rounded-md transition-colors w-full"
            >
                <Plus className="w-3 h-3" />
                <span>Thêm chương mới</span>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1 px-1 mt-1">
            <input
                ref={inputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleCancel}
                disabled={isSaving}
                placeholder="Tên chương..."
                className="flex-1 bg-white/10 border border-blue-500/50 rounded px-2 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400 min-w-0"
            />
            {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
            ) : (
                <>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
                        className="p-0.5 text-green-400 hover:text-green-300 shrink-0"
                        title="Tạo"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
                        className="p-0.5 text-red-400 hover:text-red-300 shrink-0"
                        title="Hủy"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </>
            )}
        </div>
    );
}
