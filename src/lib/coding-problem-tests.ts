import { supabaseAdmin } from "@/lib/supabase-admin";

export const CODING_PROBLEM_TEST_CASE_KINDS = ["sample", "generated_draft", "official"] as const;
export const CODING_PROBLEM_TEST_CASE_SOURCES = ["manual", "ai", "solution_code"] as const;
export const CODING_PROBLEM_TEST_CASE_STATUSES = ["draft", "approved", "rejected"] as const;
export const CODING_PROBLEM_TEST_VOLUME_CLASSES = ["few", "many"] as const;

export type CodingProblemTestCaseKind = typeof CODING_PROBLEM_TEST_CASE_KINDS[number];
export type CodingProblemTestCaseSource = typeof CODING_PROBLEM_TEST_CASE_SOURCES[number];
export type CodingProblemTestCaseStatus = typeof CODING_PROBLEM_TEST_CASE_STATUSES[number];
export type CodingProblemTestVolumeClass = typeof CODING_PROBLEM_TEST_VOLUME_CLASSES[number];

type RawCodingProblemTestCase = {
    id?: string | null;
    problem_id?: string | null;
    kind?: string | null;
    input_text?: string | null;
    expected_output?: string | null;
    is_hidden?: boolean | null;
    source?: string | null;
    position?: number | null;
    status?: string | null;
    rationale?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

export interface CodingProblemTestCase {
    id: string;
    problemId: string;
    kind: CodingProblemTestCaseKind;
    inputText: string;
    expectedOutput: string;
    isHidden: boolean;
    source: CodingProblemTestCaseSource;
    position: number;
    status: CodingProblemTestCaseStatus;
    rationale: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertCodingProblemTestCaseInput {
    problemId: string;
    kind: CodingProblemTestCaseKind;
    inputText: string;
    expectedOutput: string;
    isHidden: boolean;
    source: CodingProblemTestCaseSource;
    position: number;
    status: CodingProblemTestCaseStatus;
    rationale?: string | null;
}

function normalizeKind(value: unknown): CodingProblemTestCaseKind {
    return value === "generated_draft" || value === "official" ? value : "sample";
}

function normalizeSource(value: unknown): CodingProblemTestCaseSource {
    return value === "ai" || value === "solution_code" ? value : "manual";
}

function normalizeStatus(value: unknown): CodingProblemTestCaseStatus {
    if (value === "approved" || value === "rejected") {
        return value;
    }

    return "draft";
}

function normalizeText(value: unknown, fallback = "") {
    return typeof value === "string" ? value : fallback;
}

function normalizeNullableText(value: unknown) {
    return typeof value === "string" ? value : null;
}

function normalizeRow(row: RawCodingProblemTestCase): CodingProblemTestCase {
    return {
        id: normalizeText(row.id),
        problemId: normalizeText(row.problem_id),
        kind: normalizeKind(row.kind),
        inputText: normalizeText(row.input_text),
        expectedOutput: normalizeText(row.expected_output),
        isHidden: row.is_hidden === true,
        source: normalizeSource(row.source),
        position: typeof row.position === "number" && Number.isFinite(row.position) ? row.position : 0,
        status: normalizeStatus(row.status),
        rationale: normalizeNullableText(row.rationale),
        createdAt: normalizeText(row.created_at, new Date(0).toISOString()),
        updatedAt: normalizeText(row.updated_at, new Date(0).toISOString()),
    };
}

function sortTestCases(testCases: CodingProblemTestCase[]) {
    const kindPriority: Record<CodingProblemTestCaseKind, number> = {
        sample: 0,
        generated_draft: 1,
        official: 2,
    };

    return [...testCases].sort((left, right) => {
        if (kindPriority[left.kind] !== kindPriority[right.kind]) {
            return kindPriority[left.kind] - kindPriority[right.kind];
        }

        if (left.position !== right.position) {
            return left.position - right.position;
        }

        return left.createdAt.localeCompare(right.createdAt);
    });
}

export async function listCodingProblemTestCases(problemId: string) {
    const { data, error } = await supabaseAdmin
        .from("coding_problem_test_cases")
        .select("*")
        .eq("problem_id", problemId);

    if (error) {
        throw error;
    }

    return sortTestCases(((data || []) as RawCodingProblemTestCase[]).map(normalizeRow));
}

export async function listOfficialCodingProblemTestCases(problemId: string) {
    const testCases = await listCodingProblemTestCases(problemId);
    return testCases.filter((testCase) => testCase.kind === "official" && testCase.status === "approved");
}

export async function syncCodingProblemSampleTestCase(problemId: string, sampleInput: string, sampleOutput: string) {
    const { error } = await supabaseAdmin
        .from("coding_problem_test_cases")
        .upsert(
            [
                {
                    problem_id: problemId,
                    kind: "sample",
                    input_text: sampleInput || "",
                    expected_output: sampleOutput || "",
                    is_hidden: false,
                    source: "manual",
                    position: 0,
                    status: "approved",
                    rationale: "Sample do admin cung cấp",
                },
            ],
            {
                onConflict: "problem_id,kind,source,position",
            },
        );

    if (error) {
        throw error;
    }
}

export async function replaceGeneratedDraftTestCases(problemId: string, testCases: UpsertCodingProblemTestCaseInput[]) {
    const { error: deleteError } = await supabaseAdmin
        .from("coding_problem_test_cases")
        .delete()
        .eq("problem_id", problemId)
        .eq("kind", "generated_draft");

    if (deleteError) {
        throw deleteError;
    }

    if (testCases.length === 0) {
        return [] as CodingProblemTestCase[];
    }

    const { data, error } = await supabaseAdmin
        .from("coding_problem_test_cases")
        .insert(
            testCases.map((testCase) => ({
                problem_id: testCase.problemId,
                kind: testCase.kind,
                input_text: testCase.inputText,
                expected_output: testCase.expectedOutput,
                is_hidden: testCase.isHidden,
                source: testCase.source,
                position: testCase.position,
                status: testCase.status,
                rationale: testCase.rationale ?? null,
            })),
        )
        .select("*");

    if (error) {
        throw error;
    }

    return sortTestCases(((data || []) as RawCodingProblemTestCase[]).map(normalizeRow));
}

export async function approveGeneratedDraftTestCases(problemId: string, ids?: string[]) {
    let query = supabaseAdmin
        .from("coding_problem_test_cases")
        .select("*")
        .eq("problem_id", problemId)
        .eq("kind", "generated_draft")
        .eq("status", "draft");

    if (ids && ids.length > 0) {
        query = query.in("id", ids);
    }

    const { data: draftData, error: draftError } = await query;

    if (draftError) {
        throw draftError;
    }

    const draftCases = ((draftData || []) as RawCodingProblemTestCase[]).map(normalizeRow);

    if (draftCases.length === 0) {
        return [] as CodingProblemTestCase[];
    }

    const { error: deleteOfficialError } = await supabaseAdmin
        .from("coding_problem_test_cases")
        .delete()
        .eq("problem_id", problemId)
        .eq("kind", "official");

    if (deleteOfficialError) {
        throw deleteOfficialError;
    }

    const { data: officialData, error: insertOfficialError } = await supabaseAdmin
        .from("coding_problem_test_cases")
        .insert(
            draftCases.map((testCase) => ({
                problem_id: testCase.problemId,
                kind: "official",
                input_text: testCase.inputText,
                expected_output: testCase.expectedOutput,
                is_hidden: true,
                source: testCase.source,
                position: testCase.position,
                status: "approved",
                rationale: testCase.rationale,
            })),
        )
        .select("*");

    if (insertOfficialError) {
        throw insertOfficialError;
    }

    const { error: updateDraftError } = await supabaseAdmin
        .from("coding_problem_test_cases")
        .update({
            status: "approved",
        })
        .in("id", draftCases.map((testCase) => testCase.id));

    if (updateDraftError) {
        throw updateDraftError;
    }

    return sortTestCases(((officialData || []) as RawCodingProblemTestCase[]).map(normalizeRow));
}

export async function rejectGeneratedDraftTestCases(problemId: string, ids?: string[]) {
    let query = supabaseAdmin
        .from("coding_problem_test_cases")
        .update({
            status: "rejected",
        })
        .eq("problem_id", problemId)
        .eq("kind", "generated_draft")
        .eq("status", "draft");

    if (ids && ids.length > 0) {
        query = query.in("id", ids);
    }

    const { data, error } = await query.select("*");

    if (error) {
        throw error;
    }

    return sortTestCases(((data || []) as RawCodingProblemTestCase[]).map(normalizeRow));
}
