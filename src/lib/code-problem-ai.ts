import { supabaseAdmin } from "@/lib/supabase-admin";
import { LoggedAiTaskError, runLoggedAiTask } from "@/lib/ai-logging";
import {
    type CodingProblem,
    type CodingProblemTestGenerationStatus,
} from "@/lib/coding-problems-service";
import {
    type CodingProblemTestVolumeClass,
    replaceGeneratedDraftTestCases,
} from "@/lib/coding-problem-tests";
import { executeJudge0Submission, resolveJudge0LanguageId } from "@/lib/judge0";
import {
    AI_PROMPT_IDS,
    buildCodeFeedbackPrompt,
    buildCodeTestGenerationPrompt,
} from "@/lib/ai-prompts";
import {
    GEMINI_MODEL_NAME,
    GEMINI_MODEL_PROVIDER,
    generateGeminiResponseText,
} from "@/lib/gemini";
import { sanitizeModelJson } from "@/lib/learn-ai-question";

export interface GeneratedCodeTestDraft {
    inputText: string;
    rationale: string;
}

export interface GeneratedCodeTestsPayload {
    testVolumeClass: CodingProblemTestVolumeClass;
    tests: GeneratedCodeTestDraft[];
}

export interface MaterializedCodeTestDraft extends GeneratedCodeTestDraft {
    expectedOutput: string;
    position: number;
}

export interface GenerateDraftTestsResult {
    interactionId: string | null;
    testVolumeClass: CodingProblemTestVolumeClass;
    tests: MaterializedCodeTestDraft[];
}

export interface GenerateCodeFeedbackInput {
    username?: string | null;
    endpoint: string;
    problem: CodingProblem;
    exerciseLabel: string;
    exerciseType: string;
    submittedUnchangedStarterCode: boolean;
    previousZeroScoreStreak: number;
    totalTests: number;
    passedTests: number;
    score: number;
    judgeStatus: string;
    firstFailSummary: string;
    compileOutput: string;
    stderr: string;
    actualOutput: string;
    userCode: string;
    bugChangeSummary?: string;
}

export interface GenerateCodeFeedbackResult {
    interactionId: string | null;
    feedback: string;
    suggestion: string;
}

type RawGeneratedTestPayload = {
    inputText?: unknown;
    rationale?: unknown;
};

function getExpectedGeneratedTestCount(testVolumeClass: CodingProblemTestVolumeClass) {
    return testVolumeClass === "many" ? 8 : 3;
}

function normalizeText(value: unknown, fallback = "") {
    return typeof value === "string" ? value : fallback;
}

function sanitizeForSingleLine(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function sanitizeStudentCodeForAi(userCode: string) {
    return userCode
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
        .replace(/#.*$/gm, " ")
        .replace(/"(?:\\.|[^"\\])*"/g, '"__STRING__"')
        .replace(/'(?:\\.|[^'\\])*'/g, "'__STRING__'")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 4000);
}

function validateGeneratedTestsPayload(payload: unknown): GeneratedCodeTestsPayload {
    if (!payload || typeof payload !== "object") {
        throw new Error("Generated tests payload must be an object");
    }

    const testVolumeClass = (payload as { testVolumeClass?: unknown }).testVolumeClass;
    if (testVolumeClass !== "few" && testVolumeClass !== "many") {
        throw new Error('AI must return "testVolumeClass" as "few" or "many"');
    }

    const testsValue = (payload as { tests?: unknown }).tests;
    if (!Array.isArray(testsValue)) {
        throw new Error('AI must return "tests" as an array');
    }

    const tests = testsValue.map((item, index) => {
        const payloadItem = item as RawGeneratedTestPayload;
        const inputText = normalizeText(payloadItem.inputText);
        const rationale = normalizeText(payloadItem.rationale).trim();

        if (payloadItem.inputText !== "" && !inputText && testVolumeClass === "many") {
            throw new Error(`Generated test #${index + 1} is missing "inputText"`);
        }

        if (!rationale) {
            throw new Error(`Generated test #${index + 1} is missing "rationale"`);
        }

        return {
            inputText,
            rationale,
        };
    });

    const expectedCount = getExpectedGeneratedTestCount(testVolumeClass);
    if (tests.length !== expectedCount) {
        throw new Error(`AI returned ${tests.length} tests, expected ${expectedCount}`);
    }

    return {
        testVolumeClass,
        tests,
    };
}

