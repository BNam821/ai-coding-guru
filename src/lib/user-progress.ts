import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCourseBySlug, getCourseSyllabus } from "@/lib/learn-db";

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

export type RecentLearningLesson = {
    lessonId: string;
    courseSlug: string;
    lessonSlug: string;
    lessonTitle: string;
    updatedAt: string | null;
    progressPercent: number | null;
};

export type NextLearningLesson = {
    courseSlug: string;
    lessonSlug: string;
    lessonTitle: string;
    courseTitle: string;
};

type LearningHistoryRow = {
    lesson_id?: string | null;
    course_slug?: string | null;
    lesson_slug?: string | null;
    lesson_title?: string | null;
    updated_at?: string | null;
    progress_percent?: number | null;
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

export async function getDashboardChartsData(username: string) {
    const now = new Date();
    const getVnDateString = (date: Date | string) => {
        const d = new Date(date);
        const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
        return vnTime.toISOString().split('T')[0];
    };

    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: recentScores } = await supabaseAdmin
        .from('quiz_scores')
        .select('created_at, total_questions')
        .eq('username', username)
        .gte('created_at', startOfWeek.toISOString())
        .order('created_at', { ascending: true });

    const learningFrequency = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return {
            date: getVnDateString(d),
            label: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
            sessions: 0
        };
    });

    for (const score of (recentScores || [])) {
        if (!score.created_at) continue;
        const scoreDateStr = getVnDateString(score.created_at);
        const dayMatch = learningFrequency.find(d => d.date === scoreDateStr);
        if (dayMatch) {
            dayMatch.sessions += (score.total_questions || 10) / 10;
        }
    }

    const { data: recentLesson } = await supabaseAdmin
        .from('user_learning_history')
        .select('course_slug')
        .eq('username', username)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
    
    let lessonCompletionRates: { label: string, value: number }[] = [];

    if (recentLesson?.course_slug) {
        const course = await getCourseBySlug(recentLesson.course_slug);
        if (course) {
            const syllabus = await getCourseSyllabus(course.id);
            const flatLessons = syllabus.flatMap(ch => ch.lessons || []).slice(0, 10);
            
            if (flatLessons.length > 0) {
                const { data: progressData } = await supabaseAdmin
                    .from('user_learning_history')
                    .select('lesson_id, progress_percent')
                    .eq('username', username)
                    .in('lesson_id', flatLessons.map(l => l.id));
                
                const progressMap = new Map((progressData || []).map(p => [p.lesson_id, p.progress_percent || 0]));

                lessonCompletionRates = flatLessons.map((l) => ({
                    label: `L${l.order}`,
                    value: progressMap.get(l.id) || 0
                }));
            }
        }
    }

    return {
        learningFrequency,
        lessonCompletionRates
    };
}

export async function getDashboardLearningDetails(username: string, limit = 5): Promise<{
    recentLessons: RecentLearningLesson[];
    nextLesson: NextLearningLesson | null;
}> {
    const safeLimit = Math.max(1, Math.min(limit, 10));
    const { data } = await supabaseAdmin
        .from("user_learning_history")
        .select("lesson_id, course_slug, lesson_slug, lesson_title, updated_at, progress_percent")
        .eq("username", username)
        .order("updated_at", { ascending: false })
        .limit(safeLimit);

    const recentLessons = ((data || []) as LearningHistoryRow[])
        .filter((row) => row.lesson_id && row.course_slug && row.lesson_slug && row.lesson_title)
        .map((row) => ({
            lessonId: row.lesson_id as string,
            courseSlug: row.course_slug as string,
            lessonSlug: row.lesson_slug as string,
            lessonTitle: row.lesson_title as string,
            updatedAt: row.updated_at ?? null,
            progressPercent: typeof row.progress_percent === "number" ? row.progress_percent : null,
        }));

    const latestLesson = recentLessons[0];
    if (!latestLesson) {
        return {
            recentLessons,
            nextLesson: null,
        };
    }

    const course = await getCourseBySlug(latestLesson.courseSlug);
    if (!course) {
        return {
            recentLessons,
            nextLesson: null,
        };
    }

    const syllabus = await getCourseSyllabus(course.id);
    const flatLessons = syllabus.flatMap((chapter) => chapter.lessons || []);
    const currentIndex = flatLessons.findIndex((lesson) => lesson.slug === latestLesson.lessonSlug);
    const nextLesson = currentIndex >= 0 ? flatLessons[currentIndex + 1] : null;

    return {
        recentLessons,
        nextLesson: nextLesson ? {
            courseSlug: latestLesson.courseSlug,
            lessonSlug: nextLesson.slug,
            lessonTitle: nextLesson.title,
            courseTitle: course.title,
        } : null,
    };
}

export interface LeaderboardUser {
    rank: number;
    username: string;
    displayName: string;
    level: number;
    totalExperience: number;
}

export async function getLeaderboardData(): Promise<LeaderboardUser[]> {
    // Fetch all users
    const { data: users } = await supabaseAdmin.from('users').select('username, display_name');
    if (!users) return [];

    // Fetch learning history and group by username + lesson_slug to get unique lesson count
    const { data: history } = await supabaseAdmin.from('user_learning_history').select('username, lesson_slug');
    const userLessonCounts: Record<string, number> = {};
    if (history) {
        const uniqueSets: Record<string, Set<string>> = {};
        for (const row of history) {
            if (!uniqueSets[row.username]) uniqueSets[row.username] = new Set();
            uniqueSets[row.username].add(row.lesson_slug);
        }
        for (const [username, set] of Object.entries(uniqueSets)) {
            userLessonCounts[username] = set.size;
        }
    }

    // Fetch quiz scores and aggregate correct answers (or fallback to score) per user
    const { data: scores } = await supabaseAdmin.from('quiz_scores').select('username, correct_answers, total_questions, score');
    const userCorrectAnswers: Record<string, number> = {};
    if (scores) {
        for (const row of scores) {
            if (!userCorrectAnswers[row.username]) userCorrectAnswers[row.username] = 0;

            const storedCorrectAnswers = typeof row.correct_answers === "number" ? row.correct_answers : null;
            const storedTotalQuestions = typeof row.total_questions === "number" ? row.total_questions : null;

            if (storedCorrectAnswers !== null && storedTotalQuestions !== null && storedTotalQuestions > 0) {
                userCorrectAnswers[row.username] += storedCorrectAnswers;
                continue;
            }

            if (typeof row.score === "number") {
                userCorrectAnswers[row.username] += Math.round((row.score / 100) * 10);
            }
        }
    }

    // Compute experience & level for each user
    const userStats = users.map(user => {
        const uniqueLessonCount = userLessonCounts[user.username] || 0;
        const totalCorrectAnswers = userCorrectAnswers[user.username] || 0;
        const totalExperience = uniqueLessonCount * 10 + totalCorrectAnswers * 5;
        const experience = calculateExperience(totalExperience);

        return {
            username: user.username,
            displayName: user.display_name || user.username,
            level: experience.level,
            totalExperience,
        };
    });

    // Sort by totalExperience descending
    userStats.sort((a, b) => b.totalExperience - a.totalExperience);

    // Limit to top 10 & assign rank
    return userStats.slice(0, 10).map((stat, i) => ({
        ...stat,
        rank: i + 1,
    }));
}
