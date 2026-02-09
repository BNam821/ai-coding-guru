import { getLesson } from '@/lib/learn-db';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { AdminControls } from '@/components/learn/admin-controls';
import { isAdminAuthenticated } from '@/lib/auth';

interface PageProps {
    params: Promise<{
        course: string;
        lesson: string;
    }>;
}

export default async function LessonPage({ params }: PageProps) {
    const { course: courseSlug, lesson: lessonSlug } = await params;
    const lesson = await getLesson(courseSlug, lessonSlug);

    if (!lesson) {
        notFound();
    }

    return (
        <div className="max-w-none relative z-10 w-full">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
                <Link href="/learn" className="hover:text-white transition-colors">Học tập</Link>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <Link href={`/learn/${courseSlug}`} className="hover:text-white transition-colors capitalize">
                    {courseSlug.replace('-', ' ')}
                </Link>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className="text-gray-200 font-medium truncate">{lesson.title}</span>
            </nav>

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
