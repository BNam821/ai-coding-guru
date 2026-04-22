"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrainCircuit, CheckCircle2, Eye, Loader2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import type { LearnLessonSection } from "@/lib/learn-toc";
import type { LearnAiQuestion } from "@/lib/learn-ai-question";
import { evaluateLearnAiAnswer } from "@/lib/learn-ai-question";
import { cn } from "@/lib/utils";

type QuestionStatus = "idle" | "prefetch-pending" | "loading" | "ready" | "error";
type AnswerResult = "correct" | "incorrect" | null;

interface LessonAiQuestionCardProps {
    courseSlug: string;
    lessonSlug: string;
    lessonTitle: string;
    section: LearnLessonSection;
    autoGenerate: boolean;
}

function buildMarkdownCodeBlock(language: string, code: string) {
    return `\`\`\`${language}\n${code}\n\`\`\``;
}

function getResultText(result: AnswerResult) {
    if (result === "correct") {
        return "Chính xác";
    }

    if (result === "incorrect") {
        return "Chưa đúng";
    }

    return "";
}

function getQuestionBadge(question: LearnAiQuestion) {
    if (question.questionType === "code_completion") {
        return "Hoàn thiện code";
    }

    if (question.questionType === "short_concept") {
        return "Trả lời khái niệm ngắn";
    }

    return "Trả lời số ngắn";
}

function getInstructionLabel(question: LearnAiQuestion) {
    return question.questionType === "code_completion" ? "Yêu cầu" : "Mục tiêu";
}

