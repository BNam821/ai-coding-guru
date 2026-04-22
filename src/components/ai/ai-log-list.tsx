import {
    BrainCircuit,
    Clock3,
    Database,
    Flag,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import {
    getAiStatusLabel,
    getAiTaskLabel,
    type AiLogListItem,
} from "@/lib/ai-interactions";
import { GlassCard } from "@/components/ui/glass-card";
import { AiReportButton } from "@/components/ai/ai-report-button";

interface AiLogListProps {
    logs: AiLogListItem[];
    emptyTitle: string;
    emptyDescription: string;
    isAdmin: boolean;
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(value));
}

function formatDuration(value: number | null) {
    if (typeof value !== "number") {
        return "Khong ro";
    }

    return `${value} ms`;
}

function renderJson(value: unknown) {
    if (value === null || value === undefined) {
        return "{}";
    }

    if (typeof value === "string") {
        return value;
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function hasObjectContent(value: Record<string, unknown>) {
    return Object.keys(value).length > 0;
}

export function AiLogList({
    logs,
    emptyTitle,
    emptyDescription,
    isAdmin,
}: AiLogListProps) {
    if (logs.length === 0) {
        return (
            <GlassCard className="border-white/10 p-10 text-center text-white/70" hoverEffect={false}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50">
                    <BrainCircuit size={28} />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-white">{emptyTitle}</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/55">{emptyDescription}</p>
            </GlassCard>
        );
    }

    return (
        <div className="grid gap-4">
            {logs.map((log) => {
                const isError = log.status === "error";
                const isReported = log.report.isReported;

                return (
                    <GlassCard
                        key={log.id}
                        className={`border p-6 ${isError ? "border-rose-400/20 bg-rose-500/5" : "border-white/10"}`}
                        hoverEffect={false}
                    >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100">
                                        <BrainCircuit size={13} />
                                        {getAiTaskLabel(log.taskType)}
                                    </span>
                                    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                                        isError
                                            ? "border-rose-400/25 bg-rose-500/10 text-rose-100"
                                            : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                                    }`}>
                                        {getAiStatusLabel(log.status)}
                                    </span>
                                    {log.promptId && (
                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/75">
                                            {log.promptId}
                                        </span>
                                    )}
                                    {isAdmin && log.username && (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-[11px] font-semibold text-yellow-100">
                                            <ShieldCheck size={13} />
                                            {log.username}
                                        </span>
                                    )}
                                    {isReported && (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-100">
                                            <Flag size={13} />
                                            Đã báo cáo
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-white">{log.endpoint}</h3>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/55">
                                        <span className="inline-flex items-center gap-2">
                                            <Clock3 size={14} />
                                            {formatDateTime(log.createdAt)}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <Sparkles size={14} />
                                            {log.modelProvider} / {log.modelName}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <Database size={14} />
                                            {formatDuration(log.durationMs)}
                                        </span>
                                    </div>
                                </div>

                                {log.errorMessage ? (
                                    <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                        {log.errorMessage}
                                    </div>
                                ) : null}

                                {isReported ? (
                                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                        Nội dung này đã được báo cáo
                                        {log.report.reportedBy ? ` bởi ${log.report.reportedBy}` : ""}.
                                        {log.report.reportedAt ? ` Thời điểm: ${formatDateTime(log.report.reportedAt)}.` : ""}
                                        {log.report.source ? ` Nguồn gửi: ${log.report.source}.` : ""}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {!isAdmin ? (
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/62">
                                        Báo cáo nội dung AI
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-white/55">
                                        Nếu bạn thấy nội dung AI có vấn đề, hãy gửi báo cáo để đội ngũ kiểm tra lại log này.
                                    </p>
                                    <AiReportButton
                                        className="mt-4"
                                        interactionId={log.id}
                                        source="history-ai"
                                        initialReported={isReported}
                                    />
                                </div>
                            ) : null}

                            <details className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
                                    Output AI
                                </summary>
                                <div className="mt-4 space-y-4">
                                    {log.responsePayload !== null && log.responsePayload !== undefined ? (
                                        <pre className="max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/75">
                                            {renderJson(log.responsePayload)}
                                        </pre>
                                    ) : null}
                                    {log.responseText ? (
                                        <pre className="max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/75">
                                            {log.responseText}
                                        </pre>
                                    ) : null}
                                    {log.responsePayload === null && !log.responseText ? (
                                        <p className="text-sm text-white/55">Chua co du lieu output de hien thi.</p>
                                    ) : null}
                                </div>
                            </details>

                            {hasObjectContent(log.metadata) && (
                                <details className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-white/80">
                                        Metadata
                                    </summary>
                                    <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/75">
                                        {renderJson(log.metadata)}
                                    </pre>
                                </details>
                            )}

                            {isAdmin && "requestPayload" in log && (
                                <details className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-white/80">
                                        Request Payload
                                    </summary>
                                    <pre className="mt-4 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/75">
                                        {renderJson(log.requestPayload)}
                                    </pre>
                                </details>
                            )}

                            {isAdmin && "promptText" in log && log.promptText && (
                                <details className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
                                    <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-amber-100">
                                        Prompt Text
                                    </summary>
                                    <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/80">
                                        {log.promptText}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </GlassCard>
                );
            })}
        </div>
    );
}
