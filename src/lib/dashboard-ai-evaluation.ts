import { createHash } from "node:crypto";
import { getFullLearningTree } from "@/lib/learn-db";
import { sanitizeModelJson } from "@/lib/learn-ai-question";
import { geminiModel } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";

type QuizQuestionSource = {
    sourceKey: string;
    lessonId: string | null;
    lessonTitle: string;
    lessonSlug: string;
    courseSlug: string;
};

type QuizQuestionPayload = {
    id?: number;
    question?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
    source?: QuizQuestionSource;
};

type QuizQuestionResult = {
    questionId?: number;
    source?: QuizQuestionSource;
    selectedAnswer?: number | null;
    correctAnswer?: number | null;
    isCorrect?: boolean;
};

type QuizScoreAnalysisRow = {
    created_at?: string | null;
    score?: number | null;
    correct_answers?: number | null;
    total_questions?: number | null;
    question_sources?: unknown;
    question_payload?: unknown;
    question_results?: unknown;
};

type LessonSignal = QuizQuestionSource & {
    attemptCount: number;
    questionCount: number;
    estimatedCorrectQuestions: number;
    estimatedWrongQuestions: number;
    averageScore: number;
    chapterTitle: string;
};

export type AiRecommendedLesson = {
    sourceKey: string;
    lessonTitle: string;
    lessonSlug: string;
    courseSlug: string;
    reason: string;
};

export type DashboardChartDatum = {
    label: string;
    value: number;
};

export type DashboardChapterPerformanceDatum = {
    label: string;
    value: number;
};

export type DashboardLessonPerformanceDatum = {
    label: string;
    correctValue: number;
    wrongValue: number;
};

export type DashboardAiRawChartData = {
    summary: {
        attempts: number;
        averageScore: number;
        totalQuestions: number;
        totalCorrectAnswers: number;
        totalWrongAnswers: number;
        accuracyRate: number;
        recentQuestionCount: number;
        recentCorrectAnswers: number;
        recentWrongAnswers: number;
    };
    scoreTrend: DashboardChartDatum[];
    weakLessons: DashboardChartDatum[];
    strongLessons: DashboardChartDatum[];
    lessonCoverage: DashboardChartDatum[];
    lessonPerformance: DashboardLessonPerformanceDatum[];
    wrongByLesson: DashboardChartDatum[];
    wrongByChapter: DashboardChapterPerformanceDatum[];
};

export type DashboardAiEvaluation = {
    hasData: boolean;
    bullets: string[];
    recommendedLessons: AiRecommendedLesson[];
    attemptCount: number;
    averageScore: number;
    rawChartData: DashboardAiRawChartData;
};

type AiEvaluationResponse = {
    bullets: string[];
    recommendedLessonKeys: string[];
    rawChartData: DashboardAiRawChartData;
};

type DashboardAiEvaluationCacheRow = {
    username: string;
    data_signature: string;
    evaluation_payload: DashboardAiEvaluation;
};

function buildEmptyChartData(): DashboardAiRawChartData {
    return {
        summary: {
            attempts: 0,
            averageScore: 0,
            totalQuestions: 0,
            totalCorrectAnswers: 0,
            totalWrongAnswers: 0,
            accuracyRate: 0,
            recentQuestionCount: 0,
            recentCorrectAnswers: 0,
            recentWrongAnswers: 0,
        },
        scoreTrend: [],
        weakLessons: [],
        strongLessons: [],
        lessonCoverage: [],
        lessonPerformance: [],
        wrongByLesson: [],
        wrongByChapter: [],
    };
}

function getChartSummaryNumber(summary: Record<string, unknown> | null, key: string, decimals?: number) {
    const rawValue = typeof summary?.[key] === "number" ? summary[key] as number : 0;

    if (typeof decimals === "number") {
        return Number(rawValue.toFixed(decimals));
    }

    return Number(rawValue);
}

function isQuizQuestionSource(value: unknown): value is QuizQuestionSource {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate.sourceKey === "string"
        && typeof candidate.lessonTitle === "string"
        && typeof candidate.lessonSlug === "string"
        && typeof candidate.courseSlug === "string"
        && (typeof candidate.lessonId === "string" || candidate.lessonId === null || candidate.lessonId === undefined);
}

function isQuizQuestionPayload(value: unknown): value is QuizQuestionPayload {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    const hasSource = isQuizQuestionSource(candidate.source);
    const hasQuestion = typeof candidate.question === "string";

    return hasSource || hasQuestion;
}

function isQuizQuestionResult(value: unknown): value is QuizQuestionResult {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    const hasSource = isQuizQuestionSource(candidate.source);
    const hasIsCorrect = typeof candidate.isCorrect === "boolean";

    return hasSource && hasIsCorrect;
}

