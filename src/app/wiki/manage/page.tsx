import { redirect } from "next/navigation";
import { isUserAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WikiManageRoutePage() {
    if (!(await isUserAuthenticated())) {
        redirect("/wiki");
    }

    redirect("/dashboard?tab=articles");
}
