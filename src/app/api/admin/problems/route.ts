import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSession } from "@/lib/auth";
import { syncCodingProblemSampleTestCase } from "@/lib/coding-problem-tests";
import { resolveJudge0LanguageId } from "@/lib/judge0";

// Middleware-like check for Admin
async function checkAdmin() {
    const session = await getSession();
    if (!session || session.role !== "admin") {
        return false;
    }
    return true;
}

export async function GET() {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
        .from("coding_problems")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tags, judge0_language_id, judge0_time_limit_ms, judge0_memory_limit_kb, ...rest } = body;
        const payload = {
            ...rest,
            tags: tags || [],
            judge0_language_id: resolveJudge0LanguageId(rest.language, Number(judge0_language_id || 0) || null),
            judge0_time_limit_ms: Number(judge0_time_limit_ms || 0) > 0 ? Number(judge0_time_limit_ms) : 2000,
            judge0_memory_limit_kb: Number(judge0_memory_limit_kb || 0) > 0 ? Number(judge0_memory_limit_kb) : 128000,
        };
        const { data, error } = await supabaseAdmin
            .from("coding_problems")
            .insert([payload])
            .select();

        if (error) throw error;

        if (data[0]?.id) {
            await syncCodingProblemSampleTestCase(
                data[0].id,
                typeof data[0].expected_input === "string" ? data[0].expected_input : "",
                typeof data[0].expected_output === "string" ? data[0].expected_output : "",
            );
        }

        return NextResponse.json(data[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            id,
            tags,
            judge0_language_id,
            judge0_time_limit_ms,
            judge0_memory_limit_kb,
            ...updateData
        } = body;
        
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const payload = {
            ...updateData,
            tags: tags || [],
            judge0_language_id: resolveJudge0LanguageId(updateData.language, Number(judge0_language_id || 0) || null),
            judge0_time_limit_ms: Number(judge0_time_limit_ms || 0) > 0 ? Number(judge0_time_limit_ms) : 2000,
            judge0_memory_limit_kb: Number(judge0_memory_limit_kb || 0) > 0 ? Number(judge0_memory_limit_kb) : 128000,
        };

        const { data, error } = await supabaseAdmin
            .from("coding_problems")
            .update(payload)
            .eq("id", id)
            .select();

        if (error) throw error;

        if (data[0]?.id) {
            await syncCodingProblemSampleTestCase(
                data[0].id,
                typeof data[0].expected_input === "string" ? data[0].expected_input : "",
                typeof data[0].expected_output === "string" ? data[0].expected_output : "",
            );
        }

        return NextResponse.json(data[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const { error } = await supabaseAdmin
            .from("coding_problems")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
