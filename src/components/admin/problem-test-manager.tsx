"use client";

import { useCallback, useEffect, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    FileCode2,
    Loader2,
    Sparkles,
    TestTubeDiagonal,
    XCircle,
} from "lucide-react";

interface CodingProblemTestCaseItem {
    id: string;
    kind: "sample" | "generated_draft" | "official";
    inputText: string;
    expectedOutput: string;
    isHidden: boolean;
    source: "manual" | "ai" | "solution_code";
    position: number;
    status: "draft" | "approved" | "rejected";
    rationale: string | null;
}

interface ProblemTestsResponse {
    problem: {
        id: string;
        title: string;
        testVolumeClass: "few" | "many" | null;
        testGenerationStatus: "idle" | "generating" | "ready" | "failed";
        testGenerationError: string | null;
        judge0LanguageId: number | null;
        judge0TimeLimitMs: number;
        judge0MemoryLimitKb: number;
    };
    sampleTests: CodingProblemTestCaseItem[];
    generatedDraftTests: CodingProblemTestCaseItem[];
    officialTests: CodingProblemTestCaseItem[];
}

interface ProblemTestManagerProps {
    problemId: string;
}

function getGenerationStatusLabel(status: ProblemTestsResponse["problem"]["testGenerationStatus"]) {
    switch (status) {
        case "generating":
            return "Đang sinh test";
        case "ready":
            return "Sẵn sàng";
        case "failed":
            return "Sinh test lỗi";
        default:
            return "Chưa sinh test";
    }
}

