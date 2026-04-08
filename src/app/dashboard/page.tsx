import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await getSession();

    if (!session) {
        redirect("/?auth=required");
    }

    const data = await getDashboardData(session);

    return <DashboardShell data={data} />;
}
