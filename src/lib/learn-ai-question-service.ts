import { geminiModel } from "@/lib/gemini";
import { buildLearnAiQuestionPrompt } from "@/lib/ai-prompts";
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

async function generateWithGemini(prompt: string) {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function generateQuestion(request: LearnAiQuestionRequest) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const prompt = buildLearnAiQuestionPrompt(request, attempt > 0);
            const text = await generateWithGemini(prompt);
            const payload = JSON.parse(sanitizeModelJson(text));
            const validatedQuestion = validateLearnAiQuestion(payload);

            return normalizeQuestion(validatedQuestion);
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
