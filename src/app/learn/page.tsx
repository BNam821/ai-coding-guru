import { getFullLearningTree } from '@/lib/learn-db';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

export default async function LearnPage() {
    const courses = await getFullLearningTree();

    return (
        <div className="space-y-8 relative z-10">
            <div className="space-y-4 text-center md:text-left">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
                    Trung tâm Học tập
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl">
                    Khám phá các khoá học, bài hướng dẫn và bài tập thực hành để nâng cao kỹ năng lập trình của bạn.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {courses.map((course) => (
                    <Link
                        key={course.id}
                        href={`/learn/${course.slug}`}
                        className="group relative block p-6 bg-white/5 bg-opacity-10 rounded-xl border border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/10"
                    >
                        <div className="absolute top-6 right-6 text-gray-500 group-hover:text-blue-400 transition-colors">
                            <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                        </div>

                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors">
                                {course.title}
                            </h3>
                        </div>

                        <p className="text-gray-400 line-clamp-2 mb-4 h-12">
                            {course.description || "Chưa có mô tả."}
                        </p>

                        <div className="flex items-center text-sm text-gray-500">
                            <span>{course.chapters?.length || 0} chương</span>
                            <span className="mx-2">•</span>
                            <span>
                                {course.chapters?.reduce((acc, chap) => acc + (chap.lessons?.length || 0), 0)} bài học
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