export function ProblemTestManager({ problemId }: ProblemTestManagerProps) {
    const [data, setData] = useState<ProblemTestsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionState, setActionState] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/problems/${problemId}/tests`, {
                cache: "no-store",
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error || "Không thể tải dữ liệu test case.");
            }

            setData(payload as ProblemTestsResponse);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu test case.");
        } finally {
            setIsLoading(false);
        }
    }, [problemId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleAction = useCallback(async (type: "generate" | "approve" | "reject", ids?: string[]) => {
        setActionState(type);
        setError(null);

        try {
            const response = await fetch(
                type === "generate"
                    ? `/api/admin/problems/${problemId}/generate-tests`
                    : `/api/admin/problems/${problemId}/tests/${type}`,
                {
                    method: "POST",
                    headers: type === "generate"
                        ? undefined
                        : {
                            "Content-Type": "application/json",
                        },
                    body: type === "generate" ? undefined : JSON.stringify({ ids }),
                },
            );
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error || "Không thể cập nhật test case.");
            }

            await loadData();
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : "Không thể cập nhật test case.");
        } finally {
            setActionState(null);
        }
    }, [loadData, problemId]);

    const renderTestCard = useCallback((testCase: CodingProblemTestCaseItem, mode: "sample" | "draft" | "official") => (
        <article
            key={testCase.id}
            className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                        Test #{testCase.position + 1}
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">
                        {testCase.isHidden ? "Hidden" : "Public"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        {testCase.source === "ai" ? "AI sinh" : testCase.source === "manual" ? "Admin nhập" : "Solution"}
                    </span>
                </div>

                {mode === "draft" ? (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => void handleAction("approve", [testCase.id])}
                            disabled={actionState !== null}
                            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Duyệt test này
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleAction("reject", [testCase.id])}
                            disabled={actionState !== null}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-100 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <XCircle className="h-4 w-4" />
                            Loại test này
                        </button>
                    </div>
                ) : null}
            </div>

            {testCase.rationale ? (
                <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/70">
                    {testCase.rationale}
                </p>
            ) : null}

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Input</p>
                    <pre className="min-h-[120px] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-6 text-white/80">
                        {testCase.inputText || "(Rỗng)"}
                    </pre>
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Expected output</p>
                    <pre className="min-h-[120px] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-6 text-white/80">
                        {testCase.expectedOutput || "(Rỗng)"}
                    </pre>
                </div>
            </div>
        </article>
    ), [actionState, handleAction]);

    return (
        <section className="mt-12 rounded-[32px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                        <TestTubeDiagonal className="h-4 w-4" />
                        Judge0 + AI Test Case
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
                        Quản lý bộ test cho bài tập
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/65 md:text-base">
                        AI sẽ phân loại bài, sinh test nháp từ đề bài và sample, sau đó hệ thống dùng solution code để tạo expected output thật trước khi bạn duyệt.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                    <button
                        type="button"
                        onClick={() => void handleAction("generate")}
                        disabled={isLoading || actionState !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/15 px-5 py-3 text-sm font-black text-yellow-100 transition-colors hover:bg-yellow-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {actionState === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        AI tạo test case
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleAction("approve", data?.generatedDraftTests.filter((item) => item.status === "draft").map((item) => item.id))}
                        disabled={!data?.generatedDraftTests.some((item) => item.status === "draft") || actionState !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/12 px-5 py-3 text-sm font-black text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {actionState === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Duyệt toàn bộ draft
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleAction("reject", data?.generatedDraftTests.filter((item) => item.status === "draft").map((item) => item.id))}
                        disabled={!data?.generatedDraftTests.some((item) => item.status === "draft") || actionState !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/12 px-5 py-3 text-sm font-black text-rose-100 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                    >
                        {actionState === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Loại toàn bộ draft hiện tại
                    </button>
                </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Trạng thái sinh test</p>
                    <p className="mt-3 text-lg font-black text-white">
                        {data ? getGenerationStatusLabel(data.problem.testGenerationStatus) : "Đang tải"}
                    </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Phân loại số lượng test</p>
                    <p className="mt-3 text-lg font-black text-white">
                        {data?.problem.testVolumeClass === "many" ? "Nhiều test (8)" : data?.problem.testVolumeClass === "few" ? "Ít test (3)" : "Chưa xác định"}
                    </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Judge0 language id</p>
                    <p className="mt-3 text-lg font-black text-white">
                        {data?.problem.judge0LanguageId ?? "Mặc định"}
                    </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Giới hạn chạy</p>
                    <p className="mt-3 text-lg font-black text-white">
                        {data ? `${data.problem.judge0TimeLimitMs} ms / ${data.problem.judge0MemoryLimitKb} KB` : "Đang tải"}
                    </p>
                </div>
            </div>

            {error ? (
                <div className="mt-6 flex items-start gap-3 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm leading-6">{error}</p>
                </div>
            ) : null}

            {data?.problem.testGenerationError ? (
                <div className="mt-6 flex items-start gap-3 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 text-amber-100">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm leading-6">{data.problem.testGenerationError}</p>
                </div>
            ) : null}

            {isLoading ? (
                <div className="mt-8 flex items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-white/60">
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Đang tải danh sách test case...
                </div>
            ) : (
                <div className="mt-8 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-2 text-blue-200">
                                <FileCode2 className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Sample seed</h3>
                                <p className="text-sm text-white/55">Được đồng bộ trực tiếp từ sample input/output của bài tập.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {data?.sampleTests.length ? data.sampleTests.map((testCase) => renderTestCard(testCase, "sample")) : (
                                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/45">
                                    Chưa có sample test được đồng bộ.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-2 text-yellow-100">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Draft AI sinh ra</h3>
                                <p className="text-sm text-white/55">AI tạo input, solution code tạo expected output, admin duyệt trước khi dùng thật.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {data?.generatedDraftTests.length ? data.generatedDraftTests.map((testCase) => renderTestCard(testCase, "draft")) : (
                                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/45">
                                    Chưa có draft test nào. Hãy bấm “AI tạo test case”.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-2 text-emerald-100">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Official tests đang dùng để chấm</h3>
                                <p className="text-sm text-white/55">Đây là bộ test Judge0 sẽ dùng khi học sinh nộp bài.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {data?.officialTests.length ? data.officialTests.map((testCase) => renderTestCard(testCase, "official")) : (
                                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/45">
                                    Chưa có official test nào được duyệt.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}
