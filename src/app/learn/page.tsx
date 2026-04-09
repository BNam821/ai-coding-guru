import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { RecentLesson } from '@/components/history/recent-lesson';
import { RecentLessonsList } from '@/components/history/recent-lessons-list';
import { CourseEnrollButton } from '@/components/learn/course-enroll-button';
import { getSession } from '@/lib/auth';
import { getFullLearningTree, getUserRegisteredCourseIds } from '@/lib/learn-db';

export const dynamic = 'force-dynamic';

export default async function LearnPage() {
    const [courses, session] = await Promise.all([
        getFullLearningTree(),
        getSession(),
    ]);

    const isLoggedIn = !!session;
    const featuredCourses = courses.slice(0, 3);
    const registeredCourseIds = session?.username
        ? await getUserRegisteredCourseIds(session.username)
        : [];
    const registeredCourseIdSet = new Set(registeredCourseIds);

    return (
        <div className="relative z-10 space-y-8 pb-20">
            <div className="space-y-6 text-center md:text-left">
                <div className="space-y-4">
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-white">Trung tâm học tập</h1>

                    <RecentLesson isLoggedIn={isLoggedIn} />

                    <p className="max-w-2xl text-xl text-gray-400">
                        Khám phá các khoá học, bài hướng dẫn và bài tập thực hành để nâng cao kỹ năng lập trình của bạn.
                    </p>
                </div>
            </div>

            <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-white">Khoá học trong sản phẩm</h2>
                    <span className="text-sm text-gray-400">Hiển thị tối đa 3 khoá học</span>
                </div>

                {featuredCourses.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-gray-400">
                        Chưa có khoá học nào trong hệ thống.
                    </div>
                ) : (
                    <div className="flex flex-nowrap gap-6 overflow-x-auto pb-2">
                        {featuredCourses.map((course) => (
                            <div
                                key={course.id}
                                className="group relative min-w-[280px] flex-1 rounded-xl border border-white/10 bg-white/5 p-6 pb-16 transition-all hover:border-blue-500/50 hover:bg-white/10"
                            >
                                <Link
                                    href={`/learn/${course.slug}`}
                                    className="absolute inset-0 z-10 rounded-xl"
                                    aria-label={`Mở khoá học ${course.title}`}
                                />

                                <div className="pointer-events-none absolute right-6 top-6 z-[11] text-gray-500 transition-colors group-hover:text-blue-400">
                                    <ArrowRight className="h-6 w-6 transform transition-transform group-hover:translate-x-1" />
                                </div>

                                <div className="mb-4 flex items-center space-x-4">
                                    <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-100 transition-colors group-hover:text-blue-400">
                                        {course.title}
                                    </h3>
                                </div>

                                <p className="mb-4 line-clamp-2 h-12 text-gray-400">{course.description || 'Chưa có mô tả.'}</p>

                                <div className="flex items-center pr-32 text-sm text-gray-500">
                                    <span>{course.chapters?.length || 0} chương</span>
                                    <span className="mx-2">•</span>
                                    <span>
                                        {course.chapters?.reduce((acc, chap) => acc + (chap.lessons?.length || 0), 0)} bài học
                                    </span>
                                </div>

                                <div className="absolute bottom-5 right-5 z-[12]">
                                    <CourseEnrollButton
                                        courseId={course.id}
                                        isLoggedIn={isLoggedIn}
                                        initialRegistered={registeredCourseIdSet.has(course.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <RecentLessonsList isLoggedIn={isLoggedIn} />
        </div>
    );
}
