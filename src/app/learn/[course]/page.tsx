import { CourseManager } from '@/components/learn/course-manager';
import { getCourseBySlug, getCourseSyllabus } from '@/lib/learn-db';
import { isAdminAuthenticated } from '@/lib/auth';
import Link from 'next/link';
import { BookOpen, ChevronRight, Edit, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { DeleteCourseButton } from '@/components/learn/course-actions';
import { toRoman } from '@/lib/utils';

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
            <CourseManager course={course} chapters={chapters as any} isAdmin={isAdmin} />

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
