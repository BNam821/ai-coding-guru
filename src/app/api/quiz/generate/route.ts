import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateQuizForUser } from "@/lib/quiz-service";

export async function POST(req: Request) {
    try {
        // 1. Auth Check
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // 2. Generate Quiz
        const questions = await generateQuizForUser(session.username);

        return NextResponse.json({ success: true, questions });
    } catch (error: any) {
        console.error("Quiz API Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
