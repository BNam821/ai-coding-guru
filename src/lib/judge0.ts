import { persistAiInteraction } from "@/lib/ai-interactions";

export const JUDGE0_MODEL_PROVIDER = "judge0";
export const JUDGE0_MODEL_NAME = "judge0-cloud";

export const JUDGE0_TERMINAL_STATUS_IDS = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

export type SupportedJudge0Language = "cpp" | "python" | "javascript";

export type Judge0NormalizedStatus =
    | "accepted"
    | "wrong_answer"
    | "time_limit_exceeded"
    | "compilation_error"
    | "runtime_error"
    | "internal_error"
    | "in_queue"
    | "processing";

type Judge0SubmissionStatus = {
    id?: number;
    description?: string;
};

type Judge0SubmissionResponse = {
    token?: string;
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
    message?: string | null;
    time?: string | null;
    memory?: number | null;
    status?: Judge0SubmissionStatus | null;
};

export interface Judge0ExecutionInput {
    sourceCode: string;
    language: string;
    languageId?: number | null;
    stdin?: string;
    expectedOutput?: string;
    username?: string | null;
    endpoint: string;
    promptId?: string | null;
    requestPayload?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    timeLimitMs?: number | null;
    memoryLimitKb?: number | null;
}

export interface Judge0ExecutionResult {
    token: string | null;
    statusId: number;
    statusDescription: string;
    normalizedStatus: Judge0NormalizedStatus;
    passed: boolean;
    stdout: string;
    stderr: string;
    compileOutput: string;
    message: string;
    actualOutput: string;
    time: string | null;
    memory: number | null;
}

const DEFAULT_JUDGE0_LANGUAGE_IDS: Record<SupportedJudge0Language, number> = {
    cpp: 54,
    python: 71,
    javascript: 63,
};

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function encodeBase64(value: string) {
    return Buffer.from(value, "utf8").toString("base64");
}

function decodeBase64(value: string | null | undefined) {
    if (typeof value !== "string" || !value) {
        return "";
    }

    try {
        return Buffer.from(value, "base64").toString("utf8");
    } catch {
        return value;
    }
}

function getJudge0BaseUrl() {
    const baseUrl = process.env.JUDGE0_API_URL?.trim();

    if (!baseUrl) {
        throw new Error("Missing JUDGE0_API_URL environment variable");
    }

    return baseUrl.replace(/\/+$/, "");
}

function getJudge0Headers() {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    const authToken = process.env.JUDGE0_AUTH_TOKEN?.trim();
    if (authToken) {
        headers["X-Auth-Token"] = authToken;
    }

    return headers;
}

function normalizeLanguage(language: string): SupportedJudge0Language {
    if (language === "python") {
        return "python";
    }

    if (language === "javascript") {
        return "javascript";
    }

    return "cpp";
}

export function resolveJudge0LanguageId(language: string, overrideLanguageId?: number | null) {
    if (typeof overrideLanguageId === "number" && Number.isFinite(overrideLanguageId) && overrideLanguageId > 0) {
        return Math.floor(overrideLanguageId);
    }

    return DEFAULT_JUDGE0_LANGUAGE_IDS[normalizeLanguage(language)];
}

function normalizeJudge0Status(statusId: number): Judge0NormalizedStatus {
    if (statusId === 3) {
        return "accepted";
    }

    if (statusId === 4) {
        return "wrong_answer";
    }

    if (statusId === 5) {
        return "time_limit_exceeded";
    }

    if (statusId === 6) {
        return "compilation_error";
    }

    if ([7, 8, 9, 10, 11, 12, 14].includes(statusId)) {
        return "runtime_error";
    }

    if (statusId === 13) {
        return "internal_error";
    }

    if (statusId === 2) {
        return "processing";
    }

    return "in_queue";
}

function normalizeSubmissionResponse(payload: unknown): Judge0SubmissionResponse {
    if (!payload || typeof payload !== "object") {
        return {};
    }

    return payload as Judge0SubmissionResponse;
}

function parseExecutionResult(payload: unknown): Judge0ExecutionResult {
    const response = normalizeSubmissionResponse(payload);
    const statusId = typeof response.status?.id === "number" ? response.status.id : 13;
    const normalizedStatus = normalizeJudge0Status(statusId);
    const stdout = decodeBase64(response.stdout);
    const stderr = decodeBase64(response.stderr);
    const compileOutput = decodeBase64(response.compile_output);
    const message = decodeBase64(response.message);
    const actualOutput = stdout || compileOutput || stderr || message;

    return {
        token: typeof response.token === "string" ? response.token : null,
        statusId,
        statusDescription: typeof response.status?.description === "string"
            ? response.status.description
            : "Unknown status",
        normalizedStatus,
        passed: normalizedStatus === "accepted",
        stdout,
        stderr,
        compileOutput,
        message,
        actualOutput,
        time: typeof response.time === "string" ? response.time : null,
        memory: typeof response.memory === "number" && Number.isFinite(response.memory)
            ? response.memory
            : null,
    };
}