export function LessonAiQuestionCard({
    courseSlug,
    lessonSlug,
    lessonTitle,
    section,
    autoGenerate,
}: LessonAiQuestionCardProps) {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const hasRequestedRef = useRef(false);

    const [status, setStatus] = useState<QuestionStatus>(autoGenerate ? "prefetch-pending" : "idle");
    const [question, setQuestion] = useState<LearnAiQuestion | null>(null);
    const [error, setError] = useState("");
    const [userAnswer, setUserAnswer] = useState("");
    const [result, setResult] = useState<AnswerResult>(null);
    const [showAnswer, setShowAnswer] = useState(false);

    const resetAnswerState = () => {
        setUserAnswer("");
        setResult(null);
        setShowAnswer(false);
    };

    const fetchQuestion = useCallback(async (force = false) => {
        if (hasRequestedRef.current && !force) {
            return;
        }

        hasRequestedRef.current = true;
        resetAnswerState();
        setQuestion(null);
        setError("");
        setStatus("loading");

        try {
            const response = await fetch("/api/learn/ai-question", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    courseSlug,
                    lessonSlug,
                    lessonTitle,
                    sectionId: section.id,
                    sectionHeading: section.heading,
                    sectionIndex: section.index,
                    sectionContent: section.content,
                }),
            });
            const payload = await response.json();

            if (!response.ok || !payload.success || !payload.question) {
                throw new Error(payload.error || "Không thể tạo câu hỏi cho phần này.");
            }

            setQuestion(payload.question);
            setStatus("ready");
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Không thể tạo câu hỏi cho phần này.");
            setStatus("error");
        }
    }, [courseSlug, lessonSlug, lessonTitle, section.content, section.heading, section.id, section.index]);

    useEffect(() => {
        if (!autoGenerate || status !== "prefetch-pending") {
            return;
        }

        const node = cardRef.current;
        if (!node) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (!entry?.isIntersecting) {
                    return;
                }

                observer.disconnect();
                void fetchQuestion();
            },
            {
                rootMargin: "200px 0px",
                threshold: 0.15,
            }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [autoGenerate, status, fetchQuestion]);

    const handleRetry = () => {
        hasRequestedRef.current = false;
        void fetchQuestion(true);
    };

    const handleManualGenerate = () => {
        if (status === "loading") {
            return;
        }

        void fetchQuestion();
    };

    const handleCheckAnswer = () => {
        if (!question) {
            return;
        }

        const isCorrect = evaluateLearnAiAnswer(question, userAnswer);
        setResult(isCorrect ? "correct" : "incorrect");
    };

    const showFeedback = result !== null || showAnswer;

    return (
        <div ref={cardRef}>
            <GlassCard className="border-yellow-400/15 bg-gradient-to-br from-yellow-400/10 via-white/5 to-cyan-400/5 p-0" hoverEffect={false}>
                <div className="border-b border-white/10 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-yellow-300">
                            <BrainCircuit size={10} />
                            Câu hỏi từ AI
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
                            Mục {section.index}
                        </div>
                        {question && (
                            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-200">
                                {getQuestionBadge(question)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-5 px-6 py-6">
                    {(status === "idle" || status === "prefetch-pending") && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white">
                                {autoGenerate ? "Phần này sẽ tự sinh câu hỏi khi bạn cuộn tới đây." : "Bạn muốn tự kiểm tra phần này?"}
                            </h3>

                            {!autoGenerate && (
                                <NeonButton type="button" variant="secondary" onClick={handleManualGenerate} icon={<Sparkles size={16} />}>
                                    Tạo câu hỏi
                                </NeonButton>
                            )}
                        </div>
                    )}

                    {status === "loading" && (
                        <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-yellow-300" />
                            <div className="space-y-2">
                                <p className="text-lg font-semibold text-white">AI đang soạn câu hỏi cho mục này</p>
                                <p className="text-sm text-white/60">Bạn vui lòng chờ một chút nhé.</p>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="space-y-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white">Không tạo được câu hỏi</h3>
                                <p className="text-sm leading-6 text-rose-200/85">{error}</p>
                            </div>
                            <NeonButton type="button" variant="outline" onClick={handleRetry} icon={<RotateCcw size={16} />}>
                                Thử lại
                            </NeonButton>
                        </div>
                    )}

                    {status === "ready" && question && (
                        <div className="space-y-6">
                            {question.questionType === "code_completion" ? (
                                <div className="space-y-5">
                                    <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/12 via-cyan-400/6 to-white/5 p-5 shadow-[0_18px_60px_-30px_rgba(34,211,238,0.55)]">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
                                            {getInstructionLabel(question)}
                                        </p>
                                        <div className="text-lg font-semibold text-white [&_.markdown-content>p]:mb-0 [&_.markdown-content]:leading-relaxed">
                                            <MarkdownRenderer content={question.instruction} mode="safe" />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-yellow-300">Code khung</p>
                                        <MarkdownRenderer
                                            content={buildMarkdownCodeBlock(question.language, question.templateCode)}
                                            mode="safe"
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Input</p>
                                            <MarkdownRenderer content={question.inputDescription} mode="safe" />
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Output</p>
                                            <MarkdownRenderer content={question.outputDescription} mode="safe" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold uppercase tracking-[0.22em] text-white/55">
                                            Điền đoạn code thay cho {question.blankPlaceholder}
                                        </label>
                                        <textarea
                                            value={userAnswer}
                                            onChange={(event) => setUserAnswer(event.target.value)}
                                            placeholder="Nhập phần code còn thiếu..."
                                            className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm text-white outline-none transition-colors focus:border-accent-secondary/50"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-bold text-white">{question.title}</h3>
                                        <div className="rounded-2xl border border-yellow-300/30 bg-gradient-to-br from-yellow-300/16 via-amber-300/10 to-white/5 p-5 shadow-[0_24px_70px_-34px_rgba(252,211,77,0.7)]">
                                            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-yellow-200">
                                                Câu hỏi
                                            </p>
                                            <div className="text-lg font-semibold text-white [&_.markdown-content>p]:mb-0 [&_.markdown-content]:leading-relaxed">
                                                <MarkdownRenderer content={question.question} mode="safe" />
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/14 via-cyan-400/7 to-white/5 p-5 shadow-[0_18px_60px_-30px_rgba(34,211,238,0.55)]">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                                                {getInstructionLabel(question)}
                                            </p>
                                            <div className="[&_.markdown-content>p]:mb-0 [&_.markdown-content]:leading-relaxed">
                                                <MarkdownRenderer content={question.instruction} mode="safe" />
                                            </div>
                                        </div>
                                    </div>

                                    {question.questionType === "short_numeric" ? (
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold uppercase tracking-[0.22em] text-white/55">
                                                Câu trả lời dạng số {question.unit ? `(${question.unit})` : ""}
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={userAnswer}
                                                onChange={(event) => setUserAnswer(event.target.value)}
                                                placeholder="Ví dụ: 8"
                                                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition-colors focus:border-accent-secondary/50"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold uppercase tracking-[0.22em] text-white/55">
                                                Câu trả lời ngắn
                                            </label>
                                            <textarea
                                                value={userAnswer}
                                                onChange={(event) => setUserAnswer(event.target.value)}
                                                placeholder="Trả lời bằng ý chính, ngắn gọn và rõ ràng."
                                                className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none transition-colors focus:border-accent-secondary/50"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3">
                                <NeonButton
                                    type="button"
                                    variant="primary"
                                    onClick={handleCheckAnswer}
                                    disabled={!userAnswer.trim()}
                                >
                                    Kiểm tra
                                </NeonButton>
                                <NeonButton type="button" variant="ghost" onClick={handleRetry} icon={<RotateCcw size={16} />}>
                                    Sinh lại
                                </NeonButton>
                            </div>

                            {result && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <div
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]",
                                            result === "correct"
                                                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                                : "border border-rose-400/30 bg-rose-500/15 text-rose-300"
                                        )}
                                    >
                                        {result === "correct" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        {getResultText(result)}
                                    </div>

                                    {result === "incorrect" && (
                                        <NeonButton
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowAnswer((current) => !current)}
                                            icon={<Eye size={16} />}
                                        >
                                            {showAnswer ? "Ẩn đáp án" : "Xem đáp án"}
                                        </NeonButton>
                                    )}
                                </div>
                            )}

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/55">Gợi ý</p>
                                <MarkdownRenderer content={question.hint} mode="safe" />
                            </div>

                            {showFeedback && (
                                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    {showAnswer && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-300">Đáp án mẫu</p>
                                            {question.questionType === "code_completion" ? (
                                                <MarkdownRenderer
                                                    content={buildMarkdownCodeBlock(question.language, question.acceptedAnswers[0] || "")}
                                                    mode="safe"
                                                />
                                            ) : question.questionType === "short_numeric" ? (
                                                <p className="text-lg font-semibold text-white">
                                                    {question.correctAnswer}
                                                    {question.unit ? ` ${question.unit}` : ""}
                                                </p>
                                            ) : (
                                                <MarkdownRenderer content={question.canonicalAnswer} mode="safe" />
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Giải thích</p>
                                        <MarkdownRenderer content={question.explanation} mode="safe" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
