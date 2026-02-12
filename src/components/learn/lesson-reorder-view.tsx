"use client";

import { useState } from "react";
import { Reorder } from "framer-motion";
import { GripVertical, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Lesson {
    id: string;
    title: string;
    order: number;
}

interface Chapter {
    id: string;
    title: string;
    lessons: Lesson[];
}

interface LessonReorderViewProps {
    chapters: Chapter[];
    onClose: () => void;
}

export function LessonReorderView({ chapters: initialChapters, onClose }: LessonReorderViewProps) {
    const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleReorderLessons = (chapterId: string, newLessons: Lesson[]) => {
        setChapters(prev => prev.map(ch =>
            ch.id === chapterId ? { ...ch, lessons: newLessons } : ch
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Flatten all lessons with their new orders
            const lessonsToUpdate: { id: string, order: number }[] = [];
            chapters.forEach(chapter => {
                chapter.lessons.forEach((lesson, index) => {
                    lessonsToUpdate.push({
                        id: lesson.id,
                        order: index + 1
                    });
                });
            });

            const res = await fetch("/api/learn/lesson/reorder", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessons: lessonsToUpdate })
            });

            if (res.ok) {
                router.refresh();
                onClose();
            } else {
                alert("Cập nhật thất bại!");
            }
        } catch (error) {
            console.error(error);
            alert("Đã có lỗi xảy ra!");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-30 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Sắp xếp bài học
                        <span className="text-xs font-normal text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">Admin</span>
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Kéo thả để thay đổi vị trí các bài học trong từng chương.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {isSaving ? "Đang lưu..." : "Đồng ý thay đổi"}
                    </button>
                </div>
            </div>

            <div className="space-y-6 pb-20">
                {chapters.map((chapter) => (
                    <div key={chapter.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                            <h3 className="font-bold text-white text-sm uppercase tracking-wider opacity-60">
                                {chapter.title}
                            </h3>
                        </div>

                        <Reorder.Group
                            axis="y"
                            values={chapter.lessons}
                            onReorder={(newOrder) => handleReorderLessons(chapter.id, newOrder)}
                            className="divide-y divide-white/5"
                        >
                            {chapter.lessons.map((lesson) => (
                                <Reorder.Item
                                    key={lesson.id}
                                    value={lesson}
                                    className="px-6 py-4 flex items-center gap-4 bg-[#111] hover:bg-white/[0.03] active:bg-white/[0.05] cursor-grab active:cursor-grabbing transition-colors group"
                                >
                                    <GripVertical className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                                    <div className="flex-1 flex items-center gap-3 overflow-hidden">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-[11px] font-bold shrink-0">
                                            -
                                        </div>
                                        <span className="text-gray-300 group-hover:text-white transition-colors truncate">
                                            {lesson.title}
                                        </span>
                                    </div>
                                </Reorder.Item>
                            ))}
                            {chapter.lessons.length === 0 && (
                                <div className="px-6 py-4 text-gray-500 text-xs italic">
                                    Không có bài học trong chương này.
                                </div>
                            )}
                        </Reorder.Group>
                    </div>
                ))}
            </div>
        </div>
    );
}
