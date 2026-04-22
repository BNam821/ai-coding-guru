import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-route";
import { rejectGeneratedDraftTestCases } from "@/lib/coding-problem-tests";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(request: Request, context: RouteContext) {
    const auth = await requireAdminSession();
    if (auth.response) {
        return auth.response;
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray((body as { ids?: unknown }).ids)
        ? ((body as { ids?: unknown[] }).ids || []).filter((item): item is string => typeof item === "string")
        : undefined;

    try {
        const rejectedTests = await rejectGeneratedDraftTestCases(id, ids);
        return NextResponse.json({
            success: true,
            rejectedCount: rejectedTests.length,
            rejectedTests,
        });
    } catch (routeError) {
        return NextResponse.json(
            {
                error: routeError instanceof Error ? routeError.message : "Failed to reject draft tests",
            },
            { status: 500 },
        );
    }
}
