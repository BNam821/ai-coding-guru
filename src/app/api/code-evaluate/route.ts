import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recordProblemScore } from "@/lib/coding-problems-service";
import { buildCodeEvaluationPrompt } from "@/lib/ai-prompts";
import { geminiModel } from "@/lib/gemini";
import { sanitizeModelJson } from "@/lib/learn-ai-question";

function normalizeCode(value: string) {
    return value
        .replace(/\r\n/g, "\n")
        .replace(/^\s+|\s+$/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n");
}

function parseZeroScoreStreak(value: unknown) {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return 0;
    }

    return Math.floor(parsedValue);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            userCode,
            problemObj,
            exerciseType,
            starterCode,
            bugChangeSummary,
            zeroScoreStreakBeforeSubmission,
        } = body;

        if (!userCode || !problemObj) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const isFixBugExercise = exerciseType === "fix_bug";
        const previousZeroScoreStreak = parseZeroScoreStreak(zeroScoreStreakBeforeSubmission);
        const submittedUnchangedStarterCode = isFixBugExercise
            && typeof starterCode === "string"
            && normalizeCode(userCode) === normalizeCode(starterCode);

        const prompt = buildCodeEvaluationPrompt({
            userCode,
            problemObj,
            exerciseType,
            starterCode,
            bugChangeSummary,
            previousZeroScoreStreak,
            submittedUnchangedStarterCode,
        });

        const result = await geminiModel.generateContent(prompt);
        const textArea = result.response.text();
        const parsedData = JSON.parse(sanitizeModelJson(textArea));
        const finalData = {
            ...parsedData,
            score: submittedUnchangedStarterCode ? 0 : (parsedData.score || 0),
        };

        if (submittedUnchangedStarterCode && !finalData.feedback) {
            finalData.feedback = "\u0042\u1ea1\u006e \u0111\u0061\u006e\u0067 \u006e\u1ed9\u0070 \u006c\u1ea1\u0069 \u006e\u0067\u0075\u0079\u00ea\u006e \u0074\u0072\u1ea1\u006e\u0067 \u0111\u006f\u1ea1\u006e \u0063\u006f\u0064\u0065 \u006c\u1ed7\u0069 \u0062\u0061\u006e \u0111\u1ea7\u0075, \u006e\u00ea\u006e \u0062\u00e0\u0069 \u006e\u00e0\u0079 \u0111\u01b0\u1ee3\u0063 \u0063\u0068\u1ea5\u006d 0 \u0111\u0069\u1ec3\u006d.";
        }

        const session = await getSession();
        if (session && session.username && problemObj.id) {
            await recordProblemScore(session.username, problemObj.id, finalData.score || 0);
        }

        return NextResponse.json(finalData);
    } catch (error) {
        console.error("\u004c\u1ed7\u0069 \u006b\u0068\u0069 \u0063\u0068\u1ea5\u006d \u0062\u00e0\u0069 \u0063\u006f\u0064\u0065:", error);
        return NextResponse.json(
            {
                actualOutput: "\u004c\u1ed7\u0069 \u0068\u1ec7 \u0074\u0068\u1ed1\u006e\u0067 \u0068\u006f\u1eb7\u0063 \u006c\u1ed7\u0069 \u0074\u0068\u1ef1\u0063 \u0074\u0068\u0069 AI.",
                score: 0,
                feedback: "\u0048\u1ec7 \u0074\u0068\u1ed1\u006e\u0067 AI \u006b\u0068\u00f4\u006e\u0067 \u0070\u0068\u1ea3\u006e \u0068\u1ed3\u0069 JSON \u0074\u0069\u00ea\u0075 \u0063\u0068\u0075\u1ea9\u006e \u0068\u006f\u1eb7\u0063 \u006d\u00e1\u0079 \u0063\u0068\u1ee7 \u0067\u1eb7\u0070 \u0076\u1ea5\u006e \u0111\u1ec1.",
            },
            { status: 500 }
        );
    }
}
