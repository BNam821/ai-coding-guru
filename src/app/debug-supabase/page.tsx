import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DebugSupabaseClient } from "@/components/debug/debug-supabase-client";

export default async function DebugSupabasePage() {
    const session = await getSession();

    if (process.env.NODE_ENV === "production" || session?.role !== "admin") {
        notFound();
    }

    return <DebugSupabaseClient />;
}