function getNumericScore(row: QuizScoreAnalysisRow) {
    if (typeof row.score === "number" && Number.isFinite(row.score)) {
        return Math.max(0, Math.min(100, row.score));
    }

    if (
        typeof row.correct_answers === "number"
        && typeof row.total_questions === "number"
        && row.total_questions > 0
    ) {
        return Math.max(0, Math.min(100, Number(((row.correct_answers / row.total_questions) * 100).toFixed(1))));
    }

    return 0;
}

function getCorrectAnswers(row: QuizScoreAnalysisRow) {
    if (typeof row.correct_answers === "number" && row.correct_answers >= 0) {
        return row.correct_answers;
    }

    if (typeof row.score === "number") {
        return Math.round((row.score / 100) * getTotalQuestions(row));
    }

    return 0;
}

function getTotalQuestions(row: QuizScoreAnalysisRow) {
    if (typeof row.total_questions === "number" && row.total_questions > 0) {
        return row.total_questions;
    }

    return 10;
}

function parseQuestionSources(value: unknown): QuizQuestionSource[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(isQuizQuestionSource)
        .map((source) => ({
            sourceKey: source.sourceKey.trim(),
            lessonId: source.lessonId ?? null,
            lessonTitle: source.lessonTitle.trim(),
            lessonSlug: source.lessonSlug.trim(),
            courseSlug: source.courseSlug.trim(),
        }))
        .filter((source) => source.sourceKey && source.lessonTitle && source.lessonSlug && source.courseSlug);
}

function parseQuestionPayload(value: unknown): QuizQuestionPayload[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(isQuizQuestionPayload);
}

function parseQuestionResults(value: unknown): QuizQuestionResult[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(isQuizQuestionResult);
}

async function getQuizRows(username: string): Promise<QuizScoreAnalysisRow[]> {
    const withPayload = await supabaseAdmin
        .from("quiz_scores")
        .select("created_at, score, correct_answers, total_questions, question_sources, question_payload, question_results")
        .eq("username", username)
        .order("created_at", { ascending: false })
        .limit(12);

    if (!withPayload.error) {
        return (withPayload.data || []) as QuizScoreAnalysisRow[];
    }

    const withSources = await supabaseAdmin
        .from("quiz_scores")
        .select("created_at, score, correct_answers, total_questions, question_sources")
        .eq("username", username)
        .order("created_at", { ascending: false })
        .limit(12);

    if (!withSources.error) {
        return (withSources.data || []) as QuizScoreAnalysisRow[];
    }

    const fallback = await supabaseAdmin
        .from("quiz_scores")
        .select("created_at, score, correct_answers, total_questions")
        .eq("username", username)
        .order("created_at", { ascending: false })
        .limit(12);

    if (fallback.error) {
        console.error("Failed to fetch quiz rows for AI evaluation:", fallback.error);
        return [];
    }

    return (fallback.data || []) as QuizScoreAnalysisRow[];
}

async function getLessonChapterMap() {
    const learningTree = await getFullLearningTree();
    const lessonChapterMap = new Map<string, string>();

    for (const course of learningTree) {
        for (const chapter of course.chapters || []) {
            for (const lesson of chapter.lessons || []) {
                lessonChapterMap.set(lesson.id, chapter.title);
                lessonChapterMap.set(`${course.slug}::${lesson.slug}`, chapter.title);
            }
        }
    }

    return lessonChapterMap;
}

function buildFallbackBullets(input: {
    attemptCount: number;
    averageScore: number;
    totalCorrectAnswers: number;
    totalQuestions: number;
    weakLessons: LessonSignal[];
    strongLessons: LessonSignal[];
}) {
    const topWeak = input.weakLessons[0];
    const topStrong = input.strongLessons[0];
    const wrongCount = Math.max(0, input.totalQuestions - input.totalCorrectAnswers);

    return [
        `Bạn đã hoàn thành ${input.attemptCount} lượt quiz, đúng khoảng ${input.totalCorrectAnswers}/${input.totalQuestions} câu và đạt trung bình ${input.averageScore}/100.`,
        topStrong
            ? `Điểm mạnh hiện tập trung ở "${topStrong.lessonTitle}", nơi bạn có tỷ lệ làm đúng ước tính tốt hơn và xuất hiện đều trong nhiều lần làm bài.`
            : "Điểm mạnh bắt đầu hình thành ở các nhóm câu hỏi quen thuộc, cho thấy nền tảng cơ bản đang dần ổn định.",
        topWeak
            ? `Điểm yếu nổi bật là "${topWeak.lessonTitle}" với số câu sai ước tính cao hơn; đây là vùng nên ôn lại vì đang kéo giảm hiệu suất chung (${wrongCount} câu sai toàn bộ lịch sử gần đây).`
            : `Phần cần cải thiện nằm ở độ ổn định khi làm bài; toàn bộ lịch sử gần đây vẫn còn khoảng ${wrongCount} câu sai cần được rà lại.`,
    ];
}

