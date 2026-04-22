"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, XCircle, ChevronRight, RefreshCcw, Award, AlertCircle, Sparkles } from "lucide-react";
import { NeonButton } from "@/components/ui/neon-button";
import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WikiImage } from "@/components/wiki/wiki-image";
import "highlight.js/styles/atom-one-dark.css";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    source: {
        sourceKey: string;
        lessonId: string | null;
        lessonTitle: string;
        lessonSlug: string;
        courseSlug: string;
    };
}

interface QuestionResult {
    questionId: number;
    source: Question["source"];
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
}

export interface QuizGameGenerationConfig {
    mode: "auto" | "custom";
    selectedLessonIds?: string[];
    selectedLessonCount?: number;
    questionCount?: number;
}

interface QuizGameProps {
    debugPreset?: "codeblock";
    generationConfig?: QuizGameGenerationConfig;
}

const DEBUG_QUESTIONS: Record<NonNullable<QuizGameProps["debugPreset"]>, Question[]> = {
    codeblock: [
        {
            id: 1,
            question: [
                "Quan sat doan ma sau:",
                "",
                "```cpp",
                "#include <iostream>",
                "using namespace std;",
                "",
                "int main() {",
                "    int x = 2;",
                "    cout << x * 3;",
                "    return 0;",
                "}",
                "```",
                "",
                "Chuong trinh se in ra ket qua nao?",
            ].join("\n"),
            options: ["`5`", "`6`", "`23`", "Loi bien dich"],
            correctAnswer: 1,
            explanation: "- **Dung**: `2 * 3 = 6`.",
            source: {
                sourceKey: "debug::lesson-1",
                lessonId: null,
                lessonTitle: "Debug Lesson 1",
                lessonSlug: "debug-lesson-1",
                courseSlug: "debug-course",
            },
        },
        {
            id: 2,
            question: [
                "Khoi code nay dung kieu du lieu nao cho bien `name`?",
                "",
                "```cpp",
                "#include <string>",
                "string name = \"Codex\";",
                "```",
            ].join("\n"),
            options: ["`char`", "`string`", "`bool`", "`double`"],
            correctAnswer: 1,
            explanation: "- `name` duoc khai bao la **`string`**.",
            source: {
                sourceKey: "debug::lesson-2",
                lessonId: null,
                lessonTitle: "Debug Lesson 2",
                lessonSlug: "debug-lesson-2",
                courseSlug: "debug-course",
            },
        },
    ],
};

function getInitialEstimatedSeconds(config?: QuizGameGenerationConfig) {
    if (config?.mode === "custom") {
        const lessonCount = config.selectedLessonCount || 0;

        if (lessonCount > 10) return 30;
        if (lessonCount >= 8) return 24;
        if (lessonCount >= 5) return 18;
        if (lessonCount >= 3) return 12;
    }

    return 10;
}

