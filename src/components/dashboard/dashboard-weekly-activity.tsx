import { CalendarDays } from "lucide-react";
import type { DashboardWeeklyActivityDay } from "@/lib/dashboard";

export function DashboardWeeklyActivity({
    weeklyActivity,
    maxCount,
}: {
    weeklyActivity: DashboardWeeklyActivityDay[];
    maxCount: number;
}) {
    return (
        <section className="rounded-[2rem] border border-white/10 bg-[#1d2027] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] lg:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">Tiến độ tuần này</h2>
                    <p className="mt-2 text-sm text-white/45">Số lượt học được đồng bộ từ lịch sử học tập 7 ngày gần nhất.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
                    <CalendarDays className="h-5 w-5" />
                </div>
            </div>

            <div className="grid h-44 grid-cols-7 items-end gap-3 rounded-[1.5rem] border border-white/6 bg-[#17191f] px-3 pb-4 pt-5 sm:gap-4 sm:px-5">
                {weeklyActivity.map((item, index) => {
                    const height = Math.max((item.count / maxCount) * 100, item.count > 0 ? 16 : 6);
                    const isHighlight = index === weeklyActivity.length - 1;

                    return (
                        <div key={item.dateKey} className="flex h-full flex-col justify-end gap-3">
                            <div className="flex flex-1 items-end">
                                <div
                                    className={isHighlight ? "w-full rounded-t-2xl bg-[#c8b0f6]" : "w-full rounded-t-2xl bg-[#f4e588]"}
                                    style={{ height: `${height}%` }}
                                    title={`${item.label}: ${item.count} lượt học`}
                                />
                            </div>
                            <div className="space-y-1 text-center">
                                <p className="text-sm font-medium text-white/80">{item.label}</p>
                                <p className="text-xs text-white/35">{item.count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
