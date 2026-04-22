import Image from "next/image";
import Link from "next/link";
import {
    Activity,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Flame,
    LineChart,
    Star,
    Target,
    Trophy,
    Medal,
    User,
} from "lucide-react";
import { AdminLoginForm } from "@/components/auth/login-form";
import { DashboardOverviewTabs, type DashboardTabKey } from "@/components/dashboard/dashboard-overview-tabs";
import { WikiManagePage } from "@/components/wiki/wiki-manage-page";
import { getSession } from "@/lib/auth";
import { getDashboardAiEvaluation, type DashboardAiEvaluation } from "@/lib/dashboard-ai-evaluation";
import { supabase } from "@/lib/supabase";
import {
    getDashboardChartsData,
    getDashboardLearningDetails,
    getLeaderboardData,
    getUserProgressSnapshot,
    getRecentCodingProblems,
    type LeaderboardUser,
    type NextLearningLesson,
    type RecentLearningLesson,
    type RecentProblem,
} from "@/lib/user-progress";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function normalizeDashboardTab(value: string | undefined): DashboardTabKey {
    if (value === "learning" || value === "articles") {
        return value;
    }

    return "overview";
}

type StatCard = {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    footer?: React.ReactNode;
};

type BarDatum = {
    label: string;
    value: number;
};

type LineDatum = {
    label: string;
    value: number;
};

type DashboardBadge = {
    label: string;
    className?: string;
    effectClassName?: string;
};

const DASHBOARD_TITLE = "Trung tâm quản lý";
const DASHBOARD_SUBTITLE = "Dữ liệu cá nhân hóa của bạn về các bài học, câu hỏi và xây dựng kiến thức.";
const LOGIN_TITLE = "Đăng nhập để vào dashboard.";
const LOGIN_DESCRIPTION = "Truy cập bảng điều khiển để xem tiến độ, mục tiêu và những điểm đáng chú ý trong hành trình học.";

