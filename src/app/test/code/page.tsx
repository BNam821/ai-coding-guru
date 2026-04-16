"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor } from "@monaco-editor/react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Play, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { getRandomCodingProblem, getCodingProblemById, CodingProblem } from "@/lib/coding-problems-service";

export default function CodeGradingPage() {
    const router = useRouter();
    const [problem, setProblem] = useState<CodingProblem | null>(null);
    const [userCode, setUserCode] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);
    
    const [actualOutput, setActualOutput] = useState("");
    const [score, setScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState("");
    const [isExhausted, setIsExhausted] = useState(false);
    const [exhaustedMessage, setExhaustedMessage] = useState("");
    
    // Lưu instance của editor và decoration IDs
    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);

    const searchParams = useSearchParams();

    useEffect(() => {
        const loadProblem = async () => {
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
            
            // Smart Fetch
            try {
                const res = await fetch("/api/test/smart-problem");
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
        };
        loadProblem();
    }, [searchParams]);

    const handleEvaluate = async () => {
        if (!problem) return;
        setIsEvaluating(true);
        setActualOutput("");
        setScore(null);
        setFeedback("");

        try {
            const res = await fetch("/api/code-evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userCode,
                    problemId: problem.id,
                    problemObj: problem // Pass whole object to avoid DB lookup on logic layer if possible
                }),
            });
            const data = await res.json();
            setActualOutput(data.actualOutput || "");
            setScore(data.score ?? 0);
            setFeedback(data.feedback || "Không có phản hồi");
        } catch (error) {
            setFeedback("Có lỗi xảy ra khi chấm bài.");
        } finally {
            setIsEvaluating(false);
        }
    };

    // Hàm cập nhật vùng highlight cho "..."
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

    // Theo dõi thay đổi của userCode để cập nhật highlight
    useEffect(() => {
        if (editorRef.current) {
            updatePlaceholders(editorRef.current);
        }
    }, [userCode]);

    const handleNewProblem = () => {
        // Xóa trạng thái hiện tại
        setScore(null);
        setActualOutput("");
        setFeedback("");
        // Chuyển hướng về trang test/code không có ID để load bài ngẫu nhiên
        router.push("/test/code");
        // Force refresh nếu đang ở sẵn test/code không ID
        if (!searchParams.get("id")) {
            router.refresh();
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
                    {/* Nút Làm bài tập khác - Chỉ hiện khi hoàn thành 100 điểm */}
                    {score === 100 && (
                        <button 
                            onClick={handleNewProblem}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-bounce-slow"
                        >
                            <CheckCircle2 size={20} />
                            <span className="uppercase tracking-wider">Làm bài tập khác</span>
                        </button>
                    )}

                    <button 
                        onClick={handleEvaluate}
                        disabled={isEvaluating || score === 100}
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

                            {/* Samples Section */}
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

                    {/* Resizer */}
                    <PanelResizeHandle className="w-2 bg-white/5 hover:bg-yellow-400/50 transition-colors cursor-col-resize flex items-center justify-center">
                        <div className="h-8 w-1 bg-white/20 rounded-full" />
                    </PanelResizeHandle>

                    {/* Right Panel: Editor & I/O */}
                    <Panel defaultSize={65} minSize={30}>
                        <PanelGroup direction="vertical">
                            {/* Editor */}
                            <Panel defaultSize={60} minSize={20}>
                                <div className="h-full w-full">
                                    <Editor
                                        height="100%"
                                        language={problem.language}
                                        theme="vs-dark"
                                        value={userCode}
                                        onChange={(val) => setUserCode(val || "")}
                                        onMount={(editor, monaco) => {
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

                            {/* Horizontal Resizer */}
                            <PanelResizeHandle className="h-2 bg-white/5 hover:bg-yellow-400/50 transition-colors cursor-row-resize flex items-center justify-center">
                                <div className="w-8 h-1 bg-white/20 rounded-full" />
                            </PanelResizeHandle>

                            {/* I/O & Feedback Grids */}
                            <Panel defaultSize={40} minSize={20}>
                                <div className="h-full grid grid-cols-2 gap-4 p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                                    
                                    {/* Actual Output */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            Output Thực Tế
                                        </h3>
                                        <pre className="flex-1 font-mono text-sm text-gray-300 overflow-auto whitespace-pre-wrap relative">
                                            {isEvaluating ? (
                                                <span className="text-yellow-400/50 italic animate-pulse">Running...</span>
                                            ) : (
                                                actualOutput || <span className="text-gray-600 italic">Chưa chạy code</span>
                                            )}
                                        </pre>
                                    </div>

                                    {/* AI Feedback */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col overflow-hidden">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex flex-wrap justify-between items-center gap-2">
                                            <span>AI Nhận Xét</span>
                                            {score !== null && (
                                                <span className={`px-2 py-0.5 rounded text-xs ${score >= 80 ? 'bg-green-500/20 text-green-400' : score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    ĐIỂM: {score}/100
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex-1 text-sm text-gray-300 overflow-auto flex flex-col">
                                            {isEvaluating ? (
                                                <div className="flex items-center gap-2 text-yellow-400/50 my-auto justify-center animate-pulse">
                                                    <Loader2 size={16} className="animate-spin" /> AI đang đọc code...
                                                </div>
                                            ) : (
                                                feedback ? (
                                                    <div className="prose prose-sm prose-invert p-2 bg-black/20 rounded">
                                                        <MarkdownRenderer content={feedback} mode="safe" />
                                                    </div>
                                                ) : (
                                                    <div className="my-auto text-center text-gray-600 italic text-xs">
                                                        Nộp bài để nhận phản hồi từ AI
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    
                                </div>
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </div>
            
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
            `}</style>
        </main>
    );
}
