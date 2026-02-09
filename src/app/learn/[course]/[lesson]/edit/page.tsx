"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { ArrowLeft, Save, Type, FileText, List, Layers, Hash } from "lucide-react";
import Link from "next/link";
import { CourseWithChapters } from "@/lib/learn-db";

export default function EditLessonPage({ params }: { params: Promise<{ course: string; lesson: string }> }) {
    const { course: courseSlug, lesson: lessonSlug } = use(params);

    const [lessonId, setLessonId] = useState("");
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [order, setOrder] = useState(1);

    // Structure Selection
    const [courses, setCourses] = useState<CourseWithChapters[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedChapterId, setSelectedChapterId] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // Fetch Initial Data and Structure
    useEffect(() => {
        const fetchAlldata = async () => {
            try {
                // 1. Fetch Structure
                const structRes = await fetch("/api/learn/structure");
                const structData = await structRes.json();
                setCourses(structData);

                // 2. Fetch Lesson Data
                // Since we don't have a direct API to get by slug yet OTHER than the page logic
                // We'll trust the page logic or creating a specific GET endpoint. 
                // However, we can use the existing server helper in a Client Component? No.
                // We'll create a simple GET logic inside the component via server action or just use standard fetch to an API if available.
                // Actually, the page rendered on server has data. But this is a client page.
                // WE NEED TO FETCH LESSON DETAILS. 
                // Let's reuse the getLesson from lib but via an API wrapper or Server Action. 
                // For now, let's assume we fetch all data to find it OR add a specific GET endpoint.
                // To keep it clean, let's just loop through the structure we just fetched if it contains everything!
                // Wait, getFullLearningTree returns lessons too. So we can find it there!

                let foundLesson = null;
                let foundChapterId = "";
                let foundCourseId = "";

                for (const course of structData as CourseWithChapters[]) {
                    if (course.slug === courseSlug) {
                        foundCourseId = course.id;
                        for (const chapter of course.chapters) {
                            const lesson = chapter.lessons?.find(l => l.slug === lessonSlug);
                            if (lesson) {
                                // We found the basic info, but we need CONTENT.
                                // The tree query DOES NOT return content (potentially large).
                                // So we need to fetch individual lesson content.
                                foundLesson = lesson;
                                foundChapterId = chapter.id;
                                break;
                            }
                        }
                        break;
                    }
                }

                if (foundLesson) {
                    setLessonId(foundLesson.id);
                    setTitle(foundLesson.title);
                    setSlug(foundLesson.slug);
                    setOrder(foundLesson.order);
                    setSelectedCourseId(foundCourseId);
                    setSelectedChapterId(foundChapterId);

                    // Fetch Content
                    // We can reuse the same API endpoint used for Create but with GET? 
                    // Or just use the existing page logic... 
                    // Let's call /api/learn/lesson?id={id} (we need to implement GET there or just add it now)
                    // Wait, we don't have GET /api/learn/lesson?id yet.
                    // Implementation Plan update: We need GET /api/learn/lesson to fetch details (content).
                    // For now, let's add that to the API route!

                    // TEMPORARY: fetch content via a new call.
                    const contentRes = await fetch(`/api/learn/lesson?id=${foundLesson.id}`);
                    const contentData = await contentRes.json();
                    if (contentData.success) {
                        setContent(contentData.lesson.content || "");
                    }
                } else {
                    setError("Không tìm thấy bài học.");
                }

            } catch (err) {
                console.error(err);
                setError("Lỗi tải dữ liệu");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlldata();
    }, [courseSlug, lessonSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError("");

        try {
            const res = await fetch("/api/learn/lesson", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: lessonId,
                    title,
                    slug,
                    content,
                    chapter_id: selectedChapterId,
                    order
                }),
            });

            const data = await res.json();
            if (data.success) {
                router.push(`/learn/${courseSlug}/${slug}`); // redirect to new slug if changed
                router.refresh();
            } else {
                setError(data.error || "Lỗi khi lưu bài.");
            }
        } catch (err) {
            setError("Lỗi kết nối.");
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    if (isLoading) return <div className="text-white text-center pt-20">Đang tải...</div>;

    return (
        <main className="min-h-screen pt-10 pb-20 px-4 relative z-10 w-full max-w-4xl mx-auto">
            <Link href={`/learn/${courseSlug}/${lessonSlug}`} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Quay lại bài học</span>
            </Link>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Chỉnh Sửa Bài Học</h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-[1fr_300px] gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <GlassCard className="p-1 border-white/10 overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                <Type size={18} className="text-accent-secondary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-white/40">Tiêu đề</span>
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
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
                                className="w-full bg-transparent p-4 text-white focus:outline-none placeholder:text-white/20 min-h-[400px] font-mono leading-relaxed"
                                required
                            />
                        </GlassCard>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <GlassCard className="p-6 border-white/10 space-y-6">
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
                                    <List size={14} /> Chương
                                </label>
                                <select
                                    value={selectedChapterId}
                                    onChange={(e) => setSelectedChapterId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-secondary/50 appearance-none bg-deep-space"
                                    disabled={!selectedCourse}
                                >
                                    {selectedCourse?.chapters?.map(chapter => (
                                        <option key={chapter.id} value={chapter.id} className="text-black bg-white">
                                            {chapter.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                    <Hash size={14} /> Thứ tự
                                </label>
                                <input
                                    type="number"
                                    value={order}
                                    onChange={(e) => setOrder(parseInt(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-secondary/50"
                                    min={1}
                                />
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
                                <NeonButton
                                    type="submit"
                                    variant="primary"
                                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Đang lưu..." : <><Save size={16} /> Lưu Thay Đổi</>}
                                </NeonButton>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </form>
        </main>
    );
}
