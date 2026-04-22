import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { QuizQuestion, QuizQuestionSource } from "@/lib/quiz-service";

type QuizScoreInsertPayload = {
    username: string;
    score: number;
    correct_answers?: number;
    total_questions?: number;
    question_sources?: QuizQuestionSource[];
    question_payload?: QuizQuestion[];
    question_results?: Array<{
        questionId?: number;
        source?: QuizQuestionSource;
        selectedAnswer?: number;
        correctAnswer?: number;
        isCorrect?: boolean;
    }>;
};

async function insertQuizScoreWithFallback(payload: QuizScoreInsertPayload) {
    const attempts: QuizScoreInsertPayload[] = [
        payload,
        {
            username: payload.username,
            score: payload.score,
            ...(typeof payload.correct_answers === "number" ? { correct_answers: payload.correct_answers } : {}),
            ...(typeof payload.total_questions === "number" ? { total_questions: payload.total_questions } : {}),
            ...(payload.question_sources ? { question_sources: payload.question_sources } : {}),
        },
        {
            username: payload.username,
            score: payload.score,
            ...(typeof payload.correct_answers === "number" ? { correct_answers: payload.correct_answers } : {}),
            ...(typeof payload.total_questions === "number" ? { total_questions: payload.total_questions } : {}),
        },
        {
            username: payload.username,
            score: payload.score,
        },
    ];

    let lastError: Error | null = null;

    for (const attempt of attempts) {
        const { error } = await supabaseAdmin
            .from("quiz_scores")
            .insert([attempt]);

        if (!error) {
            return;
        }

        lastError = error;
    }

    throw lastError || new Error("Unable to insert quiz score");
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { score, correctAnswers, totalQuestions, questionSources, questionPayload, questionResults } = await req.json();

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

        if (
            questionSources !== undefined &&
            (!Array.isArray(questionSources) || questionSources.some((source) => !source || typeof source !== "object"))
        ) {
            return NextResponse.json({ success: false, error: "Invalid questionSources" }, { status: 400 });
        }

        if (
            questionPayload !== undefined &&
            (!Array.isArray(questionPayload) || questionPayload.some((question) => !question || typeof question !== "object"))
        ) {
            return NextResponse.json({ success: false, error: "Invalid questionPayload" }, { status: 400 });
        }

        if (
            questionResults !== undefined &&
            (!Array.isArray(questionResults) || questionResults.some((result) => !result || typeof result !== "object"))
        ) {
            return NextResponse.json({ success: false, error: "Invalid questionResults" }, { status: 400 });
        }

        const payload: QuizScoreInsertPayload = {
            username: session.username,
            score,
            ...(typeof correctAnswers === "number" ? { correct_answers: correctAnswers } : {}),
            ...(typeof totalQuestions === "number" ? { total_questions: totalQuestions } : {}),
            ...(Array.isArray(questionSources) ? { question_sources: questionSources as QuizQuestionSource[] } : {}),
            ...(Array.isArray(questionPayload) ? { question_payload: questionPayload as QuizQuestion[] } : {}),
            ...(Array.isArray(questionResults) ? { question_results: questionResults } : {}),
        };

        await insertQuizScoreWithFallback(payload);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Quiz Score API Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
