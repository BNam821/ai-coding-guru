import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-route";
import { approveGeneratedDraftTestCases } from "@/lib/coding-problem-tests";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
        const officialTests = await approveGeneratedDraftTestCases(id, ids);

        const { error } = await supabaseAdmin
            .from("coding_problems")
            .update({
                test_generation_status: officialTests.length > 0 ? "ready" : "idle",
                test_generation_error: null,
            })
            .eq("id", id);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            approvedCount: officialTests.length,
            officialTests,
        });
    } catch (routeError) {
        return NextResponse.json(
            {
                error: routeError instanceof Error ? routeError.message : "Failed to approve draft tests",
            },
            { status: 500 },
        );
    }
}
