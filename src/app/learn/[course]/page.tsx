import { getCourseBySlug, getCourseSyllabus } from '@/lib/learn-db';
import { isAdminAuthenticated } from '@/lib/auth';
import Link from 'next/link';
import { BookOpen, FileText, ArrowRight, ChevronRight, Edit, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { DeleteCourseButton } from '@/components/learn/course-actions';

export default async function CourseDetailPage({ params }: { params: { course: string } }) {
    const { course: courseSlug } = await params;
    const course = await getCourseBySlug(courseSlug);

    if (!course) {
        notFound();
    }

    const chapters = await getCourseSyllabus(course.id);
    const isAdmin = await isAdminAuthenticated();
    const totalLessons = chapters.reduce((acc, chap) => acc + (chap.lessons?.length || 0), 0);

    return (
        <div className="space-y-8 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/learn" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Trung tâm Học tập
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-300">{course.title}</span>
            </div>

            {/* Course Header */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-500/10 rounded-xl text-blue-400">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
                            <p className="text-gray-400 mt-1">
                                {chapters.length} chương • {totalLessons} bài học
                            </p>
                        </div>
                    </div>

                    {isAdmin && (
                        <Link
                            href={`/learn/${courseSlug}/edit`}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Chỉnh sửa
                        </Link>
                    )}
                </div>

                {course.description && (
                    <p className="text-gray-400 max-w-2xl">{course.description}</p>
                )}

                {isAdmin && (
                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link
                            href="/learn/create"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm bài học mới
                        </Link>
                    </div>
                )}
            </div>

            {/* Chapters & Lessons */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Nội dung khóa học</h2>

                {chapters.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-gray-500">Khóa học chưa có nội dung.</p>
                        {isAdmin && (
                            <Link
                                href="/learn/create"
                                className="inline-block mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                            >
                                Thêm bài học
                            </Link>
                        )}
                    </div>
                ) : (
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
                                            <span className="text-sm font-bold">{chapterIndex + 1}</span>
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
                                            href={`/learn/${courseSlug}/${lesson.slug}`}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-medium">
                                                    {lessonIndex + 1}
                                                </div>
                                                <span className="text-gray-300 group-hover:text-white transition-colors">
                                                    {lesson.title}
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
                )}
            </div>

            {/* Admin: Danger Zone */}
            {isAdmin && (
                <div className="pt-12 mt-12 border-t border-red-500/20">
                    <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                                    <Trash2 className="w-5 h-5" />
                                    Vùng nguy hiểm
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    Xoá hoàn toàn khoá học này và tất cả dữ liệu liên quan. Hành động này không thể hoàn tác.
                                </p>
                            </div>
                            <div className="shrink-0 flex items-center bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                                <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
