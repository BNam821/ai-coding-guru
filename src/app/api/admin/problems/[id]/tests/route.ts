import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-route";
import { listCodingProblemTestCases } from "@/lib/coding-problem-tests";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(_request: Request, context: RouteContext) {
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
        const testCases = await listCodingProblemTestCases(id);

        return NextResponse.json({
            problem: {
                id: problem.id,
                title: problem.title,
                testVolumeClass: problem.test_volume_class ?? null,
                testGenerationStatus: problem.test_generation_status ?? "idle",
                testGenerationError: problem.test_generation_error ?? null,
                judge0LanguageId: problem.judge0_language_id ?? null,
                judge0TimeLimitMs: problem.judge0_time_limit_ms ?? 2000,
                judge0MemoryLimitKb: problem.judge0_memory_limit_kb ?? 128000,
            },
            sampleTests: testCases.filter((testCase) => testCase.kind === "sample"),
            generatedDraftTests: testCases.filter((testCase) => testCase.kind === "generated_draft"),
            officialTests: testCases.filter((testCase) => testCase.kind === "official" && testCase.status === "approved"),
        });
    } catch (routeError) {
        return NextResponse.json(
            {
                error: routeError instanceof Error ? routeError.message : "Failed to load problem tests",
            },
            { status: 500 },
        );
    }
}
