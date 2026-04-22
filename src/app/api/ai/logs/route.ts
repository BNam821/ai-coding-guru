import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
    listAiInteractions,
    parseAiInteractionStatus,
    parseAiTaskType,
} from "@/lib/ai-interactions";

function parsePage(value: string | null) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return 1;
    }

    return Math.floor(parsed);
}

function parseDateValue(value: string | null) {
    if (!value) {
        return undefined;
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export async function GET(req: Request) {
    const session = await getSession();

    if (!session?.username) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isAdmin = session.role === "admin";
    const result = await listAiInteractions({
        viewerRole: isAdmin ? "admin" : "user",
        viewerUsername: session.username,
        username: isAdmin ? (searchParams.get("username") || "").trim() || undefined : undefined,
        taskType: parseAiTaskType(searchParams.get("taskType")),
        status: parseAiInteractionStatus(searchParams.get("status")),
        from: parseDateValue(searchParams.get("from")),
        to: parseDateValue(searchParams.get("to")),
        page: parsePage(searchParams.get("page")),
    });

    return NextResponse.json({
        success: true,
        isAdmin,
        ...result,
    });
}
