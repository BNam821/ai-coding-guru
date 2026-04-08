import Image from "next/image";
import Link from "next/link";
import type { DashboardViewModel } from "@/lib/dashboard";
import { DashboardCoursesPanel } from "@/components/dashboard/dashboard-courses-panel";
import { DashboardNextLessons } from "@/components/dashboard/dashboard-next-lessons";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardStatsGrid } from "@/components/dashboard/dashboard-stats-grid";
import { DashboardWeeklyActivity } from "@/components/dashboard/dashboard-weekly-activity";
import { cn } from "@/lib/utils";

interface DashboardTopLink {
    label: string;
    href: string;
    active?: boolean;
    external?: boolean;
}

const dashboardTopLinks: DashboardTopLink[] = [
    { label: "Trang chủ", href: "/" },
    { label: "Tổng quan", href: "/dashboard", active: true },
    { label: "Học tập", href: "/learn" },
    { label: "GIthub", href: "https://github.com/BNam821/ai-coding-guru", external: true },
];

export function DashboardShell({ data }: { data: DashboardViewModel }) {
    return (
        <div className="min-h-screen bg-[#111318] px-3 py-3 text-white sm:px-4 sm:py-4 lg:px-6 lg:py-6">
            <div className="mx-auto max-w-[1480px] rounded-[2.5rem] bg-[#111318] p-3 shadow-[0_40px_90px_rgba(0,0,0,0.24)] sm:p-4 lg:p-6">
                <div className="flex flex-col gap-6 lg:flex-row">
                    <DashboardSidebar user={data.user} />

                    <div className="flex-1 space-y-6">
                        <div className="rounded-[2rem] border border-white/10 bg-[#17191f] px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:px-5 lg:px-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
                                    <div className="relative block h-14 w-[132px] shrink-0 sm:h-16 sm:w-[152px]">
                                        <Image src="/cp8.png" alt="CP8" fill className="object-contain object-left" priority />
                                    </div>
                                    <p className="truncate text-lg font-semibold tracking-tight text-white sm:text-[1.35rem]">
                                        AI Coding Guru
                                    </p>
                                </Link>

                                <nav className="flex flex-wrap gap-2 sm:gap-3 xl:justify-end">
                                    {dashboardTopLinks.map(({ label, href, active, external }) => (
                                        <Link
                                            key={label}
                                            href={href}
                                            aria-current={active ? "page" : undefined}
                                            target={external ? "_blank" : undefined}
                                            rel={external ? "noopener noreferrer" : undefined}
                                            className={cn(
                                                "inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:px-5",
                                                active
                                                    ? "border-[#f4e588]/50 bg-[#f4e588] text-[#151720]"
                                                    : "border-white/12 bg-white/[0.04] text-white/78 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                                            )}
                                        >
                                            {label}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
                            <div className="space-y-6">
                                <DashboardWeeklyActivity weeklyActivity={data.weeklyActivity} maxCount={data.maxWeeklyCount} />
                                <DashboardStatsGrid stats={data.stats} />
                                <DashboardNextLessons lessons={data.nextLessons} />
                            </div>

                            <DashboardCoursesPanel courses={data.courses} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
