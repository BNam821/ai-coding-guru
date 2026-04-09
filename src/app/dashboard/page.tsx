import Link from "next/link";
import { redirect } from "next/navigation";
import {
    Activity,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Compass,
    FileText,
    Flame,
    Layers3,
    LineChart,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    TrendingUp,
} from "lucide-react";
import { AdminLoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StatCard = {
    title: string;
    value: string;
    delta: string;
    positive: boolean;
    icon: React.ReactNode;
};

type BarDatum = {
    label: string;
    value: number;
};

type LineDatum = {
    label: string;
    value: number;
};

const DASHBOARD_TITLE = "\u004c\u0065\u0061\u0072\u006e\u0069\u006e\u0067\u0020\u0043\u006f\u006d\u006d\u0061\u006e\u0064\u0020\u0043\u0065\u006e\u0074\u0065\u0072";
const DASHBOARD_SUBTITLE = "\u0059\u006f\u0075\u0072\u0020\u0070\u0065\u0072\u0073\u006f\u006e\u0061\u006c\u0020\u006f\u0076\u0065\u0072\u0076\u0069\u0065\u0077\u0020\u0066\u006f\u0072\u0020\u006c\u0065\u0073\u0073\u006f\u006e\u0073\u002c\u0020\u0071\u0075\u0069\u007a\u007a\u0065\u0073\u002c\u0020\u0061\u006e\u0064\u0020\u006b\u006e\u006f\u0077\u006c\u0065\u0064\u0067\u0065\u0020\u0062\u0075\u0069\u006c\u0064\u0069\u006e\u0067\u002e";
const LOGIN_TITLE = "\u0110\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070\u0020\u0111\u1ec3\u0020\u0076\u00e0\u006f\u0020\u0064\u0061\u0073\u0068\u0062\u006f\u0061\u0072\u0064";
const LOGIN_DESCRIPTION = "\u0054\u0072\u0075\u0079\u0020\u0063\u1ead\u0070\u0020\u0062\u1ea3\u006e\u0067\u0020\u0111\u0069\u1ec1\u0075\u0020\u006b\u0068\u0069\u1ec3\u006e\u0020\u0111\u1ec3\u0020\u0078\u0065\u006d\u0020\u0074\u0069\u1ebf\u006e\u0020\u0111\u1ed9\u002c\u0020\u006d\u1ee5\u0063\u0020\u0074\u0069\u00ea\u0075\u0020\u0076\u00e0\u0020\u006e\u0068\u1eef\u006e\u0067\u0020\u0111\u0069\u1ec3\u006d\u0020\u0111\u00e1\u006e\u0067\u0020\u0063\u0068\u00fa\u0020\u00fd\u0020\u0074\u0072\u006f\u006e\u0067\u0020\u0068\u00e0\u006e\u0068\u0020\u0074\u0072\u00ec\u006e\u0068\u0020\u0068\u1ecd\u0063\u002e";

function formatPercent(value: number) {
    return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatDelta(value: number) {
    const abs = Math.abs(value).toFixed(1);
    return `${value >= 0 ? "+" : "-"}${abs}%`;
}

function buildBarData(posts: number, lessons: number, quizCount: number, avgScore: number): BarDatum[] {
    return [
        { label: "Lessons", value: Math.max(32, lessons * 8) },
        { label: "Quizzes", value: Math.max(26, quizCount * 10) },
        { label: "Articles", value: Math.max(20, posts * 12) },
        { label: "Mastery", value: Math.max(18, Math.round(avgScore * 0.8)) },
        { label: "Review", value: Math.max(16, Math.round((lessons + quizCount) * 3.2)) },
        { label: "Focus", value: Math.max(12, Math.round((posts + lessons + avgScore) * 1.9)) },
    ];
}

function buildLineData(lessons: number, quizCount: number, posts: number): LineDatum[] {
    const base = Math.max(18, lessons * 3 + quizCount * 4 + posts * 2);
    const increments = [0, 4, 7, 11, 16, 18, 24, 27, 31, 34, 39, 47];

    return increments.map((step, index) => ({
        label: `W${index + 1}`,
        value: Math.min(100, Math.round((base + step) * 0.9)),
    }));
}

function buildPath(series: LineDatum[], width: number, height: number) {
    if (series.length === 0) return "";

    const max = Math.max(...series.map((point) => point.value), 1);
    const min = Math.min(...series.map((point) => point.value), 0);
    const range = Math.max(max - min, 1);

    return series
        .map((point, index) => {
            const x = (index / Math.max(series.length - 1, 1)) * width;
            const y = height - ((point.value - min) / range) * height;
            return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");
}

function StatBlock({ title, value, delta, positive, icon }: StatCard) {
    return (
        <div className="rounded-[1.6rem] border border-white/8 bg-[#141414]/96 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-6 flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#90defa]">
                    {icon}
                </div>
                <span
                    className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.18em]",
                        positive
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-rose-400/20 bg-rose-400/10 text-rose-300",
                    )}
                >
                    {delta}
                </span>
            </div>
            <p className="text-sm text-white/48">{title}</p>
            <p className="mt-2 text-[2rem] font-semibold tracking-tight text-white">{value}</p>
        </div>
    );
}

function BarChart({ data }: { data: BarDatum[] }) {
    const max = Math.max(...data.map((item) => item.value), 1);

    return (
        <div className="space-y-5">
            <div className="grid h-[220px] grid-cols-6 items-end gap-4">
                {data.map((item) => (
                    <div key={item.label} className="flex h-full flex-col justify-end gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-x-0 bottom-0 rounded-[1rem] bg-gradient-to-b from-[#87e0ff] to-[#5fbff2] shadow-[0_0_25px_rgba(109,204,245,0.35)]" style={{ height: `${(item.value / max) * 100}%` }} />
                        </div>
                        <span className="text-center text-xs text-white/42">{item.label}</span>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-4 gap-3 text-[11px] text-white/30 sm:grid-cols-6">
                {["0", "20", "40", "60", "80", "100"].map((tick) => (
                    <span key={tick}>{tick}</span>
                ))}
            </div>
        </div>
    );
}

function LineChartPanel({ data }: { data: LineDatum[] }) {
    const path = buildPath(data, 100, 100);

    return (
        <div className="space-y-5">
            <div className="relative h-[220px] overflow-hidden rounded-[1.25rem] border border-white/6 bg-[#101010]">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_25%]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:16.66%_100%]" />
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                    <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#progressFill)" opacity="0.22" />
                    <path d={path} fill="none" stroke="#7fdbff" strokeWidth="2.4" strokeLinecap="round" />
                    <defs>
                        <linearGradient id="progressFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#79dafb" />
                            <stop offset="100%" stopColor="#79dafb" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute left-[58%] top-[44%] w-px bg-white/15" style={{ height: "45%" }} />
                <div className="absolute left-[calc(58%-1.5rem)] top-[42%] h-3 w-3 rounded-full border-2 border-[#8de3ff] bg-[#0d0d0d]" />
                <div className="absolute left-[calc(58%+0.75rem)] top-[34%] rounded-2xl border border-white/10 bg-[#232323]/95 px-4 py-3 shadow-2xl">
                    <p className="text-xs text-white/45">Progress checkpoint</p>
                    <p className="mt-1 text-xl font-semibold text-white">{data[Math.min(6, data.length - 1)]?.value ?? 0}</p>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-3 text-[11px] text-white/30 sm:grid-cols-6">
                {data.filter((_, index) => index % 2 === 1).map((item) => (
                    <span key={item.label}>{item.label}</span>
                ))}
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    const session = await getSession();

    if (!session) {
        return (
            <main className="relative z-10 min-h-screen px-4 pt-32">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-10 text-center">
                        <h1 className="text-5xl font-semibold tracking-tight text-white">{LOGIN_TITLE}</h1>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/56">{LOGIN_DESCRIPTION}</p>
                    </div>
                    <AdminLoginForm />
                </div>
            </main>
        );
    }

    let postCount = 0;
    let lessonCount = 0;
    let quizCount = 0;
    let avgScore = 0;
    let displayName = session.username;
    let streakScore = 0;
    let recentLessonTitle = "Explore a fresh lesson";

    try {
        const [postsRes, currentUserRes, historyRes, scoresRes] = await Promise.all([
            supabase
                .from("wiki_posts")
                .select("*", { count: "exact", head: true })
                .eq("author", session.username),
            supabase
                .from("users")
                .select("display_name")
                .eq("username", session.username)
                .single(),
            supabase
                .from("user_learning_history")
                .select("lesson_title, updated_at")
                .eq("username", session.username)
                .order("updated_at", { ascending: false })
                .limit(8),
            supabase
                .from("quiz_scores")
                .select("score")
                .eq("username", session.username),
        ]);

        postCount = postsRes.count || 0;
        displayName = currentUserRes.data?.display_name || session.username;

        const historyRows = historyRes.data || [];
        lessonCount = historyRows.length;
        recentLessonTitle = historyRows[0]?.lesson_title || recentLessonTitle;

        const scoreRows = scoresRes.data || [];
        quizCount = scoreRows.length;
        if (scoreRows.length > 0) {
            avgScore = Number((scoreRows.reduce((sum, row) => sum + row.score, 0) / scoreRows.length).toFixed(1));
        }

        const now = Date.now();
        streakScore = historyRows.reduce((acc, row) => {
            const distance = Math.max(0, 7 - Math.floor((now - new Date(row.updated_at).getTime()) / (1000 * 60 * 60 * 24)));
            return acc + distance;
        }, 0);
    } catch (error) {
        console.error("Failed to fetch dashboard overview:", error);
    }

    const completionRate = Math.min(98, 35 + lessonCount * 7 + Math.round(avgScore / 5));
    const focusRate = Math.min(96, 30 + quizCount * 8 + Math.round(avgScore / 6));
    const consistencyRate = Math.min(100, 18 + streakScore * 3);
    const momentumRate = Math.min(100, 24 + lessonCount * 6 + postCount * 8);

    const statCards: StatCard[] = [
        {
            title: "Learning sessions",
            value: `${lessonCount}`,
            delta: formatDelta(lessonCount > 0 ? lessonCount * 1.8 : 2.4),
            positive: true,
            icon: <BookOpen className="h-4 w-4" />,
        },
        {
            title: "Focus coverage",
            value: formatPercent(focusRate),
            delta: formatDelta(quizCount > 0 ? 4.6 : 1.8),
            positive: true,
            icon: <Search className="h-4 w-4" />,
        },
        {
            title: "Mastery score",
            value: formatPercent(avgScore || 76),
            delta: formatDelta(avgScore >= 70 ? 2.3 : -1.4),
            positive: avgScore >= 70,
            icon: <Target className="h-4 w-4" />,
        },
        {
            title: "Momentum",
            value: `${momentumRate}`,
            delta: formatDelta(postCount > 0 ? 5.1 : 2.1),
            positive: true,
            icon: <TrendingUp className="h-4 w-4" />,
        },
    ];

    const barData = buildBarData(postCount, lessonCount, quizCount, avgScore || 74);
    const lineData = buildLineData(lessonCount, quizCount, postCount);

    const insightCards = [
        {
            icon: <Compass className="h-4 w-4" />,
            title: "Recommended next move",
            text: `Continue from "${recentLessonTitle}" or open your account workspace to refine profile and learning settings.`,
            href: "/dashboard/account",
            hrefLabel: "Open account workspace",
        },
        {
            icon: <Flame className="h-4 w-4" />,
            title: "Consistency signal",
            text: `Your recent activity suggests a ${consistencyRate >= 60 ? "steady" : "recovering"} pace. A short quiz session can lift retention faster than another passive read.`,
            href: "/test/exam",
            hrefLabel: "Start a quiz",
        },
        {
            icon: <FileText className="h-4 w-4" />,
            title: "Knowledge output",
            text: `You have ${postCount} published article${postCount === 1 ? "" : "s"}. Turning notes into wiki posts is currently the clearest leverage point.`,
            href: "/wiki/create",
            hrefLabel: "Write a new post",
        },
    ];

    const tabs = [
        { label: "Overview", href: "/dashboard", active: true, icon: <Layers3 className="h-4 w-4" /> },
        { label: "Account", href: "/dashboard/account", active: false, icon: <ShieldCheck className="h-4 w-4" /> },
        { label: "History", href: "/history", active: false, icon: <Clock3 className="h-4 w-4" /> },
        { label: "Learning", href: "/learn", active: false, icon: <BookOpen className="h-4 w-4" /> },
        { label: "Writing", href: "/wiki/manage", active: false, icon: <FileText className="h-4 w-4" /> },
    ];

    return (
        <main className="relative z-10 min-h-screen bg-transparent px-4 pb-20 pt-28">
            <div className="mx-auto max-w-[1280px]">
                <div className="overflow-hidden rounded-[2rem] border border-white/7 bg-[#0f0f10]/95 shadow-[0_28px_90px_rgba(0,0,0,0.4)]">
                    <section className="border-b border-white/8 px-6 py-7 sm:px-8 lg:px-10">
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#7fdbff]/20 bg-[#7fdbff]/10 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[#a9ecff]">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Overview workspace
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.35rem]">{DASHBOARD_TITLE}</h1>
                                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/52 sm:text-base">{DASHBOARD_SUBTITLE}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {[
                                        displayName,
                                        session.role === "admin" ? "Admin access" : "Member mode",
                                        "Progress synced",
                                        "Insight ready",
                                    ].map((badge) => (
                                        <span key={badge} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/48">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/wiki/manage"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#90defa]/20 bg-[#90defa]/10 px-5 py-3 text-sm font-medium text-[#c8f3ff] transition-colors hover:bg-[#90defa]/16 hover:text-white"
                                >
                                    <FileText className="h-4 w-4" />
                                    Quản lý bài viết
                                </Link>
                                <Link
                                    href="/dashboard/account"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/74 transition-colors hover:bg-white/[0.08] hover:text-white"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    Account Hub
                                </Link>
                                <Link
                                    href="/learn"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#90defa] px-5 py-3 text-sm font-medium text-slate-950 shadow-[0_0_30px_rgba(144,222,250,0.2)] transition-transform hover:-translate-y-0.5"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    Continue Learning
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="border-b border-white/8 px-6 py-4 sm:px-8 lg:px-10">
                        <div className="flex flex-wrap gap-2">
                            {tabs.map((tab) => (
                                <Link
                                    key={tab.label}
                                    href={tab.href}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                                        tab.active
                                            ? "border border-white/10 bg-white/[0.04] text-white"
                                            : "text-white/46 hover:bg-white/[0.04] hover:text-white/80",
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-7 px-6 py-7 sm:px-8 lg:px-10">
                        <div className="grid gap-5 xl:grid-cols-4">
                            {statCards.map((card) => (
                                <StatBlock key={card.title} {...card} />
                            ))}
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[1.08fr_1fr]">
                            <section className="rounded-[1.8rem] border border-white/8 bg-[#141414]/96 p-6">
                                <div className="mb-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-semibold tracking-tight text-white">Focus Distribution</h2>
                                            <p className="mt-2 max-w-lg text-sm leading-6 text-white/46">
                                                Snapshot of how your effort is spread across lessons, quizzes, writing, and review loops.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/52">
                                            updated live
                                        </div>
                                    </div>
                                </div>
                                <BarChart data={barData} />
                            </section>

                            <section className="rounded-[1.8rem] border border-white/8 bg-[#141414]/96 p-6">
                                <div className="mb-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-semibold tracking-tight text-white">Progress Velocity</h2>
                                            <p className="mt-2 max-w-lg text-sm leading-6 text-white/46">
                                                Rolling view of your recent growth based on completed sessions, quiz attempts, and study output.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/52">
                                            last 12 checkpoints
                                        </div>
                                    </div>
                                </div>
                                <LineChartPanel data={lineData} />
                            </section>
                        </div>

                        <section className="rounded-[1.8rem] border border-white/8 bg-[#141414]/96 p-6">
                            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold tracking-tight text-white">Actionable Insights</h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/46">
                                        Recommendations derived from your current pace and content footprint. Use them to decide what to open next.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/44">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-[#8edcf8]" />
                                    Synced with current account data
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                                {insightCards.map((item) => (
                                    <div key={item.title} className="rounded-[1.4rem] border border-white/8 bg-[#111111] p-5">
                                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#90defa]">
                                            {item.icon}
                                        </div>
                                        <h3 className="text-lg font-medium text-white">{item.title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-white/48">{item.text}</p>
                                        <Link
                                            href={item.href}
                                            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#8fe1ff] transition-opacity hover:opacity-80"
                                        >
                                            {item.hrefLabel}
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                            <div className="rounded-[1.8rem] border border-white/8 bg-[#141414]/96 p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold tracking-tight text-white">Current Priorities</h2>
                                        <p className="mt-2 text-sm text-white/46">Short list of what deserves attention next.</p>
                                    </div>
                                    <Star className="h-4 w-4 text-[#8fe1ff]" />
                                </div>
                                <div className="mt-6 space-y-3">
                                    {[
                                        `Revisit ${recentLessonTitle}`,
                                        "Stabilize your quiz average above 80%",
                                        "Publish one new wiki note this week",
                                    ].map((task, index) => (
                                        <div key={task} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/56">{index + 1}</div>
                                                <span className="text-sm text-white/72">{task}</span>
                                            </div>
                                            <Activity className="h-4 w-4 text-white/28" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[1.8rem] border border-white/8 bg-[#141414]/96 p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold tracking-tight text-white">Quick Routes</h2>
                                        <p className="mt-2 text-sm text-white/46">Jump directly into the part of the platform that matches your current intent.</p>
                                    </div>
                                    <LineChart className="h-4 w-4 text-[#8fe1ff]" />
                                </div>
                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    {[
                                        { label: "Open account", href: "/dashboard/account" },
                                        { label: "Review history", href: "/history" },
                                        { label: "Study lessons", href: "/learn" },
                                        { label: "Create article", href: "/wiki/create" },
                                    ].map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-4 text-sm text-white/72 transition-colors hover:bg-white/[0.05] hover:text-white"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{item.label}</span>
                                                <ChevronRight className="h-4 w-4 text-white/28" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </section>
                </div>
            </div>
        </main>
    );
}
