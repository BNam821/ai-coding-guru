import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateCodeFeedback, buildFirstFailSummary } from "@/lib/code-problem-ai";
import { listOfficialCodingProblemTestCases } from "@/lib/coding-problem-tests";
import { recordProblemScore } from "@/lib/coding-problems-service";
import { executeJudge0Submission, resolveJudge0LanguageId } from "@/lib/judge0";

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

function getExerciseLabel(exerciseType?: string) {
    return exerciseType === "fix_bug" ? "Sửa lỗi code" : "Hoàn thiện code";
}

function calculateRuleBasedScore(input: {
    totalTests: number;
    passedTests: number;
    judgeStatus: string;
    submittedUnchangedStarterCode: boolean;
}) {
    if (input.submittedUnchangedStarterCode || input.totalTests <= 0) {
        return 0;
    }

    if (input.passedTests >= input.totalTests) {
        return 100;
    }

    if (input.passedTests <= 0) {
        return 0;
    }

    let score = Math.round((input.passedTests / input.totalTests) * 100);

    if (input.judgeStatus === "runtime_error" || input.judgeStatus === "time_limit_exceeded") {
        score -= 10;
    }

    return Math.max(0, Math.min(99, score));
}

function getAggregateJudgeStatus(statuses: string[]) {
    if (statuses.length === 0) {
        return "not_ready";
    }

    if (statuses.every((status) => status === "accepted")) {
        return "accepted";
    }

    if (statuses.includes("compilation_error")) {
        return "compilation_error";
    }

    if (statuses.includes("internal_error")) {
        return "internal_error";
    }

    if (statuses.includes("time_limit_exceeded")) {
        return "time_limit_exceeded";
    }

    if (statuses.includes("runtime_error")) {
        return "runtime_error";
    }

    return "wrong_answer";
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const body = await req.json();
        const {
            userCode,
            problemId,
            problemObj,
            exerciseType,
            starterCode,
            bugChangeSummary,
            zeroScoreStreakBeforeSubmission,
        } = body;

        if (!userCode || !problemObj) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const effectiveProblemId = typeof problemObj.id === "string" ? problemObj.id : problemId;
        const isFixBugExercise = exerciseType === "fix_bug";
        const previousZeroScoreStreak = parseZeroScoreStreak(zeroScoreStreakBeforeSubmission);
        const submittedUnchangedStarterCode = isFixBugExercise
            && typeof starterCode === "string"
            && normalizeCode(userCode) === normalizeCode(starterCode);

        if (!effectiveProblemId) {
            return NextResponse.json({ error: "Missing problem ID" }, { status: 400 });
        }

        const officialTests = await listOfficialCodingProblemTestCases(effectiveProblemId);

        if (officialTests.length === 0) {
            return NextResponse.json({
                actualOutput: "",
                passedTests: 0,
                totalTests: 0,
                firstFailedTest: null,
                judgeStatus: "not_ready",
                score: 0,
                feedback: "Bài tập này chưa sẵn sàng để chấm bằng Judge0 vì chưa có bộ test chính thức.",
                suggestion: "Vui lòng quay lại sau khi quản trị viên duyệt test case cho bài tập này.",
                interactionId: null,
            });
        }

        const executions: Array<{
            id: string;
            position: number;
            rationale: string | null;
            normalizedStatus: string;
            statusDescription: string;
            actualOutput: string;
            stdout: string;
            stderr: string;
            compileOutput: string;
        }> = [];

        for (const testCase of officialTests) {
            const execution = await executeJudge0Submission({
                username: session?.username ?? null,
                endpoint: "/api/code-evaluate",
                sourceCode: userCode,
                language: typeof problemObj.language === "string" ? problemObj.language : "cpp",
                languageId: resolveJudge0LanguageId(
                    typeof problemObj.language === "string" ? problemObj.language : "cpp",
                    typeof problemObj.judge0_language_id === "number" ? problemObj.judge0_language_id : null,
                ),
                stdin: testCase.inputText,
                expectedOutput: testCase.expectedOutput,
                timeLimitMs: typeof problemObj.judge0_time_limit_ms === "number" ? problemObj.judge0_time_limit_ms : 2000,
                memoryLimitKb: typeof problemObj.judge0_memory_limit_kb === "number" ? problemObj.judge0_memory_limit_kb : 128000,
                requestPayload: {
                    problemId: effectiveProblemId,
                    testCaseId: testCase.id,
                    testPosition: testCase.position,
                },
                metadata: {
                    kind: "official",
                    isHidden: testCase.isHidden,
                },
            });

            executions.push({
                id: testCase.id,
                position: testCase.position,
                rationale: testCase.rationale,
                normalizedStatus: execution.normalizedStatus,
                statusDescription: execution.statusDescription,
                actualOutput: execution.actualOutput,
                stdout: execution.stdout,
                stderr: execution.stderr,
                compileOutput: execution.compileOutput,
            });

            if (execution.normalizedStatus === "compilation_error" || execution.normalizedStatus === "internal_error") {
                break;
            }
        }

        const passedTests = executions.filter((execution) => execution.normalizedStatus === "accepted").length;
        const firstFailedTest = executions.find((execution) => execution.normalizedStatus !== "accepted") || null;
        const judgeStatus = getAggregateJudgeStatus(executions.map((execution) => execution.normalizedStatus));
        const score = calculateRuleBasedScore({
            totalTests: officialTests.length,
            passedTests,
            judgeStatus,
            submittedUnchangedStarterCode,
        });
        const actualOutput = firstFailedTest?.actualOutput || executions.at(-1)?.actualOutput || "";

        let feedback = "";
        let suggestion = "";
        let interactionId: string | null = null;

        try {
            const feedbackResult = await generateCodeFeedback({
                username: session?.username ?? null,
                endpoint: "/api/code-evaluate",
                problem: {
                    ...problemObj,
                    id: effectiveProblemId,
                },
                exerciseLabel: getExerciseLabel(exerciseType),
                exerciseType: typeof exerciseType === "string" ? exerciseType : "solve",
                submittedUnchangedStarterCode,
                previousZeroScoreStreak,
                totalTests: officialTests.length,
                passedTests,
                score,
                judgeStatus,
                firstFailSummary: firstFailedTest
                    ? buildFirstFailSummary({
                        position: firstFailedTest.position,
                        status: firstFailedTest.statusDescription,
                        rationale: firstFailedTest.rationale,
                        actualOutput: firstFailedTest.actualOutput,
                    })
                    : "Không có",
                compileOutput: firstFailedTest?.compileOutput || "",
                stderr: firstFailedTest?.stderr || "",
                actualOutput,
                userCode,
                bugChangeSummary,
            });

            feedback = feedbackResult.feedback;
            suggestion = feedbackResult.suggestion;
            interactionId = feedbackResult.interactionId;
        } catch (feedbackError) {
            console.error("Lỗi khi sinh nhận xét AI từ kết quả Judge0:", feedbackError);
            feedback = score === 100
                ? "Bạn đã đạt điểm tuyệt đối! Tôi không có gì cần góp ý cho đoạn code này cả."
                : "Hệ thống đã chấm được bài bằng Judge0 nhưng AI chưa tạo được nhận xét lúc này.";
            suggestion = score === 100
                ? ""
                : "Hãy xem output thực tế, trạng thái test và tiếp tục kiểm tra lại logic xử lý của chương trình.";
        }

        if (session?.username) {
            await recordProblemScore(session.username, effectiveProblemId, score);
        }

        return NextResponse.json({
            actualOutput,
            passedTests,
            totalTests: officialTests.length,
            firstFailedTest: firstFailedTest
                ? {
                    position: firstFailedTest.position,
                    status: firstFailedTest.statusDescription,
                    rationale: firstFailedTest.rationale,
                    actualOutput: firstFailedTest.actualOutput,
                }
                : null,
            judgeStatus,
            score,
            feedback,
            suggestion,
            interactionId,
        });
    } catch (error) {
        console.error("Lỗi khi chấm bài code bằng Judge0:", error);
        return NextResponse.json(
            {
                actualOutput: "Không thể chấm bài bằng Judge0 lúc này.",
                passedTests: 0,
                totalTests: 0,
                firstFailedTest: null,
                judgeStatus: "internal_error",
                score: 0,
                feedback: "Hệ thống Judge0 hoặc lớp nhận xét AI đang gặp sự cố.",
                suggestion: "Vui lòng thử lại sau ít phút. Nếu lỗi lặp lại, hãy báo cho quản trị viên kiểm tra cấu hình Judge0.",
                interactionId: null,
            },
            { status: 500 },
        );
    }
}
