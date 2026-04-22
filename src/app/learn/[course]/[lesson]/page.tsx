import { getLesson } from "@/lib/learn-db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import "highlight.js/styles/github-dark.css";
import { AdminControls } from "@/components/learn/admin-controls";
import { isAdminAuthenticated, isUserAuthenticated } from "@/lib/auth";
import { HistoryTracker } from "@/components/history/history-tracker";
import { WikiImage } from "@/components/wiki/wiki-image";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { parseLearnLessonContent } from "@/lib/learn-toc";
import { LessonContentLayout } from "@/components/learn/lesson-content-layout";
import { LessonScrollReset } from "@/components/learn/lesson-scroll-reset";
import { LessonAiQuestionCard } from "@/components/learn/lesson-ai-question-card";
import { PRODUCT_TOUR_STEP_PARAM, getProductTourStep } from "@/lib/product-tour";

interface PageProps {
    params: Promise<{
        course: string;
        lesson: string;
    }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LessonPage({ params, searchParams }: PageProps) {
    const { course: courseSlug, lesson: lessonSlug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const lesson = await getLesson(courseSlug, lessonSlug);
    const isLoggedIn = await isUserAuthenticated();

    if (!lesson) {
        notFound();
    }

    const parsedLessonContent = parseLearnLessonContent(lesson.content || "*Nội dung đang được cập nhật...*");
    const shouldRenderAiQuestions = Boolean(lesson.ai_question_enabled) && parsedLessonContent.sections.length > 0;
    const activeTourStepId =
        typeof resolvedSearchParams?.[PRODUCT_TOUR_STEP_PARAM] === "string"
            ? resolvedSearchParams[PRODUCT_TOUR_STEP_PARAM]
            : null;
    const activeTourStep = getProductTourStep(activeTourStepId);
    const isLessonAiGuide = activeTourStep?.id === "lesson-ai-guide" && activeTourStep.kind === "guided-content";

    return (
        <LessonContentLayout tocItems={parsedLessonContent.tocItems}>
            <div className="relative z-10 w-full max-w-none min-w-0">
                <LessonScrollReset />
                <HistoryTracker
                    type="lesson"
                    isLoggedIn={isLoggedIn}
                    data={{
                        lesson_id: lesson.id,
                        course_slug: courseSlug,
                        lesson_slug: lessonSlug,
                        lesson_title: lesson.title,
                    }}
                />

                <div className="absolute right-0 top-0 z-20">
                    <AdminControls
                        lessonId={lesson.id}
                        courseSlug={courseSlug}
                        lessonSlug={lessonSlug}
                        isAdmin={await isAdminAuthenticated()}
                    />
                </div>

                <div className="mb-8 flex flex-col gap-4">
                    <Link
                        href={`/learn/${courseSlug}`}
                        className="group flex w-fit items-center gap-2 text-white/60 transition-all hover:text-accent-secondary"
                    >
                        <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-bold uppercase tracking-wider">Quay lại</span>
                    </Link>

                    <nav className="flex overflow-x-auto whitespace-nowrap pb-2 text-sm text-gray-500">
                        <Link href="/learn" className="transition-colors hover:text-white">
                            Học tập
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                        <Link href={`/learn/${courseSlug}`} className="capitalize transition-colors hover:text-white">
                            {courseSlug.replace("-", " ")}
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                        <span className="truncate font-medium text-gray-200">
                            Bài {lesson.order}: {lesson.title}
                        </span>
                    </nav>
                </div>

                {isLessonAiGuide ? (
                    <div className="not-prose mb-8 rounded-2xl border border-amber-300/35 bg-amber-400/10 p-5 shadow-[0_0_30px_rgba(251,191,36,0.12)]">
                        <div className="mb-2 inline-flex items-center rounded-full border border-amber-300/35 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                            {activeTourStep.badge}
                        </div>
                        <h2 className="text-xl font-bold text-white">{activeTourStep.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-white/75">Lăn chuột để đọc tài liệu.</p>
                    </div>
                ) : null}

                <article
                    className="prose prose-invert prose-blue max-w-none w-full min-w-0 break-words
                    prose-headings:font-bold prose-headings:tracking-tight
                    prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                    prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-white/10
                    prose-blockquote:border-l-blue-500 prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic
                    prose-img:rounded-lg prose-img:border prose-img:border-white/10"
                >
                    <h1 className="mb-8 break-words bg-gradient-to-r from-white to-gray-400 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl md:text-4xl">
                        Bài {lesson.order}: {lesson.title}
                    </h1>

                    {!shouldRenderAiQuestions ? (
                        <MarkdownRenderer content={parsedLessonContent.content} mode="full" imageComponent={WikiImage} />
                    ) : (
                        <>
                            {parsedLessonContent.intro ? (
                                <MarkdownRenderer content={parsedLessonContent.intro} mode="full" imageComponent={WikiImage} />
                            ) : null}

                            {parsedLessonContent.sections.map((section) => (
                                <div key={section.id}>
                                    <MarkdownRenderer content={section.content} mode="full" imageComponent={WikiImage} />

                                    <div className="not-prose my-8">
                                        <LessonAiQuestionCard
                                            courseSlug={courseSlug}
                                            lessonSlug={lessonSlug}
                                            lessonTitle={lesson.title}
                                            section={section}
                                            autoGenerate={section.index <= 2}
                                            isHighlighted={isLessonAiGuide}
                                            guideText={
                                                isLessonAiGuide
                                                    ? "Làm các câu hỏi từ AI để hiểu hơn về nội dung bạn vừa học."
                                                    : undefined
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </article>

                <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8" />
            </div>
        </LessonContentLayout>
    );
}
