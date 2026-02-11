import { getLesson } from '@/lib/learn-db';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { AdminControls } from '@/components/learn/admin-controls';
import { isAdminAuthenticated, isUserAuthenticated } from '@/lib/auth';
import { HistoryTracker } from '@/components/history/history-tracker';

interface PageProps {
    params: Promise<{
        course: string;
        lesson: string;
    }>;
}

export default async function LessonPage({ params }: PageProps) {
    const { course: courseSlug, lesson: lessonSlug } = await params;
    const lesson = await getLesson(courseSlug, lessonSlug);
    const isLoggedIn = await isUserAuthenticated();

    if (!lesson) {
        notFound();
    }

    return (
        <div className="max-w-none relative z-10 w-full">
            <HistoryTracker
                type="lesson"
                isLoggedIn={isLoggedIn}
                data={{
                    lesson_id: lesson.id,
                    course_slug: courseSlug,
                    lesson_slug: lessonSlug,
                    lesson_title: lesson.title
                }}
            />
            {/* Navigation & Breadcrumbs */}
            <div className="flex flex-col gap-4 mb-8">
                <Link
                    href={`/learn/${courseSlug}`}
                    className="flex items-center gap-2 text-white/60 hover:text-accent-secondary transition-all group w-fit"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-wider">Quay lại khóa học</span>
                </Link>

                <nav className="flex items-center space-x-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-2">
                    <Link href="/learn" className="hover:text-white transition-colors">Học tập</Link>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                    <Link href={`/learn/${courseSlug}`} className="hover:text-white transition-colors capitalize">
                        {courseSlug.replace('-', ' ')}
                    </Link>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                    <span className="text-gray-200 font-medium truncate">{lesson.title}</span>
                </nav>
            </div>

            <article className="prose prose-invert prose-blue max-w-none w-full
        prose-headings:font-bold prose-headings:tracking-tight
        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
        prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-white/10
        prose-blockquote:border-l-blue-500 prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic
        prose-img:rounded-lg prose-img:border prose-img:border-white/10
        ">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {lesson.title}
                </h1>

                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                >
                    {lesson.content || '*Nội dung đang được cập nhật...*'}
                </ReactMarkdown>
            </article>


            <div className="mt-12 pt-8 border-t border-white/10 flex flex-col gap-4">
                {/* Admin Controls */}
                {await isAdminAuthenticated() && (
                    <AdminControls lessonId={lesson.id} courseSlug={courseSlug} lessonSlug={lessonSlug} />
                )}

                {/* Navigation buttons could go here (Next/Prev lesson) - requiring logic to find next/prev */}
            </div>
        </div>
    );
}
