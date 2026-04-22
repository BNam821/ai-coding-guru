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

type QuizScoreAnalysisRow = {
    created_at?: string | null;
    score?: number | null;
    correct_answers?: number | null;
    total_questions?: number | null;
    question_sources?: unknown;
};

type LessonSignal = QuizQuestionSource & {
    appearances: number;
    weakHits: number;
    strongHits: number;
    weightedScore: number;
};

export type AiRecommendedLesson = {
    sourceKey: string;
    lessonTitle: string;
    lessonSlug: string;
    courseSlug: string;
    reason: string;
};

export type DashboardAiEvaluation = {
    hasData: boolean;
    bullets: string[];
    recommendedLessons: AiRecommendedLesson[];
    attemptCount: number;
    averageScore: number;
};

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

function getNumericScore(row: QuizScoreAnalysisRow) {
    if (typeof row.score === "number" && Number.isFinite(row.score)) {
        return Math.max(0, Math.min(100, row.score));
    }

    if (
        typeof row.correct_answers === "number"
        && typeof row.total_questions === "number"
        && row.total_questions > 0
    ) {
        return Math.max(0, Math.min(100, Math.round((row.correct_answers / row.total_questions) * 100)));
    }

    return 0;
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

async function getQuizRows(username: string): Promise<QuizScoreAnalysisRow[]> {
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

function buildFallbackBullets(
    attemptCount: number,
    averageScore: number,
    weakLessons: LessonSignal[],
    strongLessons: LessonSignal[],
) {
    const topWeak = weakLessons[0]?.lessonTitle || "một vài mảng kiến thức nền";
    const topStrong = strongLessons[0]?.lessonTitle || "những bài bạn vừa ôn";

    return [
        `Bạn đã hoàn thành ${attemptCount} lượt trắc nghiệm với điểm trung bình ${averageScore}/100. Nhịp làm bài đã khá ổn định và cho thấy bạn có theo dõi quá trình học tương đối đều.`,
        `Điểm mạnh hiện tại nằm ở nhóm nội dung gần với bài "${topStrong}". Khi gặp câu hỏi quen ngữ cảnh, bạn thường giữ được độ chính xác và tốc độ xử lý khá tốt.`,
        `Điểm yếu nổi bật đang tập trung quanh "${topWeak}". Bạn nên ôn lại khái niệm cốt lõi, ví dụ mẫu và các điểm dễ nhầm để tăng độ chắc chắn khi làm bài mới.`,
    ];
}

async function generateAiBullets(input: {
    attemptCount: number;
    averageScore: number;
    weakLessons: LessonSignal[];
    strongLessons: LessonSignal[];
    recommendationCandidates: LessonSignal[];
}) {
    const weakSummary = input.weakLessons.slice(0, 4).map((lesson) => ({
        lessonTitle: lesson.lessonTitle,
        courseSlug: lesson.courseSlug,
        lessonSlug: lesson.lessonSlug,
        weakHits: lesson.weakHits,
        averageScore: Math.round(lesson.weightedScore / Math.max(lesson.appearances, 1)),
    }));

    const strongSummary = input.strongLessons.slice(0, 4).map((lesson) => ({
        lessonTitle: lesson.lessonTitle,
        courseSlug: lesson.courseSlug,
        lessonSlug: lesson.lessonSlug,
        strongHits: lesson.strongHits,
        averageScore: Math.round(lesson.weightedScore / Math.max(lesson.appearances, 1)),
    }));

    const recommendationCatalog = input.recommendationCandidates.slice(0, 6).map((lesson) => ({
        sourceKey: lesson.sourceKey,
        lessonTitle: lesson.lessonTitle,
        courseSlug: lesson.courseSlug,
        lessonSlug: lesson.lessonSlug,
    }));

    const prompt = `
Bạn là AI cố vấn học tập cho học sinh lập trình.

Hãy phân tích lịch sử làm bài trắc nghiệm của người dùng và trả về JSON hợp lệ duy nhất theo schema bên dưới.

Yêu cầu:
1. Viết đúng 3 bullet ngắn bằng tiếng Việt, tổng độ dài khoảng 90-120 chữ.
2. Bullet 1: nhận xét tổng quan từ lịch sử làm quiz.
3. Bullet 2: nêu rõ điểm mạnh.
4. Bullet 3: nêu rõ điểm yếu hoặc phần cần cải thiện.
5. Mỗi bullet phải đi thẳng vào ý, không lan man, không thêm ký hiệu Markdown ngoài nội dung bullet.
6. Chỉ dùng dữ liệu đầu vào, không bịa thêm kết quả học tập.
7. Chọn tối đa 3 bài học phù hợp nhất từ danh sách recommendationCandidates để ôn tập lại.
8. "recommendedLessonKeys" chỉ được dùng sourceKey có trong recommendationCandidates.
9. Toàn bộ phản hồi phải là JSON object thuần túy.

Input:
${JSON.stringify({
        attemptCount: input.attemptCount,
        averageScore: input.averageScore,
        weakLessons: weakSummary,
        strongLessons: strongSummary,
        recommendationCandidates: recommendationCatalog,
    })}

Schema:
{
  "bullets": [
    "Y 1",
    "Y 2",
    "Y 3"
  ],
  "recommendedLessonKeys": ["source-1", "source-2"]
}
`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const payload = JSON.parse(sanitizeModelJson(text)) as {
        bullets?: unknown;
        recommendedLessonKeys?: unknown;
    };

    const bullets = Array.isArray(payload.bullets)
        ? payload.bullets.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : [];

    const recommendedLessonKeys = Array.isArray(payload.recommendedLessonKeys)
        ? payload.recommendedLessonKeys.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : [];

    if (bullets.length !== 3) {
        throw new Error("AI evaluation bullets are invalid");
    }

    return {
        bullets,
        recommendedLessonKeys,
    };
}

export async function getDashboardAiEvaluation(username: string): Promise<DashboardAiEvaluation> {
    const rows = await getQuizRows(username);

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
        };
    }

    const averageScore = Number((rows.reduce((sum, row) => sum + getNumericScore(row), 0) / rows.length).toFixed(1));
    const sourceSignals = new Map<string, LessonSignal>();

    for (const row of rows) {
        const score = getNumericScore(row);
        const sources = parseQuestionSources(row.question_sources);
        const uniqueSources = Array.from(new Map(sources.map((source) => [source.sourceKey, source])).values());

        for (const source of uniqueSources) {
            const existing = sourceSignals.get(source.sourceKey) || {
                ...source,
                appearances: 0,
                weakHits: 0,
                strongHits: 0,
                weightedScore: 0,
            };

            existing.appearances += 1;
            existing.weightedScore += score;

            if (score < 70) {
                existing.weakHits += 1;
            }

            if (score >= 85) {
                existing.strongHits += 1;
            }

            sourceSignals.set(source.sourceKey, existing);
        }
    }

    const allSignals = Array.from(sourceSignals.values());
    const weakLessons = allSignals
        .filter((lesson) => lesson.weakHits > 0)
        .sort((a, b) => {
            if (b.weakHits !== a.weakHits) return b.weakHits - a.weakHits;
            if (a.appearances !== b.appearances) return b.appearances - a.appearances;
            return (a.weightedScore / Math.max(a.appearances, 1)) - (b.weightedScore / Math.max(b.appearances, 1));
        });
    const strongLessons = allSignals
        .filter((lesson) => lesson.strongHits > 0)
        .sort((a, b) => {
            if (b.strongHits !== a.strongHits) return b.strongHits - a.strongHits;
            return (b.weightedScore / Math.max(b.appearances, 1)) - (a.weightedScore / Math.max(a.appearances, 1));
        });

    const recommendationCandidates = (weakLessons.length > 0 ? weakLessons : allSignals)
        .slice(0, 6);

    let bullets = buildFallbackBullets(rows.length, averageScore, weakLessons, strongLessons);
    let recommendedLessonKeys = recommendationCandidates.slice(0, 3).map((lesson) => lesson.sourceKey);

    try {
        if (recommendationCandidates.length > 0) {
            const aiResult = await generateAiBullets({
                attemptCount: rows.length,
                averageScore,
                weakLessons,
                strongLessons,
                recommendationCandidates,
            });

            bullets = aiResult.bullets;
            recommendedLessonKeys = aiResult.recommendedLessonKeys;
        }
    } catch (error) {
        console.error("Dashboard AI evaluation fallback activated:", error);
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
            reason: lesson.weakHits > 0
                ? `Xuất hiện nhiều trong các lần làm bài có điểm chưa cao (${lesson.weakHits} lượt).`
                : "Phù hợp để củng cố lại nền tảng từ lịch sử quiz gần đây.",
        }));

    return {
        hasData: true,
        bullets,
        recommendedLessons,
        attemptCount: rows.length,
        averageScore,
    };
}
