"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { ArrowLeft, Send, Type, FileText, List, Layers, Hash } from "lucide-react";
import Link from "next/link";
import { CourseWithChapters } from "@/lib/learn-db";

export default function CreateLessonPage() {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [order, setOrder] = useState(1);

    // Structure Selection
    const [courses, setCourses] = useState<CourseWithChapters[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedChapterId, setSelectedChapterId] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingStructure, setIsFetchingStructure] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    // Fetch Course Structure
    const fetchStructure = async () => {
        try {
            const res = await fetch("/api/learn/structure");
            const data = await res.json();
            if (Array.isArray(data)) {
                setCourses(data);
                // Select first course by default if none selected
                if (data.length > 0 && !selectedCourseId) {
                    setSelectedCourseId(data[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch structure", err);
        } finally {
            setIsFetchingStructure(false);
        }
    };

    useEffect(() => {
        fetchStructure();

        // Listen for structure changes (from sidebar/modals)
        window.addEventListener('learn-structure-changed', fetchStructure);
        return () => window.removeEventListener('learn-structure-changed', fetchStructure);
    }, [selectedCourseId]);

    // Auto-select first chapter when course changes
    useEffect(() => {
        if (selectedCourseId) {
            const course = courses.find(c => c.id === selectedCourseId);
            if (course && course.chapters && course.chapters.length > 0) {
                setSelectedChapterId(course.chapters[0].id);
            } else {
                setSelectedChapterId("");
            }
        }
    }, [selectedCourseId, courses]);

    // Auto-generate Slug
    useEffect(() => {
        const generatedSlug = title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        setSlug(generatedSlug);
    }, [title]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!selectedChapterId) {
            setError("Vui lòng chọn Khoá học và Chương.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/learn/lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    slug,
                    content,
                    chapter_id: selectedChapterId,
                    order
                }),
            });

            const data = await res.json();
            if (data.success) {
                router.push("/learn");
                router.refresh();
            } else {
                setError(data.error || "Không thể tạo bài học. Vui lòng thử lại.");
            }
        } catch (err) {
            setError("Đã có lỗi xảy ra khi kết nối server.");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    return (
        <main className="min-h-screen pt-10 pb-20 px-4 relative z-10 w-full max-w-4xl mx-auto">
            <Link href="/learn" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Quay lại Dashboard</span>
            </Link>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Thêm Bài Học Mới</h1>
                <p className="text-white/60">Tạo nội dung bài học mới cho hệ thống học tập.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-[1fr_300px] gap-8">
                    {/* Left Column: Content Editor */}
                    <div className="space-y-6">
                        <GlassCard className="p-1 border-white/10 overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                <Type size={18} className="text-accent-secondary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-white/40">Tiêu đề bài học</span>
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề bài học..."
                                className="w-full bg-transparent p-4 text-xl font-bold text-white focus:outline-none placeholder:text-white/20"
                                required
                            />
                        </GlassCard>

                        <GlassCard className="p-1 border-white/10 overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                <FileText size={18} className="text-blue-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-white/40">Slug (URL)</span>
                            </div>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="Slug-tu-dong-theo-tieu-de"
                                className="w-full bg-transparent p-4 text-white/80 font-mono text-sm focus:outline-none placeholder:text-white/20"
                                required
                            />
                        </GlassCard>

                        <GlassCard className="p-1 border-white/10 overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                <FileText size={18} className="text-accent-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-white/40">Nội dung (Markdown)</span>
                            </div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="# Nội dung bài học..."
                                className="w-full bg-transparent p-4 text-white focus:outline-none placeholder:text-white/20 min-h-[400px] font-mono leading-relaxed"
                                required
                            />
                        </GlassCard>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="space-y-6">
                        <GlassCard className="p-6 border-white/10 space-y-6">
                            {isFetchingStructure ? (
                                <p className="text-center text-white/40 text-sm">Đang tải cấu trúc...</p>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                            <Layers size={14} /> Khoá học
                                        </label>
                                        <select
                                            value={selectedCourseId}
                                            onChange={(e) => setSelectedCourseId(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-secondary/50 appearance-none bg-deep-space"
                                        >
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id} className="text-black bg-white">
                                                    {course.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                            <List size={14} /> Chương (Chapter)
                                        </label>
                                        <select
                                            value={selectedChapterId}
                                            onChange={(e) => setSelectedChapterId(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-secondary/50 appearance-none bg-deep-space"
                                            disabled={!selectedCourse}
                                        >
                                            <option value="">-- Chọn chương --</option>
                                            {selectedCourse?.chapters?.map(chapter => (
                                                <option key={chapter.id} value={chapter.id} className="text-black bg-white">
                                                    {chapter.title}
                                                </option>
                                            ))}
                                        </select>
                                        {!selectedCourse?.chapters?.length && (
                                            <p className="text-[10px] text-red-400">Khoá học chưa có chương nào.</p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                            <Hash size={14} /> Thứ tự (Order)
                                        </label>
                                        <input
                                            type="number"
                                            value={order}
                                            onChange={(e) => setOrder(parseInt(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-secondary/50"
                                            min={1}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="pt-6 border-t border-white/10">
                                {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
                                <NeonButton
                                    type="submit"
                                    variant="primary"
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Đang lưu..." : <><Send size={16} /> Lưu bài học</>}
                                </NeonButton>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </form>
        </main>
    );
}
