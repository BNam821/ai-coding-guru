import Link from "next/link";
import { BrainCircuit, ArrowLeft, Filter, Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth";
import {
    AI_INTERACTION_STATUSES,
    AI_TASK_TYPES,
    getAiStatusLabel,
    getAiTaskLabel,
    listAiInteractions,
    parseAiInteractionStatus,
    parseAiTaskType,
    type AiUserLogListItem,
} from "@/lib/ai-interactions";
import { AiLogList } from "@/components/ai/ai-log-list";
import { GlassCard } from "@/components/ui/glass-card";

export const dynamic = "force-dynamic";

interface HistoryAiPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function parseDateValue(value: string | undefined) {
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function buildPageHref(params: URLSearchParams, page: number) {
    const nextParams = new URLSearchParams(params);

    if (page <= 1) {
        nextParams.delete("page");
    } else {
        nextParams.set("page", String(page));
    }

    const query = nextParams.toString();
    return query ? `/history/ai?${query}` : "/history/ai";
}

export default async function HistoryAiPage({ searchParams }: HistoryAiPageProps) {
    const session = await getSession();
    const resolvedSearchParams = searchParams ? await searchParams : undefined;

    const taskTypeValue = getSingleValue(resolvedSearchParams?.taskType);
    const statusValue = getSingleValue(resolvedSearchParams?.status);
    const fromValue = parseDateValue(getSingleValue(resolvedSearchParams?.from));
    const toValue = parseDateValue(getSingleValue(resolvedSearchParams?.to));
    const page = parsePage(getSingleValue(resolvedSearchParams?.page));
    const currentSearchParams = new URLSearchParams();

    if (taskTypeValue) currentSearchParams.set("taskType", taskTypeValue);
    if (statusValue) currentSearchParams.set("status", statusValue);
    if (fromValue) currentSearchParams.set("from", fromValue);
    if (toValue) currentSearchParams.set("to", toValue);

    if (!session?.username) {
        return (
            <main className="min-h-screen px-4 pb-20 pt-32 relative z-10">
                <div className="container mx-auto max-w-4xl">
                    <GlassCard className="border-white/10 p-10 text-center" hoverEffect={false}>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70">
                            <BrainCircuit size={30} />
                        </div>
                        <h1 className="mt-6 text-3xl font-bold text-white">Dang nhap de xem lich su AI</h1>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60">
                            Trang nay luu cac ket qua AI da tra ve cho tai khoan cua ban trong 30 ngay gan day.
                        </p>
                        <Link
                            href="/dashboard/account"
                            className="mt-6 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15"
                        >
                            Mo trang dang nhap
                        </Link>
                    </GlassCard>
                </div>
            </main>
        );
    }

    const result = await listAiInteractions<AiUserLogListItem>({
        viewerRole: "user",
        viewerUsername: session.username,
        taskType: parseAiTaskType(taskTypeValue),
        status: parseAiInteractionStatus(statusValue),
        from: fromValue || undefined,
        to: toValue || undefined,
        page,
    });

    return (
        <main className="min-h-screen px-4 pb-20 pt-32 relative z-10">
            <div className="absolute inset-0 bg-deep-space -z-20" />
            <div className="absolute top-0 right-0 h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-yellow-400/10 blur-[140px] -z-10" />

            <div className="mx-auto max-w-6xl space-y-8">
                <div className="space-y-4">
                    <Link
                        href="/history"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Quay lai lich su hoc tap
                    </Link>

                    <GlassCard className="border-white/10 p-6" hoverEffect={false}>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                            <BrainCircuit size={14} />
                            AI History
                        </div>
                        <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                            Lich su phan hoi tu AI
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/60">
                            Ban dang xem phien ban an toan cua log AI. Chi output, metadata va trang thai duoc hien thi,
                            prompt noi bo se chi danh cho admin.
                        </p>
                    </GlassCard>
                </div>

                <GlassCard className="border-white/10 p-6" hoverEffect={false}>
                    <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <label className="space-y-2 text-sm text-white/70">
                            <span className="inline-flex items-center gap-2 font-semibold">
                                <Filter size={14} />
                                Loai tac vu
                            </span>
                            <select
                                name="taskType"
                                defaultValue={taskTypeValue || ""}
                                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
                            >
                                <option value="">Tat ca</option>
                                {AI_TASK_TYPES.map((taskType) => (
                                    <option key={taskType} value={taskType}>
                                        {getAiTaskLabel(taskType)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2 text-sm text-white/70">
                            <span className="font-semibold">Trang thai</span>
                            <select
                                name="status"
                                defaultValue={statusValue || ""}
                                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
                            >
                                <option value="">Tat ca</option>
                                {AI_INTERACTION_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {getAiStatusLabel(status)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2 text-sm text-white/70">
                            <span className="font-semibold">Tu ngay</span>
                            <input
                                type="date"
                                name="from"
                                defaultValue={fromValue}
                                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-white/70">
                            <span className="font-semibold">Den ngay</span>
                            <input
                                type="date"
                                name="to"
                                defaultValue={toValue}
                                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
                            />
                        </label>

                        <div className="flex items-end gap-3">
                            <button
                                type="submit"
                                className="inline-flex h-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15"
                            >
                                Ap dung
                            </button>
                            <Link
                                href="/history/ai"
                                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                            >
                                Xoa loc
                            </Link>
                        </div>
                    </form>
                </GlassCard>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
                    <p>
                        Tim thay <span className="font-semibold text-white">{result.totalCount}</span> ban ghi trong 30 ngay gan day.
                    </p>
                    <p className="inline-flex items-center gap-2">
                        <Sparkles size={14} />
                        Trang {result.page} / {Math.max(result.totalPages, 1)}
                    </p>
                </div>

                <AiLogList
                    logs={result.logs}
                    isAdmin={false}
                    emptyTitle="Chua co AI log nao"
                    emptyDescription="Khi ban su dung tinh nang tao cau hoi, tao quiz hoac cham code AI, lich su se xuat hien tai day."
                />

                {result.totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3">
                        <Link
                            href={buildPageHref(currentSearchParams, Math.max(1, result.page - 1))}
                            aria-disabled={result.page <= 1}
                            className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${
                                result.page <= 1
                                    ? "pointer-events-none border-white/10 bg-white/5 text-white/35"
                                    : "border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
                            }`}
                        >
                            Trang truoc
                        </Link>
                        <Link
                            href={buildPageHref(currentSearchParams, Math.min(result.totalPages, result.page + 1))}
                            aria-disabled={result.page >= result.totalPages}
                            className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${
                                result.page >= result.totalPages
                                    ? "pointer-events-none border-white/10 bg-white/5 text-white/35"
                                    : "border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
                            }`}
                        >
                            Trang sau
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
