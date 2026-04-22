"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor } from "@monaco-editor/react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { TestMode, TestModeToggle } from "@/components/test/test-mode-toggle";
import { CodeExerciseTypeToggle } from "@/components/test/code-exercise-type-toggle";
import { AiReportButton } from "@/components/ai/ai-report-button";
import { Play, CheckCircle2, AlertCircle, Loader2, Lightbulb, ChevronRight, X } from "lucide-react";
import { getCodingProblemById, CodingProblem } from "@/lib/coding-problems-service";
import {
    CodeExerciseType,
    DEFAULT_CODE_EXERCISE_TYPE,
    PreparedCodingProblem,
    parseCodeExerciseType,
    prepareCodingProblem,
} from "@/lib/code-exercise";

export default function CodeGradingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const specificId = searchParams.get("id");
    const queryExerciseType = parseCodeExerciseType(searchParams.get("exerciseType"));

    const [mode, setMode] = useState<TestMode>(null);
    const [exerciseType, setExerciseType] = useState<CodeExerciseType>(queryExerciseType);
    const [problem, setProblem] = useState<PreparedCodingProblem | null>(null);
    const [userCode, setUserCode] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [actualOutput, setActualOutput] = useState("");
    const [score, setScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState("");
    const [suggestion, setSuggestion] = useState("");
    const [interactionId, setInteractionId] = useState<string | null>(null);
    const [isExhausted, setIsExhausted] = useState(false);
    const [exhaustedMessage, setExhaustedMessage] = useState("");
    const [isLoadingNextProblem, setIsLoadingNextProblem] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);

    const getZeroScoreStreakStorageKey = useCallback((problemId: string, currentExerciseType: CodeExerciseType) => {
        return `code-zero-score-streak:${problemId}:${currentExerciseType}`;
    }, []);

    const readZeroScoreStreak = useCallback((problemId: string, currentExerciseType: CodeExerciseType) => {
        if (typeof window === "undefined") {
            return 0;
        }

        const rawValue = window.localStorage.getItem(
            getZeroScoreStreakStorageKey(problemId, currentExerciseType)
        );
        const parsedValue = Number(rawValue);
        return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
    }, [getZeroScoreStreakStorageKey]);

    const writeZeroScoreStreak = useCallback((problemId: string, currentExerciseType: CodeExerciseType, nextValue: number) => {
        if (typeof window === "undefined") {
            return;
        }

        const storageKey = getZeroScoreStreakStorageKey(problemId, currentExerciseType);
        if (nextValue <= 0) {
            window.localStorage.removeItem(storageKey);
            return;
        }

        window.localStorage.setItem(storageKey, String(nextValue));
    }, [getZeroScoreStreakStorageKey]);

    useEffect(() => {
        setExerciseType(queryExerciseType);
    }, [queryExerciseType]);

    const buildCodePageHref = useCallback((nextExerciseType: CodeExerciseType, nextProblemId?: string | null) => {
        const params = new URLSearchParams();

        if (nextProblemId) {
            params.set("id", nextProblemId);
        }

        if (nextExerciseType !== DEFAULT_CODE_EXERCISE_TYPE) {
            params.set("exerciseType", nextExerciseType);
        }

        const query = params.toString();
        return query ? `/test/code?${query}` : "/test/code";
    }, []);

    const applyPreparedProblem = useCallback((baseProblem: CodingProblem, nextExerciseType: CodeExerciseType) => {
        const preparedProblem = prepareCodingProblem(baseProblem, nextExerciseType);
        setProblem(preparedProblem);
        setUserCode(preparedProblem.starterCode);
        setScore(null);
        setActualOutput("");
        setFeedback("");
        setSuggestion("");
        setInteractionId(null);
        setShowSuggestions(false);
        setIsExhausted(false);
    }, []);

    const loadProblem = useCallback(async (options?: { excludeProblemId?: string }) => {
        let selectedProblem: CodingProblem | null = null;

        if (specificId) {
            selectedProblem = await getCodingProblemById(specificId);
            if (selectedProblem) {
                applyPreparedProblem(selectedProblem, exerciseType);
                return;
            }
        }

        try {
            const smartProblemUrl = options?.excludeProblemId
                ? `/api/test/smart-problem?excludeProblemId=${encodeURIComponent(options.excludeProblemId)}`
                : "/api/test/smart-problem";
            const res = await fetch(smartProblemUrl, { cache: "no-store" });
            const data = await res.json();

            if (data.status === "exhausted") {
                setIsExhausted(true);
                setExhaustedMessage(data.message);
                setProblem(null);
            } else if (data.problem) {
                applyPreparedProblem(data.problem, exerciseType);
            }
        } catch (err) {
            console.error("Error smart fetching:", err);
        }
    }, [applyPreparedProblem, exerciseType, specificId]);

    useEffect(() => {
        if (specificId && mode === null) {
            setMode("auto");
        }
    }, [specificId, mode]);

    useEffect(() => {
        if (mode === "custom") {
            const params = new URLSearchParams();
            if (exerciseType !== DEFAULT_CODE_EXERCISE_TYPE) {
                params.set("exerciseType", exerciseType);
            }

            const query = params.toString();
            router.push(query ? `/test/code/list?${query}` : "/test/code/list");
        }
    }, [exerciseType, mode, router]);

    useEffect(() => {
        if (mode !== "auto") {
            return;
        }

        loadProblem();
    }, [exerciseType, loadProblem, mode]);

    const updatePlaceholders = useCallback((editor: any) => {
        const model = editor.getModel();
        if (!model) return;

        if (exerciseType !== "solve") {
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
            return;
        }

        const matches = model.findMatches("...", true, false, true, null, true);
        const newDecorations = matches.map((match: any) => ({
            range: match.range,
            options: {
                inlineClassName: "skeleton-placeholder-highlight",
                hoverMessage: { value: "Thay thế bằng code của bạn" },
            },
        }));

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    }, [exerciseType]);

    useEffect(() => {
        if (editorRef.current) {
            updatePlaceholders(editorRef.current);
        }
    }, [exerciseType, updatePlaceholders, userCode]);

    const handleExerciseTypeChange = useCallback((nextExerciseType: CodeExerciseType) => {
        setExerciseType(nextExerciseType);
        router.replace(buildCodePageHref(nextExerciseType, specificId));
    }, [buildCodePageHref, router, specificId]);

    const handleEvaluate = async () => {
        if (!problem) return;
        setIsEvaluating(true);
        setActualOutput("");
        setScore(null);
        setFeedback("");
        setSuggestion("");
        setInteractionId(null);
        setShowSuggestions(false);

        const zeroScoreStreakBeforeSubmission = problem.exerciseType === "fix_bug"
            ? readZeroScoreStreak(problem.id, problem.exerciseType)
            : 0;

        try {
            const res = await fetch("/api/code-evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userCode,
                    problemId: problem.id,
                    problemObj: problem,
                    exerciseType: problem.exerciseType,
                    starterCode: problem.starterCode,
                    bugChangeSummary: problem.bugChangeSummary,
                    zeroScoreStreakBeforeSubmission,
                }),
            });
            const data = await res.json();
            const nextScore = data.score ?? 0;

            if (problem.exerciseType === "fix_bug") {
                const nextZeroScoreStreak = nextScore === 0
                    ? zeroScoreStreakBeforeSubmission + 1
                    : 0;
                writeZeroScoreStreak(problem.id, problem.exerciseType, nextZeroScoreStreak);
            }

            setActualOutput(data.actualOutput || "");
            setScore(nextScore);
            setFeedback(data.feedback || "Không có phản hồi");
            setSuggestion(data.suggestion || "");
            setInteractionId(typeof data.interactionId === "string" ? data.interactionId : null);
        } catch (_error) {
            setFeedback("Có lỗi xảy ra khi chấm bài.");
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleNewProblem = async () => {
        setScore(null);
        setActualOutput("");
        setFeedback("");
        setSuggestion("");
        setInteractionId(null);
        setShowSuggestions(false);
        setIsLoadingNextProblem(true);

        try {
            if (searchParams.get("id")) {
                router.push(buildCodePageHref(exerciseType));
            } else {
                await loadProblem({ excludeProblemId: problem?.id });
            }
        } finally {
            setIsLoadingNextProblem(false);
        }
    };

    if (mode !== "auto") {
        return (
            <main className="min-h-screen px-4 pb-20 pt-28 relative z-10 text-white">
                <div className="absolute inset-0 bg-deep-space -z-20" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[160px] -z-10" />

                <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
                    <div className="w-full rounded-[28px] border border-white/10 bg-black/40 p-6 text-white shadow-2xl backdrop-blur-xl md:p-8">
                        <div className="space-y-3 text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                                Chọn chế độ trước
                            </div>
                            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Chọn chế độ chấm code</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
                                Trước khi hệ thống tìm bài tập phù hợp, hãy chọn cách bạn muốn bắt đầu buổi luyện code.
                            </p>
                        </div>

                        <TestModeToggle mode={mode} onSelect={setMode} className="mt-8" />

                        <div className="mt-6 space-y-3">
                            <div className="text-center">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Dạng bài</p>
                                <p className="mt-2 text-sm text-gray-400">
                                    Quy định rõ dạng bài để editor mở đúng trạng thái và AI nhận xét đúng ngữ cảnh.
                                </p>
                            </div>
                            <CodeExerciseTypeToggle value={exerciseType} onChange={handleExerciseTypeChange} />
                        </div>

                        {mode === "custom" ? (
                            <div className="rounded-2xl border border-gray-500/20 bg-gray-500/10 p-5 text-center">
                                <h2 className="text-lg font-bold text-white">Đang chuyển sang danh sách bài tập</h2>
                                <p className="mt-2 text-sm leading-6 text-gray-400">
                                    Bạn sẽ được đưa tới trang <span className="font-semibold text-white">/test/code/list</span> để tự chọn bài tập muốn theo dõi hoặc luyện tập.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-gray-400">
                                Chọn một chế độ để tiếp tục. <span className="font-semibold text-gray-200">Kiểm tra tự chọn</span> sẽ mở danh sách bài tập,
                                còn <span className="font-semibold text-yellow-200">Kiểm tra tự động</span> sẽ để AI tự tìm bài phù hợp cho bạn.
                                Dạng bài hiện tại là <span className="font-semibold text-white">{exerciseType === "fix_bug" ? "Sửa lỗi code" : "Hoàn thiện code"}</span>.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    if (isExhausted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-transparent px-6 text-center">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-10 rounded-3xl max-w-2xl shadow-2xl animate-fade-in">
                    <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6 animate-bounce" />
                    <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Tuyệt vời!</h2>
                    <p className="text-xl text-white/70 leading-relaxed mb-8">
                        {exhaustedMessage}
                    </p>
                    <button
                        onClick={handleNewProblem}
                        className="px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-2xl transition-all shadow-xl hover:scale-105"
                    >
                        BẮT ĐẦU LẠI TỪ ĐẦU
                    </button>
                </div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
            </div>
        );
    }

    return (
        <main className="h-screen flex flex-col bg-transparent text-white overflow-hidden pt-24 relative z-10">
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-yellow-400/20 text-yellow-300 text-xs font-black tracking-widest uppercase rounded ring-1 ring-yellow-400/50">
                        {problem.language === "cpp" ? "C++" : problem.language.toUpperCase()}
                    </div>
                    <div className={`px-3 py-1 text-xs font-black tracking-widest uppercase rounded ring-1 ${
                        problem.exerciseType === "fix_bug"
                            ? "bg-rose-400/15 text-rose-200 ring-rose-300/40"
                            : "bg-cyan-400/15 text-cyan-100 ring-cyan-300/40"
                    }`}>
                        {problem.exerciseLabel}
                    </div>
                    <h1 className="font-bold text-white tracking-wide text-lg drop-shadow-md">{problem.title}</h1>
                </div>

                <div className="flex items-center gap-3">
                    {score === 100 && (
                        <button
                            onClick={handleNewProblem}
                            disabled={isLoadingNextProblem}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-bounce-slow"
                        >
                            {isLoadingNextProblem ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                            <span className="uppercase tracking-wider">Làm bài tập khác</span>
                        </button>
                    )}

                    <button
                        onClick={handleEvaluate}
                        disabled={isEvaluating || score === 100 || isLoadingNextProblem}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] border border-yellow-300/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isEvaluating ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                        <span className="uppercase tracking-wider">Nộp bài & Chạy</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0">
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={35} minSize={20}>
                        <div className="h-full overflow-y-auto p-6 custom-scrollbar bg-black/40 backdrop-blur-sm border-r border-white/10">
                            <div className={`mb-6 rounded-2xl border p-4 ${
                                problem.exerciseType === "fix_bug"
                                    ? "border-rose-400/20 bg-rose-400/10"
                                    : "border-cyan-400/20 bg-cyan-400/10"
                            }`}>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                                        problem.exerciseType === "fix_bug"
                                            ? "bg-rose-300/15 text-rose-100"
                                            : "bg-cyan-300/15 text-cyan-100"
                                    }`}>
                                        Dạng bài: {problem.exerciseLabel}
                                    </span>
                                    <span className="text-xs text-white/50">
                                        
                                    </span>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-gray-200/85">
                                    {problem.exerciseDescription}
                                </p>
                            </div>

                            <div className="prose prose-invert prose-yellow max-w-none">
                                <MarkdownRenderer content={problem.description} mode="safe" />
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400/80 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-yellow-400 rounded-full" />
                                        Dữ liệu đầu vào (Input)
                                    </h3>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                            {problem.expected_input || "Không có dữ liệu đầu vào."}
                                        </pre>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-orange-400/80 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-orange-400 rounded-full" />
                                        Kết quả mong muốn (Output)
                                    </h3>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                            {problem.expected_output}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-2 bg-white/5 hover:bg-yellow-400/50 transition-colors cursor-col-resize flex items-center justify-center">
                        <div className="h-8 w-1 bg-white/20 rounded-full" />
                    </PanelResizeHandle>

                    <Panel defaultSize={65} minSize={30}>
                        <PanelGroup direction="vertical">
                            <Panel defaultSize={60} minSize={20}>
                                <PanelGroup direction="horizontal">
                                    <Panel minSize={30}>
                                        <div className="h-full w-full">
                                            <Editor
                                                height="100%"
                                                language={problem.language}
                                                theme="vs-dark"
                                                value={userCode}
                                                onChange={(val) => setUserCode(val || "")}
                                                onMount={(editor) => {
                                                    editorRef.current = editor;
                                                    updatePlaceholders(editor);
                                                }}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 15,
                                                    padding: { top: 16 },
                                                    smoothScrolling: true,
                                                    cursorBlinking: "smooth",
                                                }}
                                            />
                                        </div>
                                    </Panel>

                                    {showSuggestions && score !== null && score < 100 && (
                                        <>
                                            <PanelResizeHandle className="w-2 bg-white/5 hover:bg-blue-400/50 transition-colors cursor-col-resize flex items-center justify-center">
                                                <div className="h-8 w-1 bg-white/20 rounded-full" />
                                            </PanelResizeHandle>
                                            <Panel defaultSize={40} minSize={20}>
                                                <div className="h-full bg-blue-500/5 border-l border-white/10 flex flex-col overflow-hidden">
                                                    <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-black/20 shrink-0">
                                                        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
                                                            <Lightbulb size={14} />
                                                            Gợi ý sửa lỗi
                                                        </div>
                                                        <button
                                                            onClick={() => setShowSuggestions(false)}
                                                            className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-500 hover:text-white"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-black/40">
                                                        {suggestion ? (
                                                            <div className="prose prose-sm prose-invert max-w-none feedback-markdown">
                                                                <MarkdownRenderer content={suggestion} mode="lite" />
                                                            </div>
                                                        ) : (
                                                            <div className="h-full flex items-center justify-center text-gray-600 italic text-xs">
                                                                Đang tải gợi ý...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Panel>
                                        </>
                                    )}
                                </PanelGroup>
                            </Panel>

                            <PanelResizeHandle className="h-2 bg-white/5 hover:bg-yellow-400/50 transition-colors cursor-row-resize flex items-center justify-center">
                                <div className="w-8 h-1 bg-white/20 rounded-full" />
                            </PanelResizeHandle>

                            <Panel defaultSize={40} minSize={20}>
                                <div className="h-full grid grid-cols-[3fr_7fr] gap-4 p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col h-full">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            Output thực tế
                                        </h3>
                                        <pre className="flex-1 font-mono text-sm text-gray-300 overflow-auto whitespace-pre-wrap relative bg-black/20 p-3 rounded-lg border border-white/5">
                                            {isEvaluating ? (
                                                <span className="text-yellow-400/50 italic animate-pulse">Running...</span>
                                            ) : (
                                                actualOutput || <span className="text-gray-600 italic">Chưa chạy code</span>
                                            )}
                                        </pre>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col h-full overflow-hidden">
                                        <h3 className="text-xs font-bold text-gray-400 cursor-default uppercase tracking-wider mb-3 flex flex-wrap justify-between items-center gap-2 shrink-0">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-2">
                                                    <AlertCircle size={14} className="text-yellow-400" />
                                                    AI nhận xét
                                                </span>

                                                <AiReportButton
                                                    interactionId={interactionId}
                                                    source="code-evaluation"
                                                    hideWhenUnavailable
                                                />

                                                {score !== null && score < 100 && (
                                                    <button
                                                        onClick={() => setShowSuggestions(!showSuggestions)}
                                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-black transition-all ring-1 animate-pulse
                                                            ${showSuggestions
                                                                ? "bg-blue-500 text-white ring-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                                : "bg-blue-500/10 text-blue-400 ring-blue-500/30 hover:bg-blue-500/20"}`}
                                                    >
                                                        <Lightbulb size={12} fill={showSuggestions ? "currentColor" : "none"} />
                                                        {showSuggestions ? "Đang hiện gợi ý" : "Xem gợi ý từ AI"}
                                                        <ChevronRight size={10} className={`transition-transform ${showSuggestions ? "rotate-90" : ""}`} />
                                                    </button>
                                                )}
                                            </div>

                                            {score !== null && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${score >= 80 ? "bg-green-500/20 text-green-400" : score >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                                                    ĐIỂM: {score}/100
                                                </span>
                                            )}
                                        </h3>

                                        <div className="flex-1 overflow-auto bg-black/20 rounded-lg border border-white/5 custom-scrollbar">
                                            {isEvaluating ? (
                                                <div className="h-full flex items-center gap-2 text-yellow-400/50 justify-center animate-pulse py-4">
                                                    <Loader2 size={16} className="animate-spin" /> AI đang chấm điểm...
                                                </div>
                                            ) : feedback ? (
                                                <div className="prose prose-sm prose-invert p-3 max-w-none prose-p:my-0 prose-p:leading-relaxed feedback-markdown">
                                                    <MarkdownRenderer content={feedback} mode="lite" />
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-600 italic text-xs py-4">
                                                    {problem.exerciseType === "fix_bug" ? "Sửa lỗi rồi nộp bài để nhận nhận xét từ AI" : "Nộp bài để nhận nhận xét từ AI"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </div>

            {isLoadingNextProblem && (
                <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center">
                    <div className="px-7 py-5 rounded-2xl bg-black/70 border border-white/15 shadow-2xl flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                        <span className="text-sm font-bold tracking-wide text-white/90">Đang chuyển sang bài tập mới...</span>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .skeleton-placeholder-highlight {
                    color: #60a5fa !important;
                    font-weight: 800;
                    background: rgba(96, 165, 250, 0.1);
                    border-bottom: 2px dashed #60a5fa;
                    border-radius: 2px;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s infinite ease-in-out;
                }
                .feedback-markdown p {
                    margin-top: 0 !important;
                    margin-bottom: 0.5rem !important;
                }
                .feedback-markdown p:last-child {
                    margin-bottom: 0 !important;
                }
                .feedback-markdown {
                    line-height: 1.6;
                }
            `}</style>
        </main>
    );
}
