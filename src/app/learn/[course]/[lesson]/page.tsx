import { getLesson } from '@/lib/learn-db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import { AdminControls } from '@/components/learn/admin-controls';
import { isAdminAuthenticated, isUserAuthenticated } from '@/lib/auth';
import { HistoryTracker } from '@/components/history/history-tracker';
import { WikiImage } from "@/components/wiki/wiki-image";
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer';
import { parseLearnLessonContent } from '@/lib/learn-toc';
import { LessonContentLayout } from '@/components/learn/lesson-content-layout';
import { LessonScrollReset } from '@/components/learn/lesson-scroll-reset';
import { LessonAiQuestionCard } from '@/components/learn/lesson-ai-question-card';

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

    const parsedLessonContent = parseLearnLessonContent(lesson.content || '*Nội dung đang được cập nhật...*');

    return (
        <LessonContentLayout tocItems={parsedLessonContent.tocItems}>
            <div className="max-w-none relative z-10 w-full">
                <LessonScrollReset />
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
                {/* Admin/Action Controls - Top Right */}
                <div className="absolute top-0 right-0 z-20">
                    <AdminControls
                        lessonId={lesson.id}
                        courseSlug={courseSlug}
                        lessonSlug={lessonSlug}
                        isAdmin={await isAdminAuthenticated()}
                    />
                </div>

                {/* Navigation & Breadcrumbs */}
                <div className="flex flex-col gap-4 mb-8">
                    <Link
                        href={`/learn/${courseSlug}`}
                        className="flex items-center gap-2 text-white/60 hover:text-accent-secondary transition-all group w-fit"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold uppercase tracking-wider">Quay lại</span>
                    </Link>

                    <nav className="flex items-center space-x-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-2">
                        <Link href="/learn" className="hover:text-white transition-colors">Học tập</Link>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                        <Link href={`/learn/${courseSlug}`} className="hover:text-white transition-colors capitalize">
                            {courseSlug.replace('-', ' ')}
                        </Link>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                        <span className="text-gray-200 font-medium truncate">Bài {lesson.order}: {lesson.title}</span>
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
                        Bài {lesson.order}: {lesson.title}
                    </h1>

                    {parsedLessonContent.sections.length === 0 ? (
                        <MarkdownRenderer
                            content={parsedLessonContent.content}
                            mode="full"
                            imageComponent={WikiImage}
                        />
                    ) : (
                        <>
                            {parsedLessonContent.intro ? (
                                <MarkdownRenderer
                                    content={parsedLessonContent.intro}
                                    mode="full"
                                    imageComponent={WikiImage}
                                />
                            ) : null}

                            {parsedLessonContent.sections.map((section) => (
                                <div key={section.id}>
                                    <MarkdownRenderer
                                        content={section.content}
                                        mode="full"
                                        imageComponent={WikiImage}
                                    />

                                    <div className="not-prose my-8">
                                        <LessonAiQuestionCard
                                            courseSlug={courseSlug}
                                            lessonSlug={lessonSlug}
                                            lessonTitle={lesson.title}
                                            section={section}
                                            autoGenerate={section.index <= 2}
                                        />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </article>


                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col gap-4">
                    {/* Navigation buttons could go here (Next/Prev lesson) - requiring logic to find next/prev */}
                </div>
            </div>
        </LessonContentLayout>
    );
}
