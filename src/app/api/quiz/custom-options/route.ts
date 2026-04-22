import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQuizSelectableSources } from "@/lib/quiz-service";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const courses = await getQuizSelectableSources(session.username);
        return NextResponse.json({ success: true, courses });
    } catch (error: any) {
        console.error("Quiz custom options API error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
