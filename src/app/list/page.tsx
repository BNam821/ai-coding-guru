import Link from "next/link";
import { ArrowLeft, ArrowRight, BookMarked, BookOpen } from "lucide-react";
import { CourseEnrollButton } from "@/components/learn/course-enroll-button";
import { GlassCard } from "@/components/ui/glass-card";
import { getSession } from "@/lib/auth";
import { getFullLearningTree, getUserRegisteredCourseIds } from "@/lib/learn-db";

export const dynamic = "force-dynamic";

export default async function CourseListPage() {
    const [courses, session] = await Promise.all([
        getFullLearningTree(),
        getSession(),
    ]);

    const isLoggedIn = !!session;
    const registeredCourseIds = session?.username
        ? await getUserRegisteredCourseIds(session.username)
        : [];
    const registeredCourseIdSet = new Set(registeredCourseIds);

    return (
        <main className="relative z-10 min-h-screen px-4 pb-20 pt-32">
            <div className="absolute left-[-10%] top-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[160px]" />

            <div className="container mx-auto max-w-4xl">
                <Link href="/learn" className="group mb-6 inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white">
                    <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                    Quay lại trung tâm học tập
                </Link>

                <div className="mb-12 space-y-4 text-center md:text-left">
                    <h1 className="flex items-center justify-center gap-4 text-4xl font-bold text-white md:justify-start lg:text-5xl">
                        <BookMarked size={40} className="text-blue-400" />
                        Danh sách khoá học
                    </h1>
                    <p className="text-lg text-gray-400">
                        Toàn bộ các khoá học hiện có trong dự án, được sắp xếp để bạn chọn lộ trình phù hợp và bắt đầu học ngay.
                    </p>
                </div>

                {courses.length > 0 ? (
                    <div className="grid gap-4">
                        {courses.map((course) => {
                            const lessonCount = course.chapters.reduce((acc, chapter) => acc + (chapter.lessons?.length || 0), 0);

                            return (
                                <div key={course.id} className="group relative">
                                    <GlassCard className="relative p-6 pb-20 hover:border-blue-500/50 md:pr-28">
                                        <Link
                                            href={`/learn/${course.slug}`}
                                            className="absolute inset-0 z-10 rounded-2xl"
                                            aria-label={`Mở khoá học ${course.title}`}
                                        />

                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex items-start gap-6">
                                                <div className="rounded-2xl bg-blue-500/10 p-4 text-blue-400 transition-transform group-hover:scale-110">
                                                    <BookOpen size={24} />
                                                </div>

                                                <div>
                                                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-400">
                                                        Khoá học
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white transition-colors group-hover:text-blue-400">
                                                        {course.title}
                                                    </h3>
                                                    <p className="mt-2 max-w-2xl text-gray-400">
                                                        {course.description || "Chưa có mô tả cho khoá học này."}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                                        <span>{course.chapters.length} chương</span>
                                                        <span>•</span>
                                                        <span>{lessonCount} bài học</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <ArrowRight className="hidden shrink-0 text-gray-600 transition-all group-hover:translate-x-2 group-hover:text-white md:block" />
                                        </div>

                                        <div className="absolute bottom-6 right-6 z-[11]">
                                            <CourseEnrollButton
                                                courseId={course.id}
                                                isLoggedIn={isLoggedIn}
                                                initialRegistered={registeredCourseIdSet.has(course.id)}
                                            />
                                        </div>
                                    </GlassCard>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4 rounded-3xl border border-dashed border-white/10 bg-white/5 py-20 text-center">
                        <BookOpen size={48} className="mx-auto text-gray-600" />
                        <p className="font-medium text-gray-500">Chưa có khoá học nào trong hệ thống.</p>
                        <Link href="/learn" className="font-bold text-blue-400 hover:underline">
                            Quay lại trung tâm học tập →
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
