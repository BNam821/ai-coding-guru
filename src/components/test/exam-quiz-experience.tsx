"use client";

import { useEffect, useState } from "react";
import { QuizGame, type QuizGameGenerationConfig } from "@/components/quiz/quiz-game";
import { CustomQuizBuilder, type CustomQuizStartPayload } from "@/components/test/custom-quiz-builder";
import { TestMode, TestModeToggle } from "@/components/test/test-mode-toggle";

interface ExamQuizExperienceProps {
    debugPreset?: "codeblock";
    initialMode?: TestMode;
    initialSelectedLessonIds?: string[];
    initialSelectionLabel?: string;
    guideStep?: {
        badge: string;
        title: string;
        description: string;
    } | null;
}

export function ExamQuizExperience({
    debugPreset,
    initialMode = null,
    initialSelectedLessonIds = [],
    initialSelectionLabel,
    guideStep = null,
}: ExamQuizExperienceProps) {
    const [mode, setMode] = useState<TestMode>(initialMode);
    const [quizConfig, setQuizConfig] = useState<QuizGameGenerationConfig | null>(null);

    useEffect(() => {
        if (initialMode === "auto") {
            setMode("auto");
            setQuizConfig({ mode: "auto" });
        }
    }, [initialMode]);

    const handleModeSelect = (nextMode: Exclude<TestMode, null>) => {
        if (nextMode === "auto") {
            setMode(nextMode);
            setQuizConfig({ mode: "auto" });
            return;
        }

        setMode(nextMode);
    };

    const handleStartCustomQuiz = (payload: CustomQuizStartPayload) => {
        setQuizConfig({
            mode: payload.mode,
            selectedLessonIds: payload.selectedLessonIds,
            selectedLessonCount: payload.selectedLessonCount,
            questionCount: payload.questionCount,
        });
    };

    if (quizConfig) {
        return <QuizGame debugPreset={debugPreset} generationConfig={quizConfig} />;
    }

    if (mode === "custom") {
        return (
            <CustomQuizBuilder
                onBack={() => setMode(null)}
                onStart={handleStartCustomQuiz}
                initialSelectedLessonIds={initialSelectedLessonIds}
                initialSelectionLabel={initialSelectionLabel}
            />
        );
    }

    return (
        <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center">
            <div className="w-full space-y-6">
                {guideStep ? (
                    <div className="rounded-[28px] border border-amber-300/35 bg-amber-400/10 p-6 text-white shadow-[0_0_40px_rgba(251,191,36,0.12)] backdrop-blur-xl md:p-8">
                        <div className="inline-flex items-center rounded-full border border-amber-300/35 bg-black/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                            {guideStep.badge}
                        </div>
                        <h2 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">{guideStep.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-amber-50/85 md:text-base">
                            {guideStep.description}
                        </p>
                    </div>
                ) : null}

                <div className="w-full rounded-[28px] border border-white/10 bg-black/40 p-6 text-white shadow-2xl backdrop-blur-xl md:p-8">
                    <div className="space-y-3 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                            {"Ch\u1ecdn ch\u1ebf \u0111\u1ed9 tr\u01b0\u1edbc"}
                        </div>
                        <h1 className="text-3xl font-black tracking-tight md:text-4xl">{"Ch\u1ecdn ch\u1ebf \u0111\u1ed9 l\u00e0m b\u00e0i tr\u1eafc nghi\u1ec7m"}</h1>
                        <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
                            {"B\u1ea1n c\u00f3 th\u1ec3 \u0111\u1ec3 h\u1ec7 th\u1ed1ng t\u1ef1 t\u1ea1o \u0111\u1ec1 t\u1eeb l\u1ecbch s\u1eed g\u1ea7n nh\u1ea5t, ho\u1eb7c t\u1ef1 ch\u1ecdn ch\u00ednh x\u00e1c kh\u00f3a h\u1ecdc, ch\u01b0\u01a1ng v\u00e0 b\u00e0i h\u1ecdc \u0111\u00e3 h\u1ecdc \u0111\u1ec3 t\u1ea1o \u0111\u1ec1 theo nhu c\u1ea7u ri\u00eang."}
                        </p>
                    </div>

                    <TestModeToggle mode={mode} onSelect={handleModeSelect} className="mt-8" />

                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-gray-400">
                        {"Ch\u1ecdn "}<span className="font-semibold text-yellow-200">{"Ki\u1ec3m tra t\u1ef1 \u0111\u1ed9ng"}</span>{" \u0111\u1ec3 t\u1ea1o \u0111\u1ec1 t\u1eeb l\u1ecbch s\u1eed g\u1ea7n nh\u1ea5t, ho\u1eb7c ch\u1ecdn "}
                        <span className="font-semibold text-white">{"Ki\u1ec3m tra t\u1ef1 ch\u1ecdn"}</span>{" \u0111\u1ec3 t\u1ef1 quy\u1ebft \u0111\u1ecbnh ph\u1ea1m vi b\u00e0i h\u1ecdc d\u00f9ng cho \u0111\u1ec1."}
                    </div>
                </div>
            </div>
        </div>
    );
}
