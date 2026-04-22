import {
    GEMINI_MODEL_NAME,
    GEMINI_MODEL_PROVIDER,
    generateGeminiResponseText,
} from "@/lib/gemini";
import { AI_PROMPT_IDS, buildLearnAiQuestionPrompt } from "@/lib/ai-prompts";
import { LoggedAiTaskError, runLoggedAiTask } from "@/lib/ai-logging";
import {
    type LearnAiQuestion,
    type LearnAiQuestionRequest,
    sanitizeCodeAnswer,
    sanitizeKeywordGroups,
    sanitizeModelJson,
    sanitizeNumericAnswer,
    validateLearnAiQuestion,
} from "@/lib/learn-ai-question";

function normalizeQuestion(question: LearnAiQuestion): LearnAiQuestion {
    if (question.questionType === "code_completion") {
        return {
            ...question,
            acceptedAnswers: question.acceptedAnswers.map(sanitizeCodeAnswer).filter(Boolean),
        };
    }

    if (question.questionType === "short_concept") {
        return {
            ...question,
            canonicalAnswer: question.canonicalAnswer.trim(),
            acceptedAnswers: question.acceptedAnswers.map((answer) => answer.trim()).filter(Boolean),
            keywordGroups: sanitizeKeywordGroups(question.keywordGroups),
        };
    }

    return {
        ...question,
        correctAnswer: sanitizeNumericAnswer(question.correctAnswer),
        acceptedAnswers: question.acceptedAnswers.map(sanitizeNumericAnswer).filter(Boolean),
    };
}

async function generateQuestion(request: LearnAiQuestionRequest) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const prompt = buildLearnAiQuestionPrompt(request, attempt > 0);
            return await runLoggedAiTask({
                taskType: "learn-ai-question",
                promptId: AI_PROMPT_IDS.LEARN_AI_QUESTION,
                endpoint: "/api/learn/ai-question",
                modelProvider: GEMINI_MODEL_PROVIDER,
                modelName: GEMINI_MODEL_NAME,
                promptText: prompt,
                requestPayload: {
                    courseSlug: request.courseSlug,
                    lessonSlug: request.lessonSlug,
                    lessonTitle: request.lessonTitle,
                    sectionId: request.sectionId,
                    sectionHeading: request.sectionHeading,
                    sectionIndex: request.sectionIndex,
                    sectionContentLength: request.sectionContent.trim().length,
                },
                metadata: {
                    attempt: attempt + 1,
                    isRetry: attempt > 0,
                },
                generateResponseText: generateGeminiResponseText,
                parseResponse: (text) => {
                    let payload: unknown;

                    try {
                        payload = JSON.parse(sanitizeModelJson(text));
                    } catch (error) {
                        throw new LoggedAiTaskError("Failed to parse learn AI question JSON", { responseText: text }, error);
                    }

                    try {
                        const validatedQuestion = validateLearnAiQuestion(payload);

                        return {
                            value: normalizeQuestion(validatedQuestion),
                            responsePayload: payload,
                        };
                    } catch (error) {
                        throw new LoggedAiTaskError(
                            error instanceof Error ? error.message : "Invalid learn AI question payload",
                            {
                                responseText: text,
                                responsePayload: payload,
                            },
                            error,
                        );
                    }
                },
            });
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
        }
    }

    throw lastError || new Error("Unknown Gemini error");
}

export async function generateLearnAiQuestion(request: LearnAiQuestionRequest): Promise<LearnAiQuestion> {
    if (!request.sectionContent.trim()) {
        throw new Error("Phần nội dung này chưa đủ dữ liệu để tạo câu hỏi.");
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Thiếu cấu hình Gemini cho tính năng này.");
    }

    try {
        return await generateQuestion(request);
    } catch (error) {
        const lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
        console.error("Learn AI Question Error:", lastError);
        throw new Error("AI chưa tạo được câu hỏi hợp lệ cho phần này.");
    }
}
