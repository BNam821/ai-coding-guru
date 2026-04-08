import type { DashboardViewModel } from "@/lib/dashboard";
import { DashboardCoursesPanel } from "@/components/dashboard/dashboard-courses-panel";
import { DashboardNextLessons } from "@/components/dashboard/dashboard-next-lessons";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardStatsGrid } from "@/components/dashboard/dashboard-stats-grid";
import { DashboardWeeklyActivity } from "@/components/dashboard/dashboard-weekly-activity";

export function DashboardShell({ data }: { data: DashboardViewModel }) {
    return (
        <div className="min-h-screen bg-[#ddd9d2] px-3 py-3 text-white sm:px-4 sm:py-4 lg:px-6 lg:py-6">
            <div className="mx-auto max-w-[1480px] rounded-[2.5rem] bg-[#111318] p-3 shadow-[0_40px_90px_rgba(0,0,0,0.24)] sm:p-4 lg:p-6">
                <div className="flex flex-col gap-6 lg:flex-row">
                    <DashboardSidebar user={data.user} />

                    <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
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
    );
}
