import { getCourseBySlug, getCourseSyllabus, getLesson } from "@/lib/learn-db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft, ClipboardCheck, Sparkles } from "lucide-react";
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
    const [course, lesson] = await Promise.all([
        getCourseBySlug(courseSlug),
        getLesson(courseSlug, lessonSlug),
    ]);
    const isLoggedIn = await isUserAuthenticated();

    if (!course || !lesson) {
        notFound();
    }

    const chapters = await getCourseSyllabus(course.id);
    const firstLessonId = chapters[0]?.lessons?.[0]?.id ?? null;
    const isFirstLessonOfFirstChapter = lesson.id === firstLessonId;
    const parsedLessonContent = parseLearnLessonContent(lesson.content || "*N\u1ed9i dung \u0111ang \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt...*");
    const shouldRenderAiQuestions = Boolean(lesson.ai_question_enabled) && parsedLessonContent.sections.length > 0;
    const activeTourStepId =
        typeof resolvedSearchParams?.[PRODUCT_TOUR_STEP_PARAM] === "string"
            ? resolvedSearchParams[PRODUCT_TOUR_STEP_PARAM]
            : null;
    const activeTourStep = getProductTourStep(activeTourStepId);
    const isLessonAiGuide = activeTourStep?.id === "lesson-ai-guide" && activeTourStep.kind === "guided-content";
    const firstLessonQuizHref = `/test/exam?mode=auto&${PRODUCT_TOUR_STEP_PARAM}=lesson-quiz-check`;

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
                        <span className="text-sm font-bold uppercase tracking-wider">{"Quay l\u1ea1i"}</span>
                    </Link>

                    <nav className="flex overflow-x-auto whitespace-nowrap pb-2 text-sm text-gray-500">
                        <Link href="/learn" className="transition-colors hover:text-white">
                            {"H\u1ecdc t\u1eadp"}
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                        <Link href={`/learn/${courseSlug}`} className="capitalize transition-colors hover:text-white">
                            {courseSlug.replace("-", " ")}
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                        <span className="truncate font-medium text-gray-200">
                            {"B\u00e0i"} {lesson.order}: {lesson.title}
                        </span>
                    </nav>
                </div>

                {isLessonAiGuide ? (
                    <div className="not-prose mb-8 rounded-2xl border border-amber-300/35 bg-gradient-to-r from-amber-400/14 via-yellow-300/10 to-transparent p-5 shadow-[0_0_30px_rgba(251,191,36,0.12)]">
                        <div className="mb-2 inline-flex items-center rounded-full border border-amber-300/35 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                            {activeTourStep.badge}
                        </div>
                        <h2 className="text-xl font-bold text-white">{activeTourStep.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-amber-50/80">
                            {"H\u00e3y t\u00ecm c\u00e1c khung "}<span className="font-semibold text-amber-200">{"C\u00e2u h\u1ecfi t\u1eeb AI"}</span>{", tr\u1ea3 l\u1eddi ngay sau khi \u0111\u1ecdc xong t\u1eebng ph\u1ea7n v\u00e0 xem gi\u1ea3i th\u00edch \u0111\u1ec3 kh\u1eafc s\u00e2u ki\u1ebfn th\u1ee9c."}
                        </p>
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
                        {"B\u00e0i"} {lesson.order}: {lesson.title}
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
                                                    ? "Sau m\u1ed7i ph\u1ea7n, h\u00e3y tr\u1ea3 l\u1eddi ngay c\u00e2u h\u1ecfi t\u1eeb AI, b\u1ea5m ki\u1ec3m tra v\u00e0 \u0111\u1ecdc gi\u1ea3i th\u00edch \u0111\u1ec3 bi\u1ebft m\u00ecnh \u0111\u00e3 hi\u1ec3u b\u00e0i t\u1edbi \u0111\u00e2u."
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

                {isFirstLessonOfFirstChapter ? (
                    <div className="mt-8 rounded-[28px] border border-amber-300/35 bg-gradient-to-br from-amber-300/14 via-yellow-300/10 to-black/20 p-6 shadow-[0_0_40px_rgba(251,191,36,0.14)]">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                                    <Sparkles size={14} />
                                    {"B\u01b0\u1edbc 6: Ki\u1ec3m tra"}
                                </div>
                                <h2 className="text-2xl font-black tracking-tight text-white">
                                    {"B\u1ea1n \u0111\u00e3 h\u1ecdc xong b\u00e0i v\u1eeba r\u1ed3i? B\u1eaft \u0111\u1ea7u ki\u1ec3m tra ngay!"}
                                </h2>
                                <p className="max-w-2xl text-sm leading-7 text-amber-50/80 md:text-base">
                                    {"H\u00e3y chuy\u1ec3n sang b\u00e0i ki\u1ec3m tra t\u1ef1 \u0111\u1ed9ng \u0111\u1ec3 AI Coding Guru gi\u00fap b\u1ea1n c\u1ee7ng c\u1ed1 ki\u1ebfn th\u1ee9c ngay sau khi ho\u00e0n th\u00e0nh b\u00e0i 1 ch\u01b0\u01a1ng 1."}
                                </p>
                            </div>

                            <Link
                                href={firstLessonQuizHref}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-300/20 px-5 py-4 text-center text-sm font-bold text-amber-50 transition-all duration-200 hover:border-amber-100/80 hover:bg-amber-300/30 hover:shadow-[0_0_28px_rgba(252,211,77,0.25)]"
                            >
                                <ClipboardCheck size={18} />
                                {"B\u1ea1n \u0111\u00e3 h\u1ecdc xong b\u00e0i v\u1eeba r\u1ed3i? B\u1eaft \u0111\u1ea7u ki\u1ec3m tra ngay!"}
                            </Link>
                        </div>
                    </div>
                ) : null}
            </div>
        </LessonContentLayout>
    );
}