export function QuizGame({ debugPreset, generationConfig }: QuizGameProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [estimatedSeconds, setEstimatedSeconds] = useState(getInitialEstimatedSeconds(generationConfig));
    const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const correctAnswersRef = useRef(0);
    const questionResultsRef = useRef<QuestionResult[]>([]);
    const questionCardRef = useRef<HTMLDivElement>(null);
    const explanationRef = useRef<HTMLDivElement>(null);
    const isDebugMode = Boolean(debugPreset);
    const estimatedInitialSeconds = getInitialEstimatedSeconds(generationConfig);
    const isCustomQuiz = generationConfig?.mode === "custom";

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading && estimatedSeconds > 0) {
            interval = setInterval(() => {
                setEstimatedSeconds((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loading, estimatedSeconds]);

    const resetGameState = (nextQuestions: Question[]) => {
        setQuestions(nextQuestions);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setScore(0);
        correctAnswersRef.current = 0;
        questionResultsRef.current = [];
        setIsFinished(false);
        setSyncState("idle");
    };

    useEffect(() => {
        const loadQuiz = async () => {
            setLoading(true);
            setError("");
            setEstimatedSeconds(estimatedInitialSeconds);

            if (debugPreset) {
                resetGameState(DEBUG_QUESTIONS[debugPreset]);
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("/api/quiz/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(generationConfig || { mode: "auto" }),
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
                if (!data.questions || data.questions.length === 0) throw new Error("No questions generated");

                resetGameState(data.questions);
            } catch (err: any) {
                console.error("Quiz Fetch Error:", err);
                setError(err.message || "Co loi khi tao bai kiem tra. Vui long thu lai.");
            } finally {
                setLoading(false);
            }
        };

        void loadQuiz();
    }, [debugPreset, estimatedInitialSeconds, generationConfig, refreshKey]);

    const fetchQuiz = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleAnswer = (index: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(index);
        setShowExplanation(true);

        questionResultsRef.current.push({
            questionId: questions[currentIndex].id,
            source: questions[currentIndex].source,
            selectedAnswer: index,
            correctAnswer: questions[currentIndex].correctAnswer,
            isCorrect: index === questions[currentIndex].correctAnswer,
        });

        if (index === questions[currentIndex].correctAnswer) {
            correctAnswersRef.current += 1;
            setScore((prev) => prev + 1);
        }

        setTimeout(() => {
            explanationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    };

    const syncScore = async (finalScore: number) => {
        if (isDebugMode) {
            setSyncState("idle");
            return;
        }

        try {
            setSyncState("saving");
            const actualScore = Math.round((finalScore / questions.length) * 100);
            const res = await fetch("/api/quiz/score", {
                method: "POST",
                keepalive: true,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    score: actualScore,
                    correctAnswers: finalScore,
                    totalQuestions: questions.length,
                    questionSources: questions.map((question) => question.source),
                    questionPayload: questions,
                    questionResults: questionResultsRef.current,
                }),
            });

            if (!res.ok) {
                throw new Error("Score sync failed");
            }

            setSyncState("saved");
        } catch (err) {
            console.error("Failed to sync score:", err);
            setSyncState("error");
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);

            setTimeout(() => {
                questionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        } else {
            setIsFinished(true);
            syncScore(correctAnswersRef.current);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">AI</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white animate-pulse italic">
                        {isCustomQuiz ? "AI dang doc ky cac bai hoc ban da chon..." : "AI dang phan tich lich su hoc tap..."}
                    </h2>
                    <div className="space-y-2">
                        <p className="text-gray-400">
                            {isCustomQuiz
                                ? `Dang tong hop ${generationConfig?.selectedLessonCount || 0} bai hoc de tao ${generationConfig?.questionCount || "--"} cau hoi phu hop nhat cho ban`
                                : "Dang soan cau hoi phu hop nhat cho ban"}
                        </p>
                        <p className="text-yellow-400/60 text-sm font-mono tracking-widest bg-yellow-400/5 py-1 px-3 rounded-full border border-yellow-400/10 inline-block">
                            {estimatedSeconds > 0
                                ? `Du kien: ~${estimatedSeconds} giay nua`
                                : "Sap xong roi, hay kien nhan mot chut..."}
                        </p>
                    </div>

                    <div className="w-48 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-600/40 to-yellow-400 transition-all duration-1000 ease-linear"
                            style={{ width: `${Math.min(100, ((estimatedInitialSeconds - estimatedSeconds) / estimatedInitialSeconds) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 max-w-md mx-auto">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Khong the tao bai kiem tra</h3>
                    <p className="text-red-300">{error}</p>
                </div>
                <NeonButton onClick={fetchQuiz}>Thu lai</NeonButton>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="max-w-xl mx-auto text-center space-y-8 animate-fade-in-up">
                <GlassCard className="p-8 border-yellow-400/20">
                    <Award className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2">Hoan thanh!</h2>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 mb-4">
                        {Math.round((score / questions.length) * 100)}/100
                    </div>
                    <p className="text-gray-400 text-lg">
                        Ban da tra loi dung <span className="text-white font-bold">{score}/{questions.length}</span> cau hoi.
                    </p>
                    <p className="mt-4 text-sm text-gray-400">
                        {isDebugMode && "Dang o debug mode, ket qua khong duoc luu."}
                        {syncState === "saving" && "Dang dong bo ket qua vao dashboard..."}
                        {syncState === "saved" && "Ket qua da duoc luu vao dashboard."}
                        {syncState === "error" && "Chua luu duoc ket qua. Hay thu lam lai hoac kiem tra ket noi."}
                    </p>
                </GlassCard>

                <div className="flex gap-4 justify-center">
                    <Link href="/test">
                        <NeonButton variant="outline">Thoat</NeonButton>
                    </Link>
                    <NeonButton onClick={() => window.location.reload()} icon={<RefreshCcw size={16} />}>
                        Lam lai
                    </NeonButton>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {isDebugMode && (
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
                    Debug mode dang bat voi preset <code className="rounded bg-black/20 px-1.5 py-0.5 text-sky-200">?debug={debugPreset}</code>.
                    Cau hoi dang dung du lieu mau de kiem tra render Markdown va code block.
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-bold text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                        <Sparkles size={14} className="animate-pulse" />
                        Cau hoi {currentIndex + 1} / {questions.length}
                    </div>

                    <div className="px-4 py-1.5 rounded-lg bg-black/40 border-2 border-yellow-400/50 text-yellow-400 font-bold shadow-[0_0_20px_rgba(250,204,21,0.2)] flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-tighter opacity-70">Score:</span>
                        <span className="text-lg font-black">{Math.round((score / questions.length) * 100)}</span>
                    </div>
                </div>

                <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-500 rounded-full transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/2 -skew-x-[30deg] animate-shimmer" />
                    </div>
                </div>
            </div>

            <GlassCard ref={questionCardRef} className="p-8 md:p-10 space-y-8 animate-fade-in-right">
                <div className="p-6 md:p-8 rounded-2xl bg-yellow-400/5 border border-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.05)] mb-8">
                    <div className="prose prose-invert prose-lg md:prose-xl max-w-none font-bold text-white tracking-tight leading-relaxed [&_pre]:font-normal [&_pre]:text-sm [&_code]:font-mono">
                        <MarkdownRenderer content={currentQuestion.question} mode="safe" />
                    </div>
                </div>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = idx === currentQuestion.correctAnswer;
                        const showResult = selectedAnswer !== null;

                        let styleClass = "border-white/10 hover:bg-white/5 hover:border-yellow-400/50";
                        if (showResult) {
                            if (isCorrect) styleClass = "bg-green-500/20 border-green-500 text-green-200";
                            else if (isSelected) styleClass = "bg-red-500/20 border-red-500 text-red-200";
                            else styleClass = "border-white/5 opacity-50";
                        } else if (isSelected) {
                            styleClass = "bg-yellow-400/20 border-yellow-400";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={showResult}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group",
                                    styleClass
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "w-8 h-8 shrink-0 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all duration-300",
                                        showResult
                                            ? (isCorrect ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : isSelected ? "bg-red-500/20 border-red-500 text-red-400" : "border-white/5 text-gray-600 opacity-50")
                                            : isSelected
                                                ? "bg-yellow-400 border-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)] scale-110"
                                                : [
                                                    "border-blue-500/30 text-blue-400 bg-blue-500/5 group-hover:border-blue-400 group-hover:bg-blue-500/10",
                                                    "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 group-hover:border-emerald-400 group-hover:bg-emerald-500/10",
                                                    "border-amber-500/30 text-amber-400 bg-amber-500/5 group-hover:border-amber-400 group-hover:bg-amber-500/10",
                                                    "border-purple-500/30 text-purple-400 bg-purple-500/5 group-hover:border-purple-400 group-hover:bg-purple-500/10",
                                                ][idx]
                                    )}>
                                        {["A", "B", "C", "D"][idx]}
                                    </span>
                                    <div className="prose prose-invert prose-sm max-w-none font-bold text-white group-hover:text-blue-50 transition-colors">
                                        <MarkdownRenderer content={option} mode="lite" />
                                    </div>
                                </div>
                                {showResult && isCorrect && <CheckCircle2 className="text-green-400" />}
                                {showResult && isSelected && !isCorrect && <XCircle className="text-red-400" />}
                            </button>
                        );
                    })}
                </div>

                {showExplanation && (
                    <div ref={explanationRef} className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-fade-in-up">
                        <h4 className="font-bold text-blue-400 mb-1 flex items-center gap-2">
                            <span className="text-lg">?</span> Giai thich
                        </h4>
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                            <MarkdownRenderer
                                content={currentQuestion.explanation}
                                mode="safe"
                                imageComponent={WikiImage}
                            />
                        </div>
                    </div>
                )}
            </GlassCard>

            <div className="flex justify-between items-center pt-4">
                <button
                    onClick={() => setShowExitModal(true)}
                    className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-500/10"
                >
                    Thoat
                </button>

                <button
                    onClick={nextQuestion}
                    disabled={selectedAnswer === null}
                    className="px-8 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-0 disabled:translate-y-4 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-yellow-400/20"
                >
                    {currentIndex === questions.length - 1 ? "Xem ket qua" : "Cau tiep theo"}
                    <ChevronRight size={20} />
                </button>
            </div>

            {showExitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowExitModal(false)}
                    />
                    <GlassCard className="relative z-10 p-8 max-w-sm w-full border-white/10 text-center space-y-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="text-red-400 w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Ban co chac chan khong?</h3>
                            <p className="text-gray-400 text-sm">
                                Tien trinh lam bai cua ban se bi mat neu ban thoat ngay bay gio.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10"
                            >
                                Tiep tuc lam bai
                            </button>
                            <Link href="/test" className="w-full">
                                <button className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors border border-red-500/20">
                                    Thoat
                                </button>
                            </Link>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
