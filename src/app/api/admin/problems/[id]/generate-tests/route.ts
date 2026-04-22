import { NextResponse } from "next/server";
import { generateDraftTestsForProblem } from "@/lib/code-problem-ai";
import { requireAdminSession } from "@/lib/admin-route";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(_request: Request, context: RouteContext) {
    const auth = await requireAdminSession();
    if (auth.response) {
        return auth.response;
    }

    const { id } = await context.params;

    const { data: problem, error } = await supabaseAdmin
        .from("coding_problems")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!problem) {
        return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    try {
        const result = await generateDraftTestsForProblem(problem, auth.session?.username ?? null);
        return NextResponse.json(result);
    } catch (routeError) {
        return NextResponse.json(
            {
                error: routeError instanceof Error ? routeError.message : "Failed to generate tests",
            },
            { status: 500 },
        );
    }
}
