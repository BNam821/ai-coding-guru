import { supabaseAdmin } from "@/lib/supabase-admin";

export type ExperienceSummary = {
    level: number;
    currentLevelExperience: number;
    requiredExperience: number;
    progress: number;
};

export type UserProgressSnapshot = {
    uniqueLessonCount: number;
    recentLessonTitle: string;
    quizCount: number;
    avgScore: number;
    totalCorrectAnswers: number;
    totalAnsweredQuestions: number;
    streakScore: number;
    totalExperience: number;
    experience: ExperienceSummary;
};

type QuizScoreRow = {
    score?: number | null;
    correct_answers?: number | null;
    total_questions?: number | null;
};

export function getLevelRequirement(level: number) {
    return 100 * (2 ** level);
}

export function calculateExperience(totalExperience: number): ExperienceSummary {
    let level = 0;
    let currentLevelExperience = Math.max(0, totalExperience);
    let requiredExperience = getLevelRequirement(level);

    while (currentLevelExperience >= requiredExperience) {
        currentLevelExperience -= requiredExperience;
        level += 1;
        requiredExperience = getLevelRequirement(level);
    }

    return {
        level,
        currentLevelExperience,
        requiredExperience,
        progress: requiredExperience > 0 ? currentLevelExperience / requiredExperience : 0,
    };
}

export async function getUserProgressSnapshot(username: string): Promise<UserProgressSnapshot> {
    const [lessonCountRes, recentLessonRes, scoresRes] = await Promise.all([
        supabaseAdmin
            .from("user_learning_history")
            .select("lesson_id", { count: "exact", head: true })
            .eq("username", username),
        supabaseAdmin
            .from("user_learning_history")
            .select("lesson_title, updated_at")
            .eq("username", username)
            .order("updated_at", { ascending: false })
            .limit(8),
        supabaseAdmin
            .from("quiz_scores")
            .select("score, correct_answers, total_questions")
            .eq("username", username),
    ]);

    const uniqueLessonCount = lessonCountRes.count || 0;
    const historyRows = recentLessonRes.data || [];
    const scoreRows = (scoresRes.data || []) as QuizScoreRow[];
    const quizCount = scoreRows.length;

    let avgScore = 0;
    let totalCorrectAnswers = 0;
    let totalAnsweredQuestions = 0;

    if (scoreRows.length > 0) {
        avgScore = Number((scoreRows.reduce((sum, row) => sum + (row.score ?? 0), 0) / scoreRows.length).toFixed(1));
    }

    for (const row of scoreRows) {
        const storedCorrectAnswers = typeof row.correct_answers === "number" ? row.correct_answers : null;
        const storedTotalQuestions = typeof row.total_questions === "number" ? row.total_questions : null;

        if (storedCorrectAnswers !== null && storedTotalQuestions !== null && storedTotalQuestions > 0) {
            totalCorrectAnswers += storedCorrectAnswers;
            totalAnsweredQuestions += storedTotalQuestions;
            continue;
        }

        if (typeof row.score === "number") {
            const inferredTotalQuestions = 10;
            totalAnsweredQuestions += inferredTotalQuestions;
            totalCorrectAnswers += Math.round((row.score / 100) * inferredTotalQuestions);
        }
    }

    const now = Date.now();
    const streakScore = historyRows.reduce((acc, row) => {
        const updatedAt = typeof row.updated_at === "string" ? new Date(row.updated_at).getTime() : NaN;
        const dayDistance = Number.isFinite(updatedAt)
            ? Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24))
            : 7;
        const distance = Math.max(0, 7 - dayDistance);
        return acc + distance;
    }, 0);

    const totalExperience = uniqueLessonCount * 10 + totalCorrectAnswers * 5;

    return {
        uniqueLessonCount,
        recentLessonTitle: historyRows[0]?.lesson_title || "Explore a fresh lesson",
        quizCount,
        avgScore,
        totalCorrectAnswers,
        totalAnsweredQuestions,
        streakScore,
        totalExperience,
        experience: calculateExperience(totalExperience),
    };
}