function normalizeChartData(data: unknown): DashboardChartDatum[] {
    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .filter((item) => item && typeof item === "object")
        .map((item) => {
            const candidate = item as Record<string, unknown>;
            return {
                label: typeof candidate.label === "string" ? candidate.label.trim() : "",
                value: typeof candidate.value === "number" ? Number(candidate.value.toFixed(2)) : Number(candidate.value || 0),
            };
        })
        .filter((item) => item.label);
}

function normalizeLessonPerformanceData(data: unknown): DashboardLessonPerformanceDatum[] {
    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .filter((item) => item && typeof item === "object")
        .map((item) => {
            const candidate = item as Record<string, unknown>;
            return {
                label: typeof candidate.label === "string" ? candidate.label.trim() : "",
                correctValue: typeof candidate.correctValue === "number" ? Number(candidate.correctValue.toFixed(2)) : 0,
                wrongValue: typeof candidate.wrongValue === "number" ? Number(candidate.wrongValue.toFixed(2)) : 0,
            };
        })
        .filter((item) => item.label);
}

function buildFallbackChartData(input: {
    rows: QuizScoreAnalysisRow[];
    attemptCount: number;
    averageScore: number;
    totalQuestions: number;
    totalCorrectAnswers: number;
    weakLessons: LessonSignal[];
    strongLessons: LessonSignal[];
    lessonCoverage: LessonSignal[];
}): DashboardAiRawChartData {
    return {
        summary: {
            attempts: input.attemptCount,
            averageScore: input.averageScore,
            totalQuestions: input.totalQuestions,
            totalCorrectAnswers: input.totalCorrectAnswers,
            totalWrongAnswers: Math.max(0, input.totalQuestions - input.totalCorrectAnswers),
            accuracyRate: input.totalQuestions > 0
                ? Number(((input.totalCorrectAnswers / input.totalQuestions) * 100).toFixed(1))
                : 0,
            recentQuestionCount: 0,
            recentCorrectAnswers: 0,
            recentWrongAnswers: 0,
        },
        scoreTrend: input.rows
            .slice()
            .reverse()
            .map((row, index) => ({
                label: `Lần ${index + 1}`,
                value: getNumericScore(row),
            })),
        weakLessons: input.weakLessons.slice(0, 5).map((lesson) => ({
            label: lesson.lessonTitle,
            value: Number(lesson.estimatedWrongQuestions.toFixed(2)),
        })),
        strongLessons: input.strongLessons.slice(0, 5).map((lesson) => ({
            label: lesson.lessonTitle,
            value: Number(lesson.estimatedCorrectQuestions.toFixed(2)),
        })),
        lessonCoverage: input.lessonCoverage.slice(0, 8).map((lesson) => ({
            label: lesson.lessonTitle,
            value: lesson.questionCount,
        })),
        lessonPerformance: input.lessonCoverage.slice(0, 8).map((lesson) => ({
            label: lesson.lessonTitle,
            correctValue: Number(lesson.estimatedCorrectQuestions.toFixed(2)),
            wrongValue: Number(lesson.estimatedWrongQuestions.toFixed(2)),
        })),
        wrongByLesson: input.weakLessons.slice(0, 8).map((lesson) => ({
            label: lesson.lessonTitle,
            value: Number(lesson.estimatedWrongQuestions.toFixed(2)),
        })),
        wrongByChapter: Array.from(
            input.lessonCoverage.reduce((acc, lesson) => {
                const current = acc.get(lesson.chapterTitle) || 0;
                acc.set(lesson.chapterTitle, current + lesson.estimatedWrongQuestions);
                return acc;
            }, new Map<string, number>())
        )
            .map(([label, value]) => ({
                label,
                value: Number(value.toFixed(2)),
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8),
    };
}

function buildRecentAnswerChartData(input: {
    attemptCount: number;
    averageScore: number;
    totalQuestions: number;
    totalCorrectAnswers: number;
    recentQuestionCount: number;
    recentCorrectAnswers: number;
    recentWrongAnswers: number;
    exactLessonSignals: Array<LessonSignal>;
}): DashboardAiRawChartData {
    const weakLessons = input.exactLessonSignals
        .filter((lesson) => lesson.estimatedWrongQuestions > 0)
        .sort((a, b) => b.estimatedWrongQuestions - a.estimatedWrongQuestions)
        .slice(0, 8);

    const strongLessons = input.exactLessonSignals
        .filter((lesson) => lesson.estimatedCorrectQuestions > 0)
        .sort((a, b) => b.estimatedCorrectQuestions - a.estimatedCorrectQuestions)
        .slice(0, 8);

    const chapterTotals = Array.from(
        input.exactLessonSignals.reduce((acc, lesson) => {
            const current = acc.get(lesson.chapterTitle) || 0;
            acc.set(lesson.chapterTitle, current + lesson.estimatedWrongQuestions);
            return acc;
        }, new Map<string, number>())
    )
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    return {
        summary: {
            attempts: input.attemptCount,
            averageScore: input.averageScore,
            totalQuestions: input.totalQuestions,
            totalCorrectAnswers: input.totalCorrectAnswers,
            totalWrongAnswers: Math.max(0, input.totalQuestions - input.totalCorrectAnswers),
            accuracyRate: input.totalQuestions > 0
                ? Number(((input.totalCorrectAnswers / input.totalQuestions) * 100).toFixed(1))
                : 0,
            recentQuestionCount: input.recentQuestionCount,
            recentCorrectAnswers: input.recentCorrectAnswers,
            recentWrongAnswers: input.recentWrongAnswers,
        },
        scoreTrend: [],
        weakLessons: weakLessons.map((lesson) => ({
            label: lesson.lessonTitle,
            value: lesson.estimatedWrongQuestions,
        })),
        strongLessons: strongLessons.map((lesson) => ({
            label: lesson.lessonTitle,
            value: lesson.estimatedCorrectQuestions,
        })),
        lessonCoverage: input.exactLessonSignals.slice(0, 8).map((lesson) => ({
            label: lesson.lessonTitle,
            value: lesson.questionCount,
        })),
        lessonPerformance: input.exactLessonSignals.slice(0, 8).map((lesson) => ({
            label: lesson.lessonTitle,
            correctValue: lesson.estimatedCorrectQuestions,
            wrongValue: lesson.estimatedWrongQuestions,
        })),
        wrongByLesson: weakLessons.map((lesson) => ({
            label: lesson.lessonTitle,
            value: lesson.estimatedWrongQuestions,
        })),
        wrongByChapter: chapterTotals,
    };
}

function buildDataSignature(rows: QuizScoreAnalysisRow[]) {
    return createHash("sha256")
        .update(JSON.stringify(rows))
        .digest("hex");
}

async function getCachedEvaluation(username: string, dataSignature: string) {
    const { data, error } = await supabaseAdmin
        .from("dashboard_ai_evaluations")
        .select("username, data_signature, evaluation_payload")
        .eq("username", username)
        .maybeSingle();

    if (error) {
        console.error("Dashboard AI cache read skipped:", error);
        return null;
    }

    const row = data as DashboardAiEvaluationCacheRow | null;
    if (!row || row.data_signature !== dataSignature || !row.evaluation_payload) {
        return null;
    }

    return {
        ...row.evaluation_payload,
        rawChartData: {
            ...buildEmptyChartData(),
            ...(row.evaluation_payload.rawChartData || {}),
            lessonPerformance: Array.isArray(row.evaluation_payload.rawChartData?.lessonPerformance)
                ? row.evaluation_payload.rawChartData.lessonPerformance
                : [],
            wrongByLesson: Array.isArray(row.evaluation_payload.rawChartData?.wrongByLesson)
                ? row.evaluation_payload.rawChartData.wrongByLesson
                : [],
            wrongByChapter: Array.isArray(row.evaluation_payload.rawChartData?.wrongByChapter)
                ? row.evaluation_payload.rawChartData.wrongByChapter
                : [],
        },
    } satisfies DashboardAiEvaluation;
}

async function storeCachedEvaluation(username: string, dataSignature: string, evaluation: DashboardAiEvaluation) {
    const { error } = await supabaseAdmin
        .from("dashboard_ai_evaluations")
        .upsert([
            {
                username,
                data_signature: dataSignature,
                evaluation_payload: evaluation,
                updated_at: new Date().toISOString(),
            },
        ], {
            onConflict: "username",
        });

    if (error) {
        console.error("Dashboard AI cache write skipped:", error);
    }
}

async function generateAiEvaluation(input: {
    attemptCount: number;
    averageScore: number;
    totalCorrectAnswers: number;
    totalQuestions: number;
    attemptBreakdown: Array<{
        label: string;
        score: number;
        correctAnswers: number;
        wrongAnswers: number;
        totalQuestions: number;
        lessonKeys: string[];
    }>;
    lessonSignals: Array<{
        sourceKey: string;
        lessonTitle: string;
        courseSlug: string;
        lessonSlug: string;
        attemptCount: number;
        questionCount: number;
        estimatedCorrectQuestions: number;
        estimatedWrongQuestions: number;
        averageScore: number;
    }>;
    recommendationCandidates: LessonSignal[];
    fallbackChartData: DashboardAiRawChartData;
}) {
    const prompt = `
Bạn là AI phân tích học tập cho dashboard.

Mục tiêu:
- Phân tích theo hướng LIỆT KÊ và DỰA TRÊN SỐ LIỆU THỰC TẾ từ lịch sử đúng/sai.
- Ưu tiên khai thác dữ liệu từ correct_answers, total_questions, question_sources và question_payload.
- Nếu phải suy ra theo bài học từ question_sources hoặc question_payload, hãy coi đó là "ước tính theo phân bố câu hỏi", không được coi là dữ liệu chấm điểm tuyệt đối từng câu.

Yêu cầu:
1. Trả về đúng JSON object thuần túy, không markdown, không giải thích ngoài JSON.
2. "bullets" phải có đúng 3 chuỗi tiếng Việt, thiên về liệt kê số liệu ngắn gọn.
3. Mỗi bullet phải nêu được ít nhất một dữ kiện định lượng cụ thể như số lượt, điểm trung bình, số câu đúng/sai, hay số câu sai ước tính theo bài học.
4. Bullet 1: tổng quan hiệu suất.
5. Bullet 2: điểm mạnh dựa trên lessonSignals.
6. Bullet 3: điểm yếu và phần cần ôn lại dựa trên lessonSignals.
7. "recommendedLessonKeys" chỉ được chọn từ recommendationCandidates.
8. "rawChartData" là dữ liệu thô để hệ thống dùng cho Google Charts qua API, nên phải sạch, ngắn gọn, chỉ gồm nhãn và giá trị số.
9. Với các dữ liệu lessonSignals, hãy hiểu đây là số liệu tổng hợp/ước tính từ question_sources và question_payload kết hợp với tổng số câu đúng sai của từng lượt quiz.
10. Không bịa số liệu ngoài input.

Input:
${JSON.stringify({
        aggregate: {
            attemptCount: input.attemptCount,
            averageScore: input.averageScore,
            totalCorrectAnswers: input.totalCorrectAnswers,
            totalQuestions: input.totalQuestions,
            totalWrongAnswers: Math.max(0, input.totalQuestions - input.totalCorrectAnswers),
        },
        attemptBreakdown: input.attemptBreakdown,
        lessonSignals: input.lessonSignals.slice(0, 12),
        recommendationCandidates: input.recommendationCandidates.slice(0, 6).map((lesson) => ({
            sourceKey: lesson.sourceKey,
            lessonTitle: lesson.lessonTitle,
            courseSlug: lesson.courseSlug,
            lessonSlug: lesson.lessonSlug,
        })),
        fallbackChartData: input.fallbackChartData,
    })}

Schema:
{
  "bullets": [
    "Ý 1 có số liệu",
    "Ý 2 có số liệu",
    "Ý 3 có số liệu"
  ],
  "recommendedLessonKeys": ["source-1", "source-2"],
  "rawChartData": {
    "summary": {
      "attempts": 0,
      "averageScore": 0,
      "totalQuestions": 0,
      "totalCorrectAnswers": 0,
      "totalWrongAnswers": 0,
      "accuracyRate": 0
    },
    "scoreTrend": [{ "label": "Lần 1", "value": 75 }],
    "weakLessons": [{ "label": "Bài A", "value": 4 }],
    "strongLessons": [{ "label": "Bài B", "value": 6 }],
    "lessonCoverage": [{ "label": "Bài C", "value": 8 }],
    "lessonPerformance": [{ "label": "Bài D", "correctValue": 6, "wrongValue": 3 }],
    "wrongByLesson": [{ "label": "Bài E", "value": 4 }],
    "wrongByChapter": [{ "label": "Chương 1", "value": 7 }]
  }
}
`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const payload = JSON.parse(sanitizeModelJson(text)) as {
        bullets?: unknown;
        recommendedLessonKeys?: unknown;
        rawChartData?: unknown;
    };

    const bullets = Array.isArray(payload.bullets)
        ? payload.bullets.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : [];

    const recommendedLessonKeys = Array.isArray(payload.recommendedLessonKeys)
        ? payload.recommendedLessonKeys.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : [];

    const chartCandidate = payload.rawChartData && typeof payload.rawChartData === "object"
        ? payload.rawChartData as Record<string, unknown>
        : null;

    if (bullets.length !== 3) {
        throw new Error("AI evaluation bullets are invalid");
    }

    return {
        bullets,
        recommendedLessonKeys,
        rawChartData: {
            summary: {
                attempts: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "attempts",
                ),
                averageScore: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "averageScore",
                    1,
                ),
                totalQuestions: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "totalQuestions",
                ),
                totalCorrectAnswers: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "totalCorrectAnswers",
                ),
                totalWrongAnswers: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "totalWrongAnswers",
                ),
                accuracyRate: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "accuracyRate",
                    1,
                ),
                recentQuestionCount: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "recentQuestionCount",
                ),
                recentCorrectAnswers: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "recentCorrectAnswers",
                ),
                recentWrongAnswers: getChartSummaryNumber(
                    typeof chartCandidate?.summary === "object" && chartCandidate.summary
                        ? chartCandidate.summary as Record<string, unknown>
                        : null,
                    "recentWrongAnswers",
                ),
            },
            scoreTrend: normalizeChartData(chartCandidate?.scoreTrend),
            weakLessons: normalizeChartData(chartCandidate?.weakLessons),
            strongLessons: normalizeChartData(chartCandidate?.strongLessons),
            lessonCoverage: normalizeChartData(chartCandidate?.lessonCoverage),
            lessonPerformance: normalizeLessonPerformanceData(chartCandidate?.lessonPerformance),
            wrongByLesson: normalizeChartData(chartCandidate?.wrongByLesson),
            wrongByChapter: normalizeChartData(chartCandidate?.wrongByChapter),
        },
    } satisfies AiEvaluationResponse;
}

