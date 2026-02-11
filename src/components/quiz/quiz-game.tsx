"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, ChevronRight, RefreshCcw, Award, AlertCircle } from "lucide-react";
import { NeonButton } from "@/components/ui/neon-button";
import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export function QuizGame() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/quiz/generate", { method: "POST" });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
            if (!data.questions || data.questions.length === 0) throw new Error("No questions generated");

            setQuestions(data.questions);
        } catch (err: any) {
            console.error("Quiz Fetch Error:", err);
            setError(err.message || "Có lỗi khi tạo bài kiểm tra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (index: number) => {
        if (selectedAnswer !== null) return; // Prevent changing answer
        setSelectedAnswer(index);
        setShowExplanation(true);

        if (index === questions[currentIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            setIsFinished(true);
        }
    };

    // --- RENDER STATES ---

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🧑‍💻</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white animate-pulse">AI đang phân tích lịch sử học tập...</h2>
                    <p className="text-gray-400">Đang soạn câu hỏi phù hợp nhất cho bạn</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center space-y-6">
                <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 max-w-md mx-auto">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Không thể tạo bài kiểm tra</h3>
                    <p className="text-red-300">{error}</p>
                </div>
                <NeonButton onClick={fetchQuiz}>Thử lại</NeonButton>
            </div>
        );
    }

    if (isFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="max-w-xl mx-auto text-center space-y-8 animate-fade-in-up">
                <GlassCard className="p-8 border-yellow-400/20">
                    <Award className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2">Hoàn thành!</h2>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 mb-4">
                        {score}/{questions.length}
                    </div>
                    <p className="text-gray-400 text-lg">
                        Bạn đã trả lời đúng <span className="text-white font-bold">{percentage}%</span> số câu hỏi.
                    </p>
                </GlassCard>

                <div className="flex gap-4 justify-center">
                    <Link href="/test">
                        <NeonButton variant="outline">Thoát</NeonButton>
                    </Link>
                    <NeonButton onClick={() => window.location.reload()} icon={<RefreshCcw size={16} />}>
                        Làm lại
                    </NeonButton>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Câu hỏi {currentIndex + 1}/{questions.length}</span>
                <span>Điểm: {score}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-yellow-400 transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            {/* Question Card */}
            <GlassCard className="p-8 md:p-10 space-y-8 animate-fade-in-right">
                <h3 className="text-2xl font-bold text-white leading-relaxed">
                    {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = idx === currentQuestion.correctAnswer;
                        const showResult = selectedAnswer !== null;

                        let styleClass = "border-white/10 hover:bg-white/5 hover:border-yellow-400/50";
                        if (showResult) {
                            if (isCorrect) styleClass = "bg-green-500/20 border-green-500 text-green-200";
                            else if (isSelected) styleClass = "bg-red-500/20 border-red-500 text-red-200";
                            else styleClass = "border-white/5 opacity-50"; // Dim other options
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
                                <span className="font-medium text-lg">{option}</span>
                                {showResult && isCorrect && <CheckCircle2 className="text-green-400" />}
                                {showResult && isSelected && !isCorrect && <XCircle className="text-red-400" />}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                {showExplanation && (
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-fade-in-up">
                        <h4 className="font-bold text-blue-400 mb-1 flex items-center gap-2">
                            <span className="text-lg">💡</span> Giải thích
                        </h4>
                        <p className="text-gray-300">{currentQuestion.explanation}</p>
                    </div>
                )}
            </GlassCard>

            {/* Next Button */}
            <div className="flex justify-end">
                <button
                    onClick={nextQuestion}
                    disabled={selectedAnswer === null}
                    className="px-8 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-0 disabled:translate-y-4 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-yellow-400/20"
                >
                    {currentIndex === questions.length - 1 ? "Xem kết quả" : "Câu tiếp theo"}
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
