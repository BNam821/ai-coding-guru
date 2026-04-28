import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCodingProblemById, recordProblemScore } from "@/lib/coding-problems-service";
import { parseCodeExerciseType, prepareCodingProblem } from "@/lib/code-exercise";
import { AI_PROMPT_IDS, buildCodeEvaluationPrompt } from "@/lib/ai-prompts";
import { LoggedAiTaskError, runLoggedAiTask } from "@/lib/ai-logging";
import {
    GEMINI_MODEL_NAME,
    GEMINI_MODEL_PROVIDER,
    generateGeminiResponseText,
} from "@/lib/gemini";
import { sanitizeModelJson } from "@/lib/learn-ai-question";
import {
    buildRateLimitKey,
    consumeRateLimit,
    getRateLimitHeaders,
} from "@/lib/security";

const MAX_CODE_LENGTH = 20000;

function normalizeCode(value: string) {
    return value
        .replace(/\r\n/g, "\n")
        .replace(/^\s+|\s+$/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n");
}

function parseZeroScoreStreak(value: unknown) {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return 0;
    }

    return Math.floor(parsedValue);
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = consumeRateLimit({
        key: buildRateLimitKey(req, "code-evaluate", session.username),
        limit: 20,
        windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.ok) {
        return NextResponse.json(
            { error: "Too many evaluation requests. Please wait and try again." },
            { status: 429, headers: getRateLimitHeaders(rateLimit) },
        );
    }

    try {
        const body = await req.json();
        const userCode = typeof body.userCode === "string" ? body.userCode : "";
        const problemId = typeof body.problemId === "string" ? body.problemId.trim() : "";
        const exerciseType = parseCodeExerciseType(
            typeof body.exerciseType === "string" ? body.exerciseType : undefined,
        );
        const previousZeroScoreStreak = parseZeroScoreStreak(body.zeroScoreStreakBeforeSubmission);

        if (!userCode.trim() || !problemId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400, headers: getRateLimitHeaders(rateLimit) });
        }

        if (userCode.length > MAX_CODE_LENGTH) {
            return NextResponse.json(
                { error: `Submitted code is too large. Maximum ${MAX_CODE_LENGTH} characters.` },
                { status: 413, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        const canonicalProblem = await getCodingProblemById(problemId);
        if (!canonicalProblem) {
            return NextResponse.json({ error: "Problem not found" }, { status: 404, headers: getRateLimitHeaders(rateLimit) });
        }

        const preparedProblem = prepareCodingProblem(canonicalProblem, exerciseType);
        const submittedUnchangedStarterCode = exerciseType === "fix_bug"
            && normalizeCode(userCode) === normalizeCode(preparedProblem.starterCode);

        const prompt = buildCodeEvaluationPrompt({
            userCode,
            problemObj: preparedProblem,
            exerciseType,
            starterCode: preparedProblem.starterCode,
            bugChangeSummary: preparedProblem.bugChangeSummary,
            previousZeroScoreStreak,
            submittedUnchangedStarterCode,
        });

        const finalData = await runLoggedAiTask({
            username: session.username,
            taskType: "code-evaluation",
            promptId: AI_PROMPT_IDS.CODE_EVALUATION,
            endpoint: "/api/code-evaluate",
            modelProvider: GEMINI_MODEL_PROVIDER,
            modelName: GEMINI_MODEL_NAME,
            promptText: prompt,
            requestPayload: {
                problemId: preparedProblem.id,
                problemTitle: preparedProblem.title,
                exerciseType,
                submittedUnchangedStarterCode,
                previousZeroScoreStreak,
                userCodeLength: userCode.length,
                starterCodeLength: preparedProblem.starterCode.length,
                bugChangeSummaryLength: preparedProblem.bugChangeSummary?.length || 0,
            },
            metadata: {
                hasExpectedInput: typeof preparedProblem.expected_input === "string"
                    && preparedProblem.expected_input.trim().length > 0,
            },
            generateResponseText: generateGeminiResponseText,
            parseResponse: (textArea) => {
                let parsedData: Record<string, unknown>;

                try {
                    parsedData = JSON.parse(sanitizeModelJson(textArea)) as Record<string, unknown>;
                } catch (error) {
                    throw new LoggedAiTaskError("Failed to parse code evaluation JSON", { responseText: textArea }, error);
                }

                const result: Record<string, unknown> & { score: number; feedback?: string } = {
                    ...parsedData,
                    score: submittedUnchangedStarterCode ? 0 : Number(parsedData.score || 0),
                };

                if (submittedUnchangedStarterCode && !result.feedback) {
                    result.feedback = "Bạn đang nộp lại nguyên trạng đoạn code lỗi ban đầu, nên bài này được chấm 0 điểm.";
                }

                return {
                    value: result,
                    responsePayload: parsedData,
                };
            },
        });

        await recordProblemScore(session.username, preparedProblem.id, finalData.value.score || 0);

        return NextResponse.json(
            {
                ...finalData.value,
                interactionId: finalData.interactionId,
            },
            { headers: getRateLimitHeaders(rateLimit) },
        );
    } catch (error) {
        console.error("Lỗi khi chấm bài code:", error);
        return NextResponse.json(
            {
                actualOutput: "Lỗi hệ thống hoặc lỗi thực thi AI.",
                score: 0,
                feedback: "Hệ thống AI không phản hồi JSON tiêu chuẩn hoặc máy chủ gặp vấn đề.",
            },
            { status: 500, headers: getRateLimitHeaders(rateLimit) },
        );
    }
}