export async function getDashboardAiEvaluation(username: string): Promise<DashboardAiEvaluation> {
    const rows = await getQuizRows(username);
    const dataSignature = buildDataSignature(rows);
    const lessonChapterMap = await getLessonChapterMap();

    if (rows.length === 0) {
        return {
            hasData: false,
            bullets: [
                "Bạn chưa có dữ liệu trắc nghiệm để AI phân tích.",
                "Hãy hoàn thành vài bài ở mục /test để hệ thống nhận ra điểm mạnh của bạn.",
                "Khi đã có lịch sử làm bài, AI sẽ gợi ý đúng bài học cần ôn lại.",
            ],
            recommendedLessons: [],
            attemptCount: 0,
            averageScore: 0,
            rawChartData: buildEmptyChartData(),
        };
    }

    const cachedEvaluation = await getCachedEvaluation(username, dataSignature);
    if (cachedEvaluation) {
        return cachedEvaluation;
    }

    const averageScore = Number((rows.reduce((sum, row) => sum + getNumericScore(row), 0) / rows.length).toFixed(1));
    const totalQuestions = rows.reduce((sum, row) => sum + getTotalQuestions(row), 0);
    const totalCorrectAnswers = rows.reduce((sum, row) => sum + getCorrectAnswers(row), 0);
    const sourceSignals = new Map<string, LessonSignal>();
    const exactSourceSignals = new Map<string, LessonSignal>();
    let recentQuestionCount = 0;
    let recentCorrectAnswers = 0;
    let recentWrongAnswers = 0;
    const attemptBreakdown: Array<{
        label: string;
        score: number;
        correctAnswers: number;
        wrongAnswers: number;
        totalQuestions: number;
        lessonKeys: string[];
    }> = [];

    rows.forEach((row, index) => {
        const score = getNumericScore(row);
        const correctAnswers = getCorrectAnswers(row);
        const attemptTotalQuestions = getTotalQuestions(row);
        const wrongAnswers = Math.max(0, attemptTotalQuestions - correctAnswers);
        const questionResults = parseQuestionResults(row.question_results);
        const payloadQuestions = parseQuestionPayload(row.question_payload);
        const payloadSources = payloadQuestions
            .map((question) => question.source)
            .filter((source): source is QuizQuestionSource => isQuizQuestionSource(source));
        const sources = payloadSources.length > 0
            ? payloadSources
            : parseQuestionSources(row.question_sources);
        const sourceQuestionCounts = new Map<string, { source: QuizQuestionSource; count: number }>();

        sources.forEach((source) => {
            const existing = sourceQuestionCounts.get(source.sourceKey);
            if (existing) {
                existing.count += 1;
                return;
            }

            sourceQuestionCounts.set(source.sourceKey, {
                source,
                count: 1,
            });
        });

        if (sourceQuestionCounts.size === 0) {
            return;
        }

        attemptBreakdown.push({
            label: `Lần ${rows.length - index}`,
            score,
            correctAnswers,
            wrongAnswers,
            totalQuestions: attemptTotalQuestions,
            lessonKeys: Array.from(sourceQuestionCounts.keys()),
        });

        if (questionResults.length > 0) {
            recentQuestionCount += questionResults.length;
            recentCorrectAnswers += questionResults.filter((result) => result.isCorrect).length;
            recentWrongAnswers += questionResults.filter((result) => !result.isCorrect).length;

            const seenSourcesThisAttempt = new Set<string>();

            for (const result of questionResults) {
                const source = result.source;
                if (!source || !isQuizQuestionSource(source)) {
                    continue;
                }

                const existing = exactSourceSignals.get(source.sourceKey) || {
                    ...source,
                    attemptCount: 0,
                    questionCount: 0,
                    estimatedCorrectQuestions: 0,
                    estimatedWrongQuestions: 0,
                    averageScore: 0,
                    chapterTitle: lessonChapterMap.get(source.lessonId || source.sourceKey) || "ChÆ°a rÃµ chÆ°Æ¡ng",
                };

                if (!seenSourcesThisAttempt.has(source.sourceKey)) {
                    existing.attemptCount += 1;
                    existing.averageScore += score;
                    seenSourcesThisAttempt.add(source.sourceKey);
                }

                existing.questionCount += 1;

                if (result.isCorrect) {
                    existing.estimatedCorrectQuestions += 1;
                } else {
                    existing.estimatedWrongQuestions += 1;
                }

                exactSourceSignals.set(source.sourceKey, existing);
            }
        }

        for (const { source, count } of sourceQuestionCounts.values()) {
            const estimatedCorrectQuestions = Number(((correctAnswers * count) / attemptTotalQuestions).toFixed(2));
            const estimatedWrongQuestions = Number(((wrongAnswers * count) / attemptTotalQuestions).toFixed(2));
            const existing = sourceSignals.get(source.sourceKey) || {
                ...source,
                attemptCount: 0,
                questionCount: 0,
                estimatedCorrectQuestions: 0,
                estimatedWrongQuestions: 0,
                averageScore: 0,
                chapterTitle: lessonChapterMap.get(source.lessonId || source.sourceKey) || "Chưa rõ chương",
            };

            existing.attemptCount += 1;
            existing.questionCount += count;
            existing.estimatedCorrectQuestions += estimatedCorrectQuestions;
            existing.estimatedWrongQuestions += estimatedWrongQuestions;
            existing.averageScore += score;

            sourceSignals.set(source.sourceKey, existing);
        }
    });

    const allSignals = Array.from(sourceSignals.values()).map((lesson) => ({
        ...lesson,
        averageScore: Number((lesson.averageScore / Math.max(lesson.attemptCount, 1)).toFixed(1)),
        estimatedCorrectQuestions: Number(lesson.estimatedCorrectQuestions.toFixed(2)),
        estimatedWrongQuestions: Number(lesson.estimatedWrongQuestions.toFixed(2)),
    }));

    const exactAllSignals = Array.from(exactSourceSignals.values())
        .map((lesson) => ({
            ...lesson,
            averageScore: Number((lesson.averageScore / Math.max(lesson.attemptCount, 1)).toFixed(1)),
            estimatedCorrectQuestions: Math.round(lesson.estimatedCorrectQuestions),
            estimatedWrongQuestions: Math.round(lesson.estimatedWrongQuestions),
        }))
        .sort((a, b) => b.questionCount - a.questionCount);

    const weakLessons = allSignals
        .filter((lesson) => lesson.estimatedWrongQuestions > 0)
        .sort((a, b) => {
            if (b.estimatedWrongQuestions !== a.estimatedWrongQuestions) {
                return b.estimatedWrongQuestions - a.estimatedWrongQuestions;
            }
            return a.averageScore - b.averageScore;
        });

    const strongLessons = allSignals
        .filter((lesson) => lesson.estimatedCorrectQuestions > 0)
        .sort((a, b) => {
            if (b.estimatedCorrectQuestions !== a.estimatedCorrectQuestions) {
                return b.estimatedCorrectQuestions - a.estimatedCorrectQuestions;
            }
            return b.averageScore - a.averageScore;
        });

    const lessonCoverage = allSignals
        .slice()
        .sort((a, b) => b.questionCount - a.questionCount);

    const recommendationCandidates = (weakLessons.length > 0 ? weakLessons : lessonCoverage).slice(0, 6);
    const fallbackChartData = buildFallbackChartData({
        rows,
        attemptCount: rows.length,
        averageScore,
        totalQuestions,
        totalCorrectAnswers,
        weakLessons,
        strongLessons,
        lessonCoverage,
    });
    const recentAnswerChartData = exactAllSignals.length > 0
        ? buildRecentAnswerChartData({
            attemptCount: rows.length,
            averageScore,
            totalQuestions,
            totalCorrectAnswers,
            recentQuestionCount,
            recentCorrectAnswers,
            recentWrongAnswers,
            exactLessonSignals: exactAllSignals,
        })
        : null;

    let bullets = buildFallbackBullets({
        attemptCount: rows.length,
        averageScore,
        totalCorrectAnswers,
        totalQuestions,
        weakLessons,
        strongLessons,
    });
    let recommendedLessonKeys = recommendationCandidates.slice(0, 3).map((lesson) => lesson.sourceKey);
    let rawChartData = fallbackChartData;

    try {
        if (recommendationCandidates.length > 0 || allSignals.length > 0) {
            const aiResult = await generateAiEvaluation({
                attemptCount: rows.length,
                averageScore,
                totalCorrectAnswers,
                totalQuestions,
                attemptBreakdown,
                lessonSignals: allSignals,
                recommendationCandidates,
                fallbackChartData,
            });

            bullets = aiResult.bullets;
            recommendedLessonKeys = aiResult.recommendedLessonKeys;
            rawChartData = {
                summary: aiResult.rawChartData.summary.attempts > 0 ? aiResult.rawChartData.summary : fallbackChartData.summary,
                scoreTrend: aiResult.rawChartData.scoreTrend.length > 0 ? aiResult.rawChartData.scoreTrend : fallbackChartData.scoreTrend,
                weakLessons: aiResult.rawChartData.weakLessons.length > 0 ? aiResult.rawChartData.weakLessons : fallbackChartData.weakLessons,
                strongLessons: aiResult.rawChartData.strongLessons.length > 0 ? aiResult.rawChartData.strongLessons : fallbackChartData.strongLessons,
                lessonCoverage: aiResult.rawChartData.lessonCoverage.length > 0 ? aiResult.rawChartData.lessonCoverage : fallbackChartData.lessonCoverage,
                lessonPerformance: aiResult.rawChartData.lessonPerformance.length > 0 ? aiResult.rawChartData.lessonPerformance : fallbackChartData.lessonPerformance,
                wrongByLesson: aiResult.rawChartData.wrongByLesson.length > 0 ? aiResult.rawChartData.wrongByLesson : fallbackChartData.wrongByLesson,
                wrongByChapter: aiResult.rawChartData.wrongByChapter.length > 0 ? aiResult.rawChartData.wrongByChapter : fallbackChartData.wrongByChapter,
            };
        }
    } catch (error) {
        console.error("Dashboard AI evaluation fallback activated:", error);
    }

    if (recentAnswerChartData) {
        rawChartData = {
            ...rawChartData,
            summary: {
                ...rawChartData.summary,
                recentQuestionCount,
                recentCorrectAnswers,
                recentWrongAnswers,
            },
            weakLessons: recentAnswerChartData.weakLessons,
            strongLessons: recentAnswerChartData.strongLessons,
            lessonCoverage: recentAnswerChartData.lessonCoverage,
            lessonPerformance: recentAnswerChartData.lessonPerformance,
            wrongByLesson: recentAnswerChartData.wrongByLesson,
            wrongByChapter: recentAnswerChartData.wrongByChapter,
        };
    } else {
        rawChartData = {
            ...rawChartData,
            summary: {
                ...rawChartData.summary,
                recentQuestionCount: 0,
                recentCorrectAnswers: 0,
                recentWrongAnswers: 0,
            },
        };
    }

    const validRecommendationKeys = new Set(recommendationCandidates.map((lesson) => lesson.sourceKey));
    const recommendedLessons = Array.from(new Set(recommendedLessonKeys))
        .filter((key) => validRecommendationKeys.has(key))
        .map((key) => recommendationCandidates.find((lesson) => lesson.sourceKey === key))
        .filter((lesson): lesson is LessonSignal => Boolean(lesson))
        .slice(0, 3)
        .map((lesson) => ({
            sourceKey: lesson.sourceKey,
            lessonTitle: lesson.lessonTitle,
            lessonSlug: lesson.lessonSlug,
            courseSlug: lesson.courseSlug,
            reason: lesson.estimatedWrongQuestions > 0
                ? `Ước tính có khoảng ${lesson.estimatedWrongQuestions.toFixed(1)} câu sai gắn với bài này trong lịch sử quiz gần đây.`
                : "Phù hợp để củng cố lại nền tảng từ lịch sử quiz gần đây.",
        }));

    const evaluation: DashboardAiEvaluation = {
        hasData: true,
        bullets,
        recommendedLessons,
        attemptCount: rows.length,
        averageScore,
        rawChartData,
    };

    await storeCachedEvaluation(username, dataSignature, evaluation);

    return evaluation;
}
