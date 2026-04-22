import { redirect } from "next/navigation";
import { DashboardAiChartsPage } from "@/components/dashboard/dashboard-ai-charts-page";
import { getSession } from "@/lib/auth";
import { getDashboardAiEvaluation } from "@/lib/dashboard-ai-evaluation";

export const dynamic = "force-dynamic";

export default async function DashboardChartsRoute() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const aiEvaluation = await getDashboardAiEvaluation(session.username);

    return (
        <main className="relative z-10 min-h-screen bg-transparent px-4 pb-20 pt-28">
            <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[2rem] border border-white/20 bg-[radial-gradient(circle_at_top,rgba(80,173,214,0.12),transparent_26%),linear-gradient(180deg,rgba(14,14,16,0.98),rgba(9,10,12,0.98))] p-6 shadow-[0_32px_110px_rgba(0,0,0,0.48)] sm:p-8">
                <DashboardAiChartsPage
                    chartData={aiEvaluation.rawChartData}
                    interactionId={aiEvaluation.interactionId}
                />
            </div>
        </main>
    );
}
