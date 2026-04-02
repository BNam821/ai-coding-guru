import { redirect } from "next/navigation";
import { isUserAuthenticated } from "@/lib/auth";
import { WikiManagePage } from "@/components/wiki/wiki-manage-page";

export const dynamic = "force-dynamic";

export default async function WikiManageRoutePage() {
    if (!(await isUserAuthenticated())) {
        redirect("/wiki");
    }

    return (
        <main className="min-h-screen px-4 pb-20 pt-32 relative z-10">
            <div className="absolute left-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-accent-secondary/5 blur-[160px] -z-10" />
            <div className="absolute bottom-[15%] right-[-5%] h-[500px] w-[500px] rounded-full bg-accent-primary/5 blur-[180px] -z-10" />

            <div className="container mx-auto max-w-6xl">
                <WikiManagePage />
            </div>
        </main>
    );
}