async function updateProblemGenerationState(
    problemId: string,
    status: CodingProblemTestGenerationStatus,
    patch?: {
        testVolumeClass?: CodingProblemTestVolumeClass | null;
        testGenerationError?: string | null;
    },
) {
    const payload: Record<string, unknown> = {
        test_generation_status: status,
        test_generation_error: patch?.testGenerationError ?? null,
    };

    if (patch && "testVolumeClass" in patch) {
        payload.test_volume_class = patch.testVolumeClass;
    }

    const { error } = await supabaseAdmin
        .from("coding_problems")
        .update(payload)
        .eq("id", problemId);

    if (error) {
        throw error;
    }
}

function buildFirstFailSummary(firstFailedTest: {
    position: number;
    status: string;
    rationale: string | null;
    actualOutput: string;
}) {
    const fragments = [
        `Test #${firstFailedTest.position + 1}`,
        `trạng thái ${firstFailedTest.status}`,
    ];

    if (firstFailedTest.rationale) {
        fragments.push(`lý do test: ${sanitizeForSingleLine(firstFailedTest.rationale)}`);
    }

    if (firstFailedTest.actualOutput) {
        fragments.push(`output thực tế: ${sanitizeForSingleLine(firstFailedTest.actualOutput).slice(0, 200)}`);
    }

    return fragments.join(", ");
}

export async function generateDraftTestsForProblem(problem: CodingProblem, username?: string | null): Promise<GenerateDraftTestsResult> {
    await updateProblemGenerationState(problem.id, "generating", {
        testGenerationError: null,
    });

    try {
        const prompt = buildCodeTestGenerationPrompt({
            title: problem.title,
            description: problem.description,
            sampleInput: problem.expected_input || "",
            sampleOutput: problem.expected_output,
            solutionCode: problem.solution_code,
            language: problem.language,
        });

        const aiResult = await runLoggedAiTask({
            username: username ?? null,
            taskType: "code-test-generation",
            promptId: AI_PROMPT_IDS.CODE_TEST_GENERATION,
            endpoint: `/api/admin/problems/${problem.id}/generate-tests`,
            modelProvider: GEMINI_MODEL_PROVIDER,
            modelName: GEMINI_MODEL_NAME,
            promptText: prompt,
            requestPayload: {
                problemId: problem.id,
                language: problem.language,
                hasSampleInput: Boolean(problem.expected_input),
                solutionCodeLength: problem.solution_code.length,
            },
            metadata: {
                problemTitle: problem.title,
            },
            generateResponseText: generateGeminiResponseText,
            parseResponse: (responseText) => {
                let payload: unknown;

                try {
                    payload = JSON.parse(sanitizeModelJson(responseText));
                } catch (error) {
                    throw new LoggedAiTaskError("Failed to parse generated tests JSON", { responseText }, error);
                }

                let validatedPayload: GeneratedCodeTestsPayload;
                try {
                    validatedPayload = validateGeneratedTestsPayload(payload);
                } catch (error) {
                    throw new LoggedAiTaskError(
                        error instanceof Error ? error.message : "Invalid generated tests payload",
                        {
                            responseText,
                            responsePayload: payload,
                        },
                        error,
                    );
                }

                return {
                    value: validatedPayload,
                    responsePayload: payload,
                    metadata: {
                        testVolumeClass: validatedPayload.testVolumeClass,
                        generatedTestCount: validatedPayload.tests.length,
                    },
                };
            },
        });

        const materializedTests: MaterializedCodeTestDraft[] = [];

        for (let index = 0; index < aiResult.value.tests.length; index += 1) {
            const draft = aiResult.value.tests[index];
            const execution = await executeJudge0Submission({
                username: username ?? null,
                endpoint: `/api/admin/problems/${problem.id}/generate-tests/materialize`,
                promptId: AI_PROMPT_IDS.CODE_TEST_GENERATION,
                sourceCode: problem.solution_code,
                language: problem.language,
                languageId: problem.judge0_language_id ?? resolveJudge0LanguageId(problem.language),
                stdin: draft.inputText,
                timeLimitMs: problem.judge0_time_limit_ms ?? 2000,
                memoryLimitKb: problem.judge0_memory_limit_kb ?? 128000,
                requestPayload: {
                    problemId: problem.id,
                    testPosition: index,
                    mode: "materialize_expected_output",
                },
                metadata: {
                    kind: "generated_draft",
                },
            });

            if (execution.normalizedStatus !== "accepted") {
                throw new Error(
                    `Solution code failed while materializing test #${index + 1}: ${execution.statusDescription}`,
                );
            }

            materializedTests.push({
                inputText: draft.inputText,
                rationale: draft.rationale,
                expectedOutput: execution.stdout,
                position: index,
            });
        }

        await replaceGeneratedDraftTestCases(
            problem.id,
            materializedTests.map((testCase) => ({
                problemId: problem.id,
                kind: "generated_draft",
                inputText: testCase.inputText,
                expectedOutput: testCase.expectedOutput,
                isHidden: true,
                source: "ai",
                position: testCase.position,
                status: "draft",
                rationale: testCase.rationale,
            })),
        );

        await updateProblemGenerationState(problem.id, "ready", {
            testVolumeClass: aiResult.value.testVolumeClass,
            testGenerationError: null,
        });

        return {
            interactionId: aiResult.interactionId,
            testVolumeClass: aiResult.value.testVolumeClass,
            tests: materializedTests,
        };
    } catch (error) {
        await updateProblemGenerationState(problem.id, "failed", {
            testGenerationError: error instanceof Error ? error.message : "Không thể sinh test case bằng AI",
        });
        throw error;
    }
}

