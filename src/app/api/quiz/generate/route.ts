import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateQuizForUser } from "@/lib/quiz-service";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        let body: { mode?: "auto" | "custom"; selectedLessonIds?: string[] } = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const result = await generateQuizForUser(session.username, {
            mode: body.mode === "custom" ? "custom" : "auto",
            selectedLessonIds: Array.isArray(body.selectedLessonIds)
                ? body.selectedLessonIds.filter((item): item is string => typeof item === "string")
                : [],
        });

        return NextResponse.json({ success: true, questions: result.questions, interactionId: result.interactionId });
    } catch (error: any) {
        console.error("Quiz API Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
