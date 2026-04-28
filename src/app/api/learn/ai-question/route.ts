import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLesson } from "@/lib/learn-db";
import { generateLearnAiQuestion } from "@/lib/learn-ai-question-service";
import type { LearnAiQuestionRequest } from "@/lib/learn-ai-question";
import {
    buildRateLimitKey,
    consumeRateLimit,
    getRateLimitHeaders,
} from "@/lib/security";

const MAX_TEXT_FIELD_LENGTH = 200;
const MAX_SECTION_CONTENT_LENGTH = 8000;

function isValidQuestionRequest(payload: Partial<LearnAiQuestionRequest>): payload is LearnAiQuestionRequest {
    return (
        typeof payload.courseSlug === "string" &&
        typeof payload.lessonSlug === "string" &&
        typeof payload.lessonTitle === "string" &&
        typeof payload.sectionId === "string" &&
        typeof payload.sectionHeading === "string" &&
        typeof payload.sectionIndex === "number" &&
        Number.isFinite(payload.sectionIndex) &&
        typeof payload.sectionContent === "string"
    );
}

function validateLengths(payload: LearnAiQuestionRequest) {
    return (
        payload.courseSlug.trim().length > 0 &&
        payload.courseSlug.length <= MAX_TEXT_FIELD_LENGTH &&
        payload.lessonSlug.trim().length > 0 &&
        payload.lessonSlug.length <= MAX_TEXT_FIELD_LENGTH &&
        payload.lessonTitle.trim().length > 0 &&
        payload.lessonTitle.length <= MAX_TEXT_FIELD_LENGTH &&
        payload.sectionId.trim().length > 0 &&
        payload.sectionId.length <= MAX_TEXT_FIELD_LENGTH &&
        payload.sectionHeading.trim().length > 0 &&
        payload.sectionHeading.length <= MAX_TEXT_FIELD_LENGTH &&
        payload.sectionIndex >= 0 &&
        payload.sectionIndex <= 999 &&
        payload.sectionContent.trim().length > 0 &&
        payload.sectionContent.length <= MAX_SECTION_CONTENT_LENGTH
    );
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = consumeRateLimit({
        key: buildRateLimitKey(req, "learn-ai-question", session.username),
        limit: 12,
        windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.ok) {
        return NextResponse.json(
            { success: false, error: "Too many AI question requests. Please wait and try again." },
            { status: 429, headers: getRateLimitHeaders(rateLimit) },
        );
    }

    try {
        const payload = (await req.json()) as Partial<LearnAiQuestionRequest>;

        if (!isValidQuestionRequest(payload) || !validateLengths(payload)) {
            return NextResponse.json(
                { success: false, error: "Dữ liệu yêu cầu tạo câu hỏi không hợp lệ." },
                { status: 400, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        const lesson = await getLesson(payload.courseSlug, payload.lessonSlug);
        if (!lesson || typeof lesson.content !== "string") {
            return NextResponse.json(
                { success: false, error: "Không tìm thấy bài học tương ứng." },
                { status: 404, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        const normalizedSectionContent = payload.sectionContent.trim();
        if (!lesson.content.includes(normalizedSectionContent)) {
            return NextResponse.json(
                { success: false, error: "Nội dung section không khớp với bài học hiện tại." },
                { status: 400, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        const result = await generateLearnAiQuestion({
            ...payload,
            lessonTitle: lesson.title,
            sectionContent: normalizedSectionContent,
        });

        return NextResponse.json(
            { success: true, question: result.question, interactionId: result.interactionId },
            { headers: getRateLimitHeaders(rateLimit) },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500, headers: getRateLimitHeaders(rateLimit) },
        );
    }
}