function formatPercent(value: number) {
    return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function getKnowledgeTierBadge(level: number): DashboardBadge {
    if (level >= 7) {
        return {
            label: "Rank Kim cương",
            className: "border-[#7dd3fc]/80 bg-[#38bdf8]/12 text-[#d8f3ff] shadow-[0_0_24px_rgba(56,189,248,0.3)]",
            effectClassName: "rank-badge rank-badge--diamond",
        };
    }

    if (level >= 5) {
        return {
            label: "Rank Vàng",
            className: "border-[#f6d365]/80 bg-[#f6d365]/12 text-[#fff2b3] shadow-[0_0_24px_rgba(246,211,101,0.28)]",
            effectClassName: "rank-badge rank-badge--gold",
        };
    }

    if (level >= 3) {
        return {
            label: "Rank Bạc",
            className: "border-[#d9e2ec]/80 bg-[#d9e2ec]/10 text-[#f5f7fa] shadow-[0_0_24px_rgba(217,226,236,0.24)]",
            effectClassName: "rank-badge rank-badge--silver",
        };
    }

    return {
        label: "Rank Đồng",
        className: "border-[#d4a373]/80 bg-[#d4a373]/10 text-[#f8dec4] shadow-[0_0_24px_rgba(212,163,115,0.24)]",
        effectClassName: "rank-badge rank-badge--bronze",
    };
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

function StatBlock({ title, value, description, icon, footer }: StatCard) {
    return (
        <div className="flex h-full flex-col rounded-[1.6rem] border border-white/20 bg-[#141414]/96 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#90defa]">
                    {icon}
                </div>
            </div>
            <p className="text-sm text-white/48">{title}</p>
            <p className="mt-2 text-[2rem] font-semibold tracking-tight text-white">{value}</p>
            {description && <p className="mt-3 text-sm leading-6 text-white/46">{description}</p>}
            {footer ? <div className={cn(description ? "mt-5" : "mt-2")}>{footer}</div> : null}
        </div>
    );
}

function BarChart({ data }: { data: BarDatum[] }) {
    const rawMax = Math.max(...data.map((item) => item.value), 4);
    const max = Math.ceil(rawMax);
    const yTicks = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0];

    return (
        <div className="flex h-[252px] items-start gap-4 pb-2">
            <div className="flex h-[220px] flex-col justify-between text-right text-[11px] text-white/30 pb-[24px]">
                {yTicks.map((tick, i) => (
                    <span key={i} className="leading-none">{tick}</span>
                ))}
            </div>
            <div className="flex-1 grid h-[220px] grid-cols-7 items-end gap-2 sm:gap-4">
                {data.map((item) => (
                    <div key={item.label} className="flex h-full flex-col justify-end gap-3 group relative">
                        <div className="relative flex-1 w-full flex justify-center">
                            <div
                                className="absolute bottom-0 w-full rounded-[1rem] bg-gradient-to-b from-[#87e0ff] to-[#5fbff2] shadow-[0_0_25px_rgba(109,204,245,0.35)] transition-all duration-300"
                                style={{ height: `${(item.value / max) * 100}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap pointer-events-none">
                                    {item.value} lượt
                                </div>
                            </div>
                        </div>
                        <span className="text-center text-[10px] sm:text-[11px] text-white/42 truncate">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LeaderboardPanel({ data }: { data: LeaderboardUser[] }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-3 max-h-[252px] overflow-y-auto no-scrollbar">
                {data.map((user) => {
                    const isTop3 = user.rank <= 3;
                    const medalColor =
                        user.rank === 1 ? "text-[#f6c453]" :
                            user.rank === 2 ? "text-[#a2a2a2]" :
                                user.rank === 3 ? "text-[#cd7f32]" :
                                    "text-white/20";

                    return (
                        <div
                            key={user.username}
                            className={cn(
                                "flex items-center justify-between rounded-2xl border border-white/16 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]",
                                user.rank === 1 && "border-[#f6c453]/20 bg-[#f6c453]/[0.02]"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold", medalColor)}>
                                    {user.rank <= 3 ? <Trophy className="h-5 w-5" /> : user.rank}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{user.displayName}</p>
                                    <p className="text-[10px] text-white/30 tracking-wider">{user.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-[#8edcf8]">Lv.{user.level}</span>
                                    <span className="text-[10px] text-white/40">{user.totalExperience} XP</span>
                                </div>
                                {isTop3 && <Medal className={cn("h-4 w-4", medalColor)} />}
                            </div>
                        </div>
                    );
                })}
                {data.length === 0 && (
                    <div className="flex h-40 flex-col items-center justify-center text-center">
                        <p className="text-sm text-white/40">Chưa có dữ liệu xếp hạng</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function LineChartPanel({ data }: { data: LineDatum[] }) {
    const path = buildPath(data, 100, 100);

    return (
        <div className="space-y-5">
            <div className="relative h-[220px] overflow-hidden rounded-[1.25rem] border border-white/20 bg-[#101010]">
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
                <div className="absolute left-[calc(58%+0.75rem)] top-[34%] rounded-2xl border border-white/20 bg-[#232323]/95 px-4 py-3 shadow-2xl">
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

export default async function DashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ tab?: string }>;
}) {
    const session = await getSession();
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const initialTab = normalizeDashboardTab(resolvedSearchParams?.tab);

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
    let uniqueLessonCount = 0;
    let totalCorrectAnswers = 0;
    let totalAnsweredQuestions = 0;
    let totalExperience = 0;
    let experience = {
        level: 0,
        currentLevelExperience: 0,
        requiredExperience: 100,
        progress: 0,
    };
    let chartsData: any = null;
    let leaderboardData: LeaderboardUser[] = [];
    let recentLearningLessons: RecentLearningLesson[] = [];
    let nextLearningLesson: NextLearningLesson | null = null;
    let recentProblems: RecentProblem[] = [];
    let aiEvaluation: DashboardAiEvaluation = {
        hasData: false,
        bullets: [
            "Bạn chưa có dữ liệu trắc nghiệm để AI phân tích.",
            "Hãy làm thêm vài bài kiểm tra để hệ thống nhận ra điểm mạnh của bạn.",
            "Sau đó dashboard sẽ tự đề xuất các bài học nên ôn lại.",
        ],
        recommendedLessons: [],
        attemptCount: 0,
        averageScore: 0,
    };

    try {
        const [postsRes, currentUserRes, progressSnapshot, fetchedChartsData, fetchedLeaderboard, learningDetails, fetchedRecentProblems, fetchedAiEvaluation] = await Promise.all([
            supabase
                .from("wiki_posts")
                .select("*", { count: "exact", head: true })
                .eq("author", session.username),
            supabase
                .from("users")
                .select("display_name")
                .eq("username", session.username)
                .single(),
            getUserProgressSnapshot(session.username),
            getDashboardChartsData(session.username),
            getLeaderboardData(),
            getDashboardLearningDetails(session.username),
            getRecentCodingProblems(session.username, 10),
            getDashboardAiEvaluation(session.username),
        ]);

        postCount = postsRes.count || 0;
        displayName = currentUserRes.data?.display_name || session.username;
        uniqueLessonCount = progressSnapshot.uniqueLessonCount;
        lessonCount = uniqueLessonCount;
        recentLessonTitle = progressSnapshot.recentLessonTitle;
        quizCount = progressSnapshot.quizCount;
        avgScore = progressSnapshot.avgScore;
        totalCorrectAnswers = progressSnapshot.totalCorrectAnswers;
        totalAnsweredQuestions = progressSnapshot.totalAnsweredQuestions;
        streakScore = progressSnapshot.streakScore;
        totalExperience = progressSnapshot.totalExperience;
        experience = progressSnapshot.experience;
        chartsData = fetchedChartsData;
        leaderboardData = fetchedLeaderboard;
        recentLearningLessons = learningDetails.recentLessons;
        nextLearningLesson = learningDetails.nextLesson;
        recentProblems = fetchedRecentProblems;
        aiEvaluation = fetchedAiEvaluation;
    } catch (error) {
        console.error("Failed to fetch dashboard overview:", error);
    }

    const consistencyRate = Math.min(100, 18 + streakScore * 3);
    const accuracyRate = totalAnsweredQuestions > 0 ? (totalCorrectAnswers / totalAnsweredQuestions) * 100 : 0;
    const statCards: StatCard[] = [
        {
            title: "Bài tập gần đây",
            value: recentProblems.length > 0 ? `${recentProblems.length} bài đã làm` : "Chưa có bài tập",
            description: "",
            icon: <Activity className="h-4 w-4" />,
            footer: (
                <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1 no-scrollbar CustomScrollbar">
                    {recentProblems.map((p) => (
                        <Link
                            key={p.id}
                            href={`/test/code?id=${p.id}`}
                            className="flex items-center justify-between group py-1.5 px-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all"
                        >
                            <span className="text-[11px] font-medium text-white/70 group-hover:text-[#90defa] transition-colors truncate pr-2">
                                {p.title}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-white/30 italic">
                                    {p.score}đ
                                </span>
                                <ChevronRight className="h-3 w-3 text-white/10 group-hover:text-[#90defa]" />
                            </div>
                        </Link>
                    ))}
                    {recentProblems.length === 0 && (
                        <Link href="/test/code" className="text-[11px] text-[#90defa] hover:underline flex items-center gap-1">
                            Bắt đầu luyện tập ngay <ArrowRight size={10} />
                        </Link>
                    )}
                </div>
            )
        },
        {
            title: "Tỉ lệ chính xác",
            value: formatPercent(accuracyRate),
            description: totalAnsweredQuestions > 0
                ? `${totalCorrectAnswers}/${totalAnsweredQuestions} câu đúng trong các bài kiểm tra.`
                : "Chưa có dữ liệu làm bài trong /test.",
            icon: <Target className="h-4 w-4" />,
        },
        {
            title: "Kinh nghiệm",
            value: `Lv${experience.level} · ${experience.currentLevelExperience}/${experience.requiredExperience} XP`,
            description: `${totalExperience} XP tổng. +10 mỗi bài đã học, +5 mỗi câu trả lời đúng, +20 với mỗi bài tập code đã hoàn thành.`,
            icon: <Flame className="h-4 w-4" />,
            footer: (
                <div className="space-y-2">
                    <div className="h-3 overflow-hidden rounded-full bg-[#4fb673]">
                        <div
                            className="h-full rounded-full bg-[#f6c453] transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, experience.progress * 100))}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/42">
                        <span>{experience.currentLevelExperience} XP hiện tại</span>
                        <span>Cần {experience.requiredExperience} XP để lên Lv{experience.level + 1}</span>
                    </div>
                </div>
            ),
        },
    ];

    let barData = chartsData?.learningFrequency?.map((d: any) => ({ label: d.label, value: d.sessions })) || [];
    let codeBarData = chartsData?.codingFrequency?.map((d: any) => ({ label: d.label, value: d.sessions })) || [];
    let lineData = chartsData?.lessonCompletionRates || [];

    if (barData.length === 0) barData = buildBarData(postCount, lessonCount, quizCount, avgScore || 74);
    if (codeBarData.length === 0) codeBarData = barData.map((d: any) => ({ ...d, value: Math.round(d.value * 0.6) })); 
    if (lineData.length === 0) lineData = buildLineData(lessonCount, quizCount, postCount);

    const knowledgeTierBadge = getKnowledgeTierBadge(experience.level);
    const heroBadges: DashboardBadge[] = [
        { label: displayName },
        { label: session.role === "admin" ? "Quản trị viên" : "Người dùng" },
        { label: "Tiến độ" },
        knowledgeTierBadge,
    ];

    return (
        <main className="relative z-10 min-h-screen bg-transparent px-4 pb-20 pt-28">
            <div className="mx-auto max-w-[1280px]">
                <div className="overflow-hidden rounded-[2rem] border border-white/18 bg-[#0f0f10]/95 shadow-[0_28px_90px_rgba(0,0,0,0.4)]">
                    <section className="border-b border-white/16 px-6 py-7 sm:px-8 lg:px-10">
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center">
                                        <Image
                                            src="/team_logo.png"
                                            alt="Team logo"
                                            width={1249}
                                            height={297}
                                            className="h-auto w-[220px] object-contain sm:w-[260px]"
                                            priority
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.35rem]">{DASHBOARD_TITLE}</h1>
                                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/52 sm:text-base">{DASHBOARD_SUBTITLE}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {heroBadges.map((badge) => (
                                        <span
                                            key={badge.label}
                                            className={cn(
                                                "rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/48",
                                                badge.className,
                                                badge.effectClassName,
                                            )}
                                        >
                                            {badge.effectClassName ? (
                                                <span className="rank-badge__label">{badge.label}</span>
                                            ) : (
                                                badge.label
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/dashboard/account"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-white/10"
                                >
                                    <User className="h-4 w-4" />
                                    Tài khoản
                                </Link>
                                <Link
                                    href="/learn"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#90defa] px-5 py-3 text-sm font-medium text-slate-950 shadow-[0_0_30px_rgba(144,222,250,0.2)] transition-transform hover:-translate-y-0.5"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    Tiếp tục học
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="px-6 py-4 sm:px-8 lg:px-10">
                        <DashboardOverviewTabs
                            lessonCount={uniqueLessonCount}
                            recentLessons={recentLearningLessons}
                            nextLesson={nextLearningLesson}
                            aiEvaluation={aiEvaluation}
                            initialTab={initialTab}
                            overviewContent={(
                                <section className="space-y-7 py-3">
                                    <div className="grid gap-5 md:grid-cols-3">
                                        {statCards.map((card) => (
                                            <StatBlock key={card.title} {...card} />
                                        ))}
                                    </div>

                                    <div className="grid gap-5 xl:grid-cols-[1.08fr_1fr]">
                                        <section className="rounded-[1.8rem] border border-white/20 bg-[#141414]/96 p-6">
                                            <div className="mb-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h2 className="text-xl font-semibold tracking-tight text-white">Tần suất kiểm tra: Trắc nghiệm</h2>
                                                        <p className="mt-2 max-w-lg text-sm leading-6 text-white/46">
                                                            Biểu đồ tần suất làm bài kiểm tra trắc nghiệm của bạn. <br></br>Chỉ tính những lần hoàn thành đủ 10 câu hỏi.
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/52">
                                                        Tuần này
                                                    </div>
                                                </div>
                                            </div>
                                            <BarChart data={barData} />
                                        </section>

                                        <section className="rounded-[1.8rem] border border-white/20 bg-[#141414]/96 p-6">
                                            <div className="mb-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h2 className="text-xl font-semibold tracking-tight text-white">Bảng xếp hạng</h2>
                                                        <p className="mt-2 max-w-lg text-sm leading-6 text-white/46">
                                                            Top 10 người dùng có cấp độ và kinh nghiệm cao nhất. <br></br> Cuộn để xem thêm.
                                                        </p>
                                                    </div>
                                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/44">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-[#8edcf8]" />
                                                        Cập nhật liên tục
                                                    </div>
                                                </div>
                                            </div>
                                            <LeaderboardPanel data={leaderboardData} />
                                        </section>
                                    </div>

                                    <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                                        <div className="rounded-[1.8rem] border border-white/20 bg-[#141414]/96 p-6">
                                            <div className="mb-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h2 className="text-xl font-semibold tracking-tight text-white">Tần suất kiểm tra: Bài tập Code</h2>
                                                        <p className="mt-2 max-w-lg text-sm leading-6 text-white/46">
                                                            Biểu đồ tần suất giải bài tập lập trình của bạn trong tuần này. <br></br>Chỉ tính những bài tập đã được hệ thống ghi nhận.
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/52">
                                                        Tuần này
                                                    </div>
                                                </div>
                                            </div>
                                            <BarChart data={codeBarData} />
                                        </div>

                                        <div className="rounded-[1.8rem] border border-white/20 bg-[#141414]/96 p-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <h2 className="text-xl font-semibold tracking-tight text-white">Truy cập nhanh</h2>
                                                    <p className="mt-2 text-sm text-white/46">Hãy tuy cập trực tiếp đến nền tảng phù hợp với mục đích hiện tại của bạn.</p>
                                                </div>
                                                <LineChart className="h-4 w-4 text-[#8fe1ff]" />
                                            </div>
                                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                                {[
                                                    { label: "Mở tài khoản", href: "/dashboard/account" },
                                                    { label: "Xem lịch sử học", href: "/history" },
                                                    { label: "Bài học", href: "/learn" },
                                                    { label: "Tạo bài viết mới", href: "/wiki/create" },
                                                ].map((item) => (
                                                    <Link
                                                        key={item.label}
                                                        href={item.href}
                                                        className="rounded-2xl border border-white/16 bg-white/[0.025] px-4 py-4 text-sm text-white/72 transition-colors hover:bg-white/[0.05] hover:text-white"
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
                            )}
                            articlesContent={(
                                <section className="rounded-[1.8rem] border border-white/20 bg-[#141414]/96 p-6 sm:p-7">
                                    <WikiManagePage embedded />
                                </section>
                            )}
                        />
                    </section>
                </div>
            </div >
        </main >
    );
}
