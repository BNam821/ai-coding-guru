"use client";

import { useState } from "react";
import { QuizGame, type QuizGameGenerationConfig } from "@/components/quiz/quiz-game";
import { CustomQuizBuilder, type CustomQuizStartPayload } from "@/components/test/custom-quiz-builder";
import { TestMode, TestModeToggle } from "@/components/test/test-mode-toggle";

interface ExamQuizExperienceProps {
    debugPreset?: "codeblock";
    initialMode?: TestMode;
    initialSelectedLessonIds?: string[];
    initialSelectionLabel?: string;
}

export function ExamQuizExperience({
    debugPreset,
    initialMode = null,
    initialSelectedLessonIds = [],
    initialSelectionLabel,
}: ExamQuizExperienceProps) {
    const [mode, setMode] = useState<TestMode>(initialMode);
    const [quizConfig, setQuizConfig] = useState<QuizGameGenerationConfig | null>(null);

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
            <div className="w-full rounded-[28px] border border-white/10 bg-black/40 p-6 text-white shadow-2xl backdrop-blur-xl md:p-8">
                <div className="space-y-3 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                        Chọn chế độ trước
                    </div>
                    <h1 className="text-3xl font-black tracking-tight md:text-4xl">Chọn chế độ làm bài trắc nghiệm</h1>
                    <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
                        Bạn có thể để hệ thống tự tạo đề từ lịch sử gần nhất, hoặc tự chọn chính xác khóa học, chương và bài học đã học để tạo đề theo nhu cầu riêng.
                    </p>
                </div>

                <TestModeToggle mode={mode} onSelect={handleModeSelect} className="mt-8" />

                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-gray-400">
                    Chọn <span className="font-semibold text-yellow-200">Kiểm tra tự động</span> để tạo đề từ lịch sử gần nhất,
                    hoặc chọn <span className="font-semibold text-white">Kiểm tra tự chọn</span> để tự quyết định phạm vi bài học dùng cho đề.
                </div>
            </div>
        </div>
    );
}
