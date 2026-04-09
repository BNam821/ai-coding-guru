import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { score, correctAnswers, totalQuestions } = await req.json();

        if (typeof score !== 'number' || score < 0 || score > 100) {
            return NextResponse.json({ success: false, error: "Invalid score" }, { status: 400 });
        }

        if (
            correctAnswers !== undefined &&
            (typeof correctAnswers !== "number" || correctAnswers < 0)
        ) {
            return NextResponse.json({ success: false, error: "Invalid correctAnswers" }, { status: 400 });
        }

        if (
            totalQuestions !== undefined &&
            (typeof totalQuestions !== "number" || totalQuestions <= 0)
        ) {
            return NextResponse.json({ success: false, error: "Invalid totalQuestions" }, { status: 400 });
        }

        const payload = {
            username: session.username,
            score,
            ...(typeof correctAnswers === "number" ? { correct_answers: correctAnswers } : {}),
            ...(typeof totalQuestions === "number" ? { total_questions: totalQuestions } : {}),
        };

        let { error } = await supabase
            .from("quiz_scores")
            .insert([payload]);

        // Fallback for old schema that still only has `score`.
        if (error && (error.message.includes("correct_answers") || error.message.includes("total_questions"))) {
            const fallback = await supabase
                .from("quiz_scores")
                .insert([
                    {
                        username: session.username,
                        score,
                    }
                ]);

            error = fallback.error;
        }

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Quiz Score API Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
