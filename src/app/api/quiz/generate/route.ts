import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateQuizForUser } from "@/lib/quiz-service";
import {
    buildRateLimitKey,
    consumeRateLimit,
    getRateLimitHeaders,
} from "@/lib/security";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const rateLimit = consumeRateLimit({
            key: buildRateLimitKey(req, "quiz-generate", session.username),
            limit: 5,
            windowMs: 15 * 60 * 1000,
        });

        if (!rateLimit.ok) {
            return NextResponse.json(
                { success: false, error: "Too many quiz generation requests. Please wait and try again." },
                { status: 429, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        let body: { mode?: "auto" | "custom"; selectedLessonIds?: string[] } = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const selectedLessonIds = Array.from(
            new Set(
                Array.isArray(body.selectedLessonIds)
                    ? body.selectedLessonIds.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
                    : [],
            ),
        ).slice(0, 12);

        const result = await generateQuizForUser(session.username, {
            mode: body.mode === "custom" ? "custom" : "auto",
            selectedLessonIds,
        });

        return NextResponse.json(
            { success: true, questions: result.questions, interactionId: result.interactionId },
            { headers: getRateLimitHeaders(rateLimit) },
        );
    } catch (error: any) {
        console.error("Quiz API Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
