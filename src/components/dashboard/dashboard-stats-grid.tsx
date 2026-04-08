import { BookCheck, BookOpenCheck, ClipboardList, Trophy } from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard";

const statCards = [
    {
        key: "completedCourses",
        label: "Khóa hoàn thành",
        icon: BookCheck,
        accent: "bg-[#c8b0f6] text-[#17191f]",
    },
    {
        key: "inProgressCourses",
        label: "Khóa đang học",
        icon: BookOpenCheck,
        accent: "bg-[#1d2027] text-white",
    },
    {
        key: "quizAttempts",
        label: "Lượt kiểm tra",
        icon: ClipboardList,
        accent: "bg-[#1d2027] text-white",
    },
    {
        key: "averageScore",
        label: "Điểm trung bình",
        icon: Trophy,
        accent: "bg-[#1d2027] text-white",
    },
] as const;

export function DashboardStatsGrid({ stats }: { stats: DashboardStats }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ key, label, icon: Icon, accent }) => (
                <article key={key} className={`rounded-[1.6rem] border border-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] ${accent}`}>
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-black/10">
                            <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-4xl font-semibold tracking-tight">
                            {stats[key]}
                            {key === "averageScore" && <span className="text-2xl">%</span>}
                        </p>
                    </div>
                    <p className="text-sm font-medium opacity-75">{label}</p>
                </article>
            ))}
        </section>
    );
}
