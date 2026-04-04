import { NextResponse } from "next/server";
import { generateLearnAiQuestion } from "@/lib/learn-ai-question-service";
import type { LearnAiQuestionRequest } from "@/lib/learn-ai-question";

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

export async function POST(req: Request) {
    try {
        const payload = (await req.json()) as Partial<LearnAiQuestionRequest>;

        if (!isValidQuestionRequest(payload)) {
            return NextResponse.json(
                { success: false, error: "Dữ liệu yêu cầu tạo câu hỏi không hợp lệ." },
                { status: 400 }
            );
        }

        const question = await generateLearnAiQuestion(payload);

        return NextResponse.json({ success: true, question });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
