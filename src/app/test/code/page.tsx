"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor } from "@monaco-editor/react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { TestMode, TestModeToggle } from "@/components/test/test-mode-toggle";
import { Play, CheckCircle2, XCircle, AlertCircle, Loader2, Lightbulb, ChevronRight, X } from "lucide-react";
import { getCodingProblemById, CodingProblem } from "@/lib/coding-problems-service";

export default function CodeGradingPage() {
    const router = useRouter();
    const [mode, setMode] = useState<TestMode>(null);
    const [problem, setProblem] = useState<CodingProblem | null>(null);
    const [userCode, setUserCode] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);
    
    const [actualOutput, setActualOutput] = useState("");
    const [score, setScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState("");
    const [suggestion, setSuggestion] = useState("");
    const [isExhausted, setIsExhausted] = useState(false);
    const [exhaustedMessage, setExhaustedMessage] = useState("");
    const [isLoadingNextProblem, setIsLoadingNextProblem] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);
    const searchParams = useSearchParams();

    const loadProblem = useCallback(async (options?: { excludeProblemId?: string }) => {
        const specificId = searchParams.get("id");
        let p: CodingProblem | null = null;
        
        if (specificId) {
            p = await getCodingProblemById(specificId);
            if (p) {
                setProblem(p);
                setUserCode(p.skeleton_code);
                setIsExhausted(false);
                return;
            }
        }
        
        try {
            const smartProblemUrl = options?.excludeProblemId
                ? `/api/test/smart-problem?excludeProblemId=${encodeURIComponent(options.excludeProblemId)}`
                : "/api/test/smart-problem";
            const res = await fetch(smartProblemUrl, { cache: "no-store" });
            const data = await res.json();
            
            if (data.status === 'exhausted') {
                setIsExhausted(true);
                setExhaustedMessage(data.message);
                setProblem(null);
            } else if (data.problem) {
                setProblem(data.problem);
                setUserCode(data.problem.skeleton_code);
                setIsExhausted(false);
            }
        } catch (err) {
            console.error("Error smart fetching:", err);
        }
    }, [searchParams]);

    useEffect(() => {
        if (mode !== "auto") {
            return;
        }

        loadProblem();
    }, [loadProblem, mode]);

    useEffect(() => {
        if (editorRef.current) {
            updatePlaceholders(editorRef.current);
        }
    }, [userCode]);

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

                        {mode === "custom" ? (
                            <div className="rounded-2xl border border-gray-500/20 bg-gray-500/10 p-5 text-center">
                                <h2 className="text-lg font-bold text-white">Kiểm tra tự chọn đang được hoàn thiện</h2>
                                <p className="mt-2 text-sm leading-6 text-gray-400">
                                    Chế độ này sẽ cho phép bạn tự chọn dạng bài code trước khi hệ thống tải bài tập.
                                    Hiện tại bạn có thể dùng <span className="font-semibold text-yellow-200">Kiểm tra tự động</span> để bắt đầu ngay.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-gray-400">
                                Chọn một chế độ để tiếp tục. Khi bấm <span className="font-semibold text-yellow-200">Kiểm tra tự động</span>,
                                hệ thống mới bắt đầu tìm bài tập phù hợp cho bạn.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    const handleEvaluate = async () => {
        if (!problem) return;
        setIsEvaluating(true);
        setActualOutput("");
        setScore(null);
        setFeedback("");
        setSuggestion("");
        setShowSuggestions(false);

        try {
            const res = await fetch("/api/code-evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userCode,
                    problemId: problem.id,
                    problemObj: problem
                }),
            });
            const data = await res.json();
            setActualOutput(data.actualOutput || "");
            setScore(data.score ?? 0);
            setFeedback(data.feedback || "Không có phản hồi");
            setSuggestion(data.suggestion || "");
        } catch (error) {
            setFeedback("Có lỗi xảy ra khi chấm bài.");
        } finally {
            setIsEvaluating(false);
        }
    };

    const updatePlaceholders = (editor: any) => {
        const model = editor.getModel();
        if (!model) return;

        const matches = model.findMatches("...", true, false, true, null, true);
        const newDecorations = matches.map((match: any) => ({
            range: match.range,
            options: { 
                inlineClassName: 'skeleton-placeholder-highlight',
                hoverMessage: { value: 'Thay thế bằng code của bạn' }
            }
        }));

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    };

    const handleNewProblem = async () => {
        setScore(null);
        setActualOutput("");
        setFeedback("");
        setSuggestion("");
        setShowSuggestions(false);
        setIsLoadingNextProblem(true);
        
        try {
            if (searchParams.get("id")) {
                router.push("/test/code");
            } else {
                await loadProblem({ excludeProblemId: problem?.id });
            }
        } finally {
            setIsLoadingNextProblem(false);
        }
    };

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
            {/* Header / Toolbar */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-yellow-400/20 text-yellow-300 text-xs font-black tracking-widest uppercase rounded ring-1 ring-yellow-400/50">
                        {problem.language === "cpp" ? "C++" : problem.language.toUpperCase()}
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

            {/* Workspace Area */}
            <div className="flex-1 min-h-0">
                <PanelGroup direction="horizontal">
                    {/* Left Panel: Description */}
                    <Panel defaultSize={35} minSize={20}>
                        <div className="h-full overflow-y-auto p-6 custom-scrollbar bg-black/40 backdrop-blur-sm border-r border-white/10">
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

                    {/* Right Panel: Editor & I/O */}
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
                                    
                                    {/* Actual Output */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col h-full">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            Output Thực Tế
                                        </h3>
                                        <pre className="flex-1 font-mono text-sm text-gray-300 overflow-auto whitespace-pre-wrap relative bg-black/20 p-3 rounded-lg border border-white/5">
                                            {isEvaluating ? (
                                                <span className="text-yellow-400/50 italic animate-pulse">Running...</span>
                                            ) : (
                                                actualOutput || <span className="text-gray-600 italic">Chưa chạy code</span>
                                            )}
                                        </pre>
                                    </div>

                                    {/* AI Review Column (Expanded) */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col h-full overflow-hidden">
                                        <h3 className="text-xs font-bold text-gray-400 cursor-default uppercase tracking-wider mb-3 flex flex-wrap justify-between items-center gap-2 shrink-0">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-2">
                                                    <AlertCircle size={14} className="text-yellow-400" />
                                                    AI Nhận Xét
                                                </span>
                                                
                                                {/* Nút Xem gợi ý - Chỉ hiện khi score < 100 */}
                                                {score !== null && score < 100 && (
                                                    <button 
                                                        onClick={() => setShowSuggestions(!showSuggestions)}
                                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-black transition-all ring-1 animate-pulse
                                                            ${showSuggestions 
                                                                ? 'bg-blue-500 text-white ring-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                                                : 'bg-blue-500/10 text-blue-400 ring-blue-500/30 hover:bg-blue-500/20'}`}
                                                    >
                                                        <Lightbulb size={12} fill={showSuggestions ? "currentColor" : "none"} />
                                                        {showSuggestions ? "Đang hiện gợi ý" : "Xem gợi ý từ AI"}
                                                        <ChevronRight size={10} className={`transition-transform ${showSuggestions ? 'rotate-90' : ''}`} />
                                                    </button>
                                                )}
                                            </div>

                                            {score !== null && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${score >= 80 ? 'bg-green-500/20 text-green-400' : score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
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
                                                    Nộp bài để nhận nhận xét từ AI
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
                /* Đảm bảo baseline của chữ không bị cắt */
                .feedback-markdown {
                    line-height: 1.6;
                }
            `}</style>
        </main>
    );
}
