import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BrainCircuit, Filter, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import {
    AI_INTERACTION_STATUSES,
    AI_TASK_TYPES,
    getAiStatusLabel,
    getAiTaskLabel,
    listAiInteractions,
    parseAiInteractionStatus,
    parseAiTaskType,
    type AiAdminLogListItem,
} from "@/lib/ai-interactions";
import { AiLogCleanupButton } from "@/components/ai/ai-log-cleanup-button";
import { AiLogList } from "@/components/ai/ai-log-list";
import { GlassCard } from "@/components/ui/glass-card";

export const dynamic = "force-dynamic";

interface DashboardAiLogsPageProps {
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
    return query ? `/dashboard/ai-logs?${query}` : "/dashboard/ai-logs";
}

export default async function DashboardAiLogsPage({ searchParams }: DashboardAiLogsPageProps) {
    const session = await getSession();

    if (!session?.username) {
        redirect("/login");
    }

    if (session.role !== "admin") {
        redirect("/dashboard/account");
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const usernameValue = getSingleValue(resolvedSearchParams?.username)?.trim() || "";
    const taskTypeValue = getSingleValue(resolvedSearchParams?.taskType);
    const statusValue = getSingleValue(resolvedSearchParams?.status);
    const fromValue = parseDateValue(getSingleValue(resolvedSearchParams?.from));
    const toValue = parseDateValue(getSingleValue(resolvedSearchParams?.to));
    const page = parsePage(getSingleValue(resolvedSearchParams?.page));
    const currentSearchParams = new URLSearchParams();

    if (usernameValue) currentSearchParams.set("username", usernameValue);
    if (taskTypeValue) currentSearchParams.set("taskType", taskTypeValue);
    if (statusValue) currentSearchParams.set("status", statusValue);
    if (fromValue) currentSearchParams.set("from", fromValue);
    if (toValue) currentSearchParams.set("to", toValue);

    const result = await listAiInteractions<AiAdminLogListItem>({
        viewerRole: "admin",
        viewerUsername: session.username,
        username: usernameValue || undefined,
        taskType: parseAiTaskType(taskTypeValue),
        status: parseAiInteractionStatus(statusValue),
        from: fromValue || undefined,
        to: toValue || undefined,
        page,
    });

    return (
        <main className="min-h-screen px-4 pb-20 pt-32 relative z-10">
            <div className="absolute inset-0 bg-deep-space -z-20" />
            <div className="absolute top-0 right-0 h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-[140px] -z-10" />
            <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[140px] -z-10" />

            <div className="mx-auto max-w-6xl space-y-8">
                <div className="space-y-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Quay lai dashboard
                    </Link>

                    <GlassCard className="border-white/10 p-6" hoverEffect={false}>
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-100">
                            <ShieldCheck size={14} />
                            Admin AI Logs
                        </div>
                        <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                            Quan tri AI exchange logs
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/60">
                            Trang nay hien thi full exchange phia server, bao gom prompt, payload yeu cau, output raw va thong tin loi.
                        </p>
                        <div className="mt-5">
                            <AiLogCleanupButton />
                        </div>
                    </GlassCard>
                </div>

                <GlassCard className="border-white/10 p-6" hoverEffect={false}>
                    <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                        <label className="space-y-2 text-sm text-white/70">
                            <span className="inline-flex items-center gap-2 font-semibold">
                                <Filter size={14} />
                                Username
                            </span>
                            <input
                                type="text"
                                name="username"
                                defaultValue={usernameValue}
                                placeholder="vi du: campha8"
                                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-white/70">
                            <span className="font-semibold">Loai tac vu</span>
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
                                className="inline-flex h-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-300/15"
                            >
                                Ap dung
                            </button>
                            <Link
                                href="/dashboard/ai-logs"
                                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                            >
                                Xoa loc
                            </Link>
                        </div>
                    </form>
                </GlassCard>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
                    <p>
                        Tim thay <span className="font-semibold text-white">{result.totalCount}</span> ban ghi.
                    </p>
                    <p className="inline-flex items-center gap-2">
                        <BrainCircuit size={14} />
                        Trang {result.page} / {Math.max(result.totalPages, 1)}
                    </p>
                </div>

                <AiLogList
                    logs={result.logs}
                    isAdmin
                    emptyTitle="Chua co AI log nao"
                    emptyDescription="Khi he thong AI duoc goi, full exchange se duoc luu tai day de theo doi va debug."
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