async function fetchJudge0Json(url: string, init?: RequestInit) {
    const response = await fetch(url, init);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage = payload && typeof payload === "object" && "error" in payload
            ? String((payload as { error?: unknown }).error || "Judge0 request failed")
            : `Judge0 request failed with status ${response.status}`;
        throw new Error(errorMessage);
    }

    return payload;
}

export async function executeJudge0Submission(input: Judge0ExecutionInput): Promise<Judge0ExecutionResult> {
    const startedAt = Date.now();
    const languageId = resolveJudge0LanguageId(input.language, input.languageId);
    const baseUrl = getJudge0BaseUrl();
    const headers = getJudge0Headers();
    const cpuTimeLimitSeconds = Math.max(1, Math.ceil((input.timeLimitMs ?? 2000) / 1000));
    const memoryLimitKb = Math.max(32000, input.memoryLimitKb ?? 128000);
    const requestPayload = {
        languageId,
        sourceCodeLength: input.sourceCode.length,
        stdinLength: (input.stdin || "").length,
        expectedOutputLength: (input.expectedOutput || "").length,
        timeLimitMs: input.timeLimitMs ?? 2000,
        memoryLimitKb,
        ...input.requestPayload,
    };

    let token: string | null = null;
    let responsePayload: unknown = null;

    try {
        const createPayload = await fetchJudge0Json(
            `${baseUrl}/submissions?base64_encoded=true&wait=false`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    language_id: languageId,
                    source_code: encodeBase64(input.sourceCode),
                    stdin: encodeBase64(input.stdin || ""),
                    expected_output: input.expectedOutput !== undefined
                        ? encodeBase64(input.expectedOutput)
                        : undefined,
                    cpu_time_limit: cpuTimeLimitSeconds,
                    wall_time_limit: Math.max(2, cpuTimeLimitSeconds + 1),
                    memory_limit: memoryLimitKb,
                }),
            },
        );

        token = typeof (createPayload as { token?: unknown }).token === "string"
            ? String((createPayload as { token?: unknown }).token)
            : null;

        if (!token) {
            throw new Error("Judge0 did not return a submission token");
        }

        for (let attempt = 0; attempt < 25; attempt += 1) {
            const submissionPayload = await fetchJudge0Json(
                `${baseUrl}/submissions/${token}?base64_encoded=true&fields=token,stdout,stderr,compile_output,message,status,time,memory`,
                {
                    method: "GET",
                    headers,
                    cache: "no-store",
                },
            );

            responsePayload = submissionPayload;

            const statusId = typeof (submissionPayload as Judge0SubmissionResponse).status?.id === "number"
                ? Number((submissionPayload as Judge0SubmissionResponse).status?.id)
                : 1;

            if (JUDGE0_TERMINAL_STATUS_IDS.has(statusId)) {
                const result = parseExecutionResult(submissionPayload);

                await persistAiInteraction({
                    username: input.username ?? null,
                    taskType: "judge0-execution",
                    promptId: input.promptId ?? null,
                    endpoint: input.endpoint,
                    modelProvider: JUDGE0_MODEL_PROVIDER,
                    modelName: JUDGE0_MODEL_NAME,
                    status: "success",
                    requestPayload,
                    metadata: {
                        ...input.metadata,
                        token,
                        judgeStatus: result.normalizedStatus,
                        statusDescription: result.statusDescription,
                        passed: result.passed,
                    },
                    responsePayload: submissionPayload,
                    responseText: result.actualOutput || null,
                    durationMs: Date.now() - startedAt,
                });

                return result;
            }

            await sleep(700);
        }

        throw new Error("Judge0 polling timed out");
    } catch (error) {
        await persistAiInteraction({
            username: input.username ?? null,
            taskType: "judge0-execution",
            promptId: input.promptId ?? null,
            endpoint: input.endpoint,
            modelProvider: JUDGE0_MODEL_PROVIDER,
            modelName: JUDGE0_MODEL_NAME,
            status: "error",
            requestPayload,
            metadata: {
                ...input.metadata,
                token,
            },
            responsePayload,
            errorMessage: error instanceof Error ? error.message : "Judge0 execution failed",
            durationMs: Date.now() - startedAt,
        });

        throw error;
    }
}
