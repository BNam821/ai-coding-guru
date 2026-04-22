import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cleanupExpiredAiInteractions } from "@/lib/ai-interactions";

export async function POST() {
    const session = await getSession();

    if (!session?.username) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    try {
        const result = await cleanupExpiredAiInteractions();
        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to cleanup AI interactions";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