export async function generateCodeFeedback(input: GenerateCodeFeedbackInput): Promise<GenerateCodeFeedbackResult> {
    const prompt = buildCodeFeedbackPrompt({
        exerciseLabel: input.exerciseLabel,
        exerciseType: input.exerciseType,
        problemTitle: input.problem.title,
        problemDescription: input.problem.description,
        language: input.problem.language,
        submittedUnchangedStarterCode: input.submittedUnchangedStarterCode,
        previousZeroScoreStreak: input.previousZeroScoreStreak,
        totalTests: input.totalTests,
        passedTests: input.passedTests,
        score: input.score,
        judgeStatus: input.judgeStatus,
        firstFailSummary: input.firstFailSummary,
        compileOutput: input.compileOutput,
        stderr: input.stderr,
        actualOutput: input.actualOutput,
        sanitizedUserCode: sanitizeStudentCodeForAi(input.userCode),
        bugChangeSummary: input.bugChangeSummary,
    });

    const feedbackResult = await runLoggedAiTask({
        username: input.username ?? null,
        taskType: "code-feedback",
        promptId: AI_PROMPT_IDS.CODE_FEEDBACK,
        endpoint: input.endpoint,
        modelProvider: GEMINI_MODEL_PROVIDER,
        modelName: GEMINI_MODEL_NAME,
        promptText: prompt,
        requestPayload: {
            problemId: input.problem.id,
            exerciseType: input.exerciseType,
            passedTests: input.passedTests,
            totalTests: input.totalTests,
            score: input.score,
            judgeStatus: input.judgeStatus,
            submittedUnchangedStarterCode: input.submittedUnchangedStarterCode,
        },
        metadata: {
            firstFailSummary: input.firstFailSummary,
        },
        generateResponseText: generateGeminiResponseText,
        parseResponse: (responseText) => {
            let payload: Record<string, unknown>;

            try {
                payload = JSON.parse(sanitizeModelJson(responseText)) as Record<string, unknown>;
            } catch (error) {
                throw new LoggedAiTaskError("Failed to parse code feedback JSON", { responseText }, error);
            }

            const feedback = normalizeText(payload.feedback).trim();
            const suggestion = normalizeText(payload.suggestion).trim();

            if (!feedback && input.score !== 100) {
                throw new LoggedAiTaskError(
                    'AI code feedback payload is missing "feedback"',
                    { responseText, responsePayload: payload },
                );
            }

            return {
                value: {
                    feedback,
                    suggestion,
                },
                responsePayload: payload,
            };
        },
    });

    return {
        interactionId: feedbackResult.interactionId,
        feedback: feedbackResult.value.feedback,
        suggestion: feedbackResult.value.suggestion,
    };
}

export { buildFirstFailSummary, sanitizeStudentCodeForAi };
