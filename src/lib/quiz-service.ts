import { getFullLearningTree, getLesson } from "@/lib/learn-db";
import { AI_PROMPT_IDS, buildQuizGenerationPrompt } from "@/lib/ai-prompts";
import { sanitizeModelJson } from "@/lib/learn-ai-question";
import { LoggedAiTaskError, runLoggedAiTask } from "@/lib/ai-logging";
import {
    GEMINI_MODEL_NAME,
    GEMINI_MODEL_PROVIDER,
    generateGeminiResponseText,
} from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    source: QuizQuestionSource;
}

export interface QuizQuestionSource {
    sourceKey: string;
    lessonId: string | null;
    lessonTitle: string;
    lessonSlug: string;
    courseSlug: string;
}

export interface QuizGenerationOptions {
    mode?: "auto" | "custom";
    selectedLessonIds?: string[];
}

export interface QuizSelectionLesson {
    id: string;
    title: string;
    slug: string;
    updatedAt: string | null;
    progressPercent: number | null;
}

export interface QuizSelectionChapter {
    id: string;
    title: string;
    lessons: QuizSelectionLesson[];
}

export interface QuizSelectionCourse {
    id: string;
    title: string;
    slug: string;
    chapters: QuizSelectionChapter[];
}

type HistoryRow = {
    lesson_id: string | null;
    course_slug: string;
    lesson_slug: string;
    lesson_title: string;
    updated_at?: string | null;
    progress_percent?: number | null;
};

const EXPLANATION_MAX_LENGTH = 150;

function buildSourceKey(row: Pick<HistoryRow, "lesson_id" | "course_slug" | "lesson_slug">) {
    return row.lesson_id || `${row.course_slug}::${row.lesson_slug}`;
}

function resolveQuestionCount(lessonCount: number) {
    if (lessonCount > 10) return 40;
    if (lessonCount >= 8) return 30;
    if (lessonCount >= 5) return 20;
    if (lessonCount >= 3) return 10;

    return 0;
}

function getLessonContentLimit(lessonCount: number) {
    if (lessonCount > 10) return 2500;
    if (lessonCount >= 8) return 3200;
    if (lessonCount >= 5) return 4000;

    return 5000;
}

function getCarefulnessInstructionText(lessonCount: number) {
    if (lessonCount > 10) {
        return "\u004e\u0067\u01b0\u1eddi \u0064\u00f9\u006e\u0067 \u0111\u00e3 \u0063\u0068\u1ecd\u006e \u0072\u1ea5\u0074 \u006e\u0068\u0069\u1ec1\u0075 \u0062\u00e0\u0069 \u0068\u1ecd\u0063. \u0048\u00e3\u0079 \u0111\u1ecd\u0063 \u006b\u1ef9 \u0074\u006f\u00e0\u006e \u0062\u1ed9 \u006e\u0067\u0075\u1ed3\u006e, \u0111\u1ed1\u0069 \u0063\u0068\u0069\u1ebf\u0075 \u0067\u0069\u1eef\u0061 \u0063\u00e1\u0063 \u0062\u00e0\u0069, \u01b0\u0075 \u0074\u0069\u00ea\u006e \u0111\u1ed9 \u0063\u0068\u00ed\u006e\u0068 \u0078\u00e1\u0063 \u0074\u0075\u0079\u1ec7\u0074 \u0111\u1ed1\u0069 \u0076\u00e0 \u0063\u0068\u1ea5\u0070 \u006e\u0068\u1ead\u006e \u0078\u1eed \u006c\u00fd \u0063\u0068\u1ead\u006d \u0068\u01a1\u006e \u0111\u1ec3 \u0074\u0072\u00e1\u006e\u0068 \u006e\u0068\u1ea7\u006d \u006c\u1eab\u006e.";
    }

    if (lessonCount >= 8) {
        return "\u004e\u0067\u01b0\u1eddi \u0064\u00f9\u006e\u0067 \u0111\u00e3 \u0063\u0068\u1ecd\u006e \u006e\u0068\u0069\u1ec1\u0075 \u0062\u00e0\u0069 \u0068\u1ecd\u0063. \u0048\u00e3\u0079 \u0111\u1ecd\u0063 \u006b\u1ef9 \u0074\u1eeb\u006e\u0067 \u0062\u00e0\u0069, \u0073\u006f \u0073\u00e1\u006e\u0068 \u0063\u00e1\u0063 \u006b\u0068\u00e1\u0069 \u006e\u0069\u1ec7\u006d \u0067\u1ea7\u006e \u006e\u0068\u0061\u0075 \u0074\u0072\u01b0\u1edb\u0063 \u006b\u0068\u0069 \u0074\u1ea1\u006f \u0063\u00e2\u0075 \u0068\u1ecf\u0069 \u0111\u1ec3 \u0074\u0072\u00e1\u006e\u0068 \u0074\u0072\u00f9\u006e\u0067 \u006c\u1eb7\u0070 \u0076\u00e0 \u0073\u0061\u0069 \u006c\u1ec7\u0063\u0068.";
    }

    if (lessonCount >= 5) {
        return "\u004e\u0067\u01b0\u1eddi \u0064\u00f9\u006e\u0067 \u0111\u00e3 \u0063\u0068\u1ecd\u006e \u006d\u1ed9\u0074 \u0070\u0068\u1ea1\u006d \u0076\u0069 \u006b\u0068\u00e1 \u0072\u1ed9\u006e\u0067. \u0048\u00e3\u0079 \u0062\u0061\u006f \u0071\u0075\u00e1\u0074 \u0074\u006f\u00e0\u006e \u0062\u1ed9 \u0062\u00e0\u0069 \u0111\u00e3 \u0063\u0068\u1ecd\u006e \u0076\u00e0 \u0070\u0068\u00e2\u006e \u0062\u1ed5 \u0063\u00e2\u0075 \u0068\u1ecf\u0069 \u0111\u1ec1\u0075, \u0063\u0068\u00ed\u006e\u0068 \u0078\u00e1\u0063.";
    }

    return "\u0048\u00e3\u0079 \u0074\u1ead\u0070 \u0074\u0072\u0075\u006e\u0067 \u0062\u00e1\u006d \u0073\u00e1\u0074 \u0063\u00e1\u0063 \u0062\u00e0\u0069 \u0111\u00e3 \u0063\u0068\u1ecd\u006e \u0076\u00e0 \u0074\u1ea1\u006f \u0063\u00e2\u0075 \u0068\u1ecf\u0069 \u0072\u00f5 \u0072\u00e0\u006e\u0067, \u0063\u00e2\u006e \u0062\u1eb1\u006e\u0067.";
}

function validateQuizQuestions(
    payload: unknown,
    expectedQuestionCount: number,
    allowedSources: Map<string, QuizQuestionSource>,
): QuizQuestion[] {
    if (!Array.isArray(payload) || payload.length === 0) {
        throw new Error("Quiz payload must be a non-empty array");
    }

    if (payload.length !== expectedQuestionCount) {
        throw new Error(`Quiz payload must contain exactly ${expectedQuestionCount} questions`);
    }

    return payload.map((item, index) => {
        if (!item || typeof item !== "object") {
            throw new Error(`Question ${index + 1} is invalid`);
        }

        const question = typeof (item as { question?: unknown }).question === "string"
            ? (item as { question: string }).question.trim()
            : "";
        const explanation = typeof (item as { explanation?: unknown }).explanation === "string"
            ? (item as { explanation: string }).explanation.trim()
            : "";
        const options = Array.isArray((item as { options?: unknown }).options)
            ? (item as { options: unknown[] }).options
                .filter((option): option is string => typeof option === "string")
                .map((option) => option.trim())
            : [];
        const rawCorrectAnswer = (item as { correctAnswer?: unknown }).correctAnswer;
        const correctAnswer = typeof rawCorrectAnswer === "number"
            ? rawCorrectAnswer
            : Number(rawCorrectAnswer);
        const rawId = (item as { id?: unknown }).id;
        const id = typeof rawId === "number" ? rawId : index + 1;
        const sourceLessonKey = typeof (item as { sourceLessonKey?: unknown }).sourceLessonKey === "string"
            ? (item as { sourceLessonKey: string }).sourceLessonKey.trim()
            : "";

        if (!question) {
            throw new Error(`Question ${index + 1} is missing content`);
        }

        if (options.length !== 4 || options.some((option) => !option)) {
            throw new Error(`Question ${index + 1} must contain exactly 4 options`);
        }

        if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
            throw new Error(`Question ${index + 1} has an invalid correctAnswer`);
        }

        if (!explanation) {
            throw new Error(`Question ${index + 1} is missing explanation`);
        }

        if (explanation.length > EXPLANATION_MAX_LENGTH) {
            throw new Error(`Question ${index + 1} explanation must be at most ${EXPLANATION_MAX_LENGTH} characters`);
        }

        const source = allowedSources.get(sourceLessonKey);
        if (!source) {
            throw new Error(`Question ${index + 1} has an invalid sourceLessonKey`);
        }

        return {
            id,
            question,
            options,
            correctAnswer,
            explanation,
            source,
        };
    });
}

async function getHistoryRows(username: string) {
    const { data, error } = await supabaseAdmin
        .from("user_learning_history")
        .select("lesson_id, course_slug, lesson_slug, lesson_title, updated_at, progress_percent")
        .eq("username", username)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching history:", error);
        throw new Error("Không thể lấy lịch sử học tập");
    }

    return (data || []) as HistoryRow[];
}

export async function getQuizSelectableSources(username: string): Promise<QuizSelectionCourse[]> {
    const historyRows = await getHistoryRows(username);
    const latestByLessonId = new Map<string, { updatedAt: string | null; progressPercent: number | null }>();

    for (const row of historyRows) {
        if (!row.lesson_id || latestByLessonId.has(row.lesson_id)) {
            continue;
        }

        latestByLessonId.set(row.lesson_id, {
            updatedAt: row.updated_at || null,
            progressPercent: typeof row.progress_percent === "number" ? row.progress_percent : null,
        });
    }

    if (latestByLessonId.size === 0) {
        return [];
    }

    const learningTree = await getFullLearningTree();

    return learningTree
        .map((course) => {
            const chapters = (course.chapters || [])
                .map((chapter) => {
                    const lessons = (chapter.lessons || [])
                        .filter((lesson) => latestByLessonId.has(lesson.id))
                        .map((lesson) => {
                            const metadata = latestByLessonId.get(lesson.id);

                            return {
                                id: lesson.id,
                                title: lesson.title,
                                slug: lesson.slug,
                                updatedAt: metadata?.updatedAt || null,
                                progressPercent: metadata?.progressPercent ?? null,
                            };
                        });

                    if (lessons.length === 0) {
                        return null;
                    }

                    return {
                        id: chapter.id,
                        title: chapter.title,
                        lessons,
                    };
                })
                .filter((chapter): chapter is QuizSelectionChapter => Boolean(chapter));

            if (chapters.length === 0) {
                return null;
            }

            return {
                id: course.id,
                title: course.title,
                slug: course.slug,
                chapters,
            };
        })
        .filter((course): course is QuizSelectionCourse => Boolean(course));
}

async function getAutoLessonSources(username: string) {
    const historyRows = await getHistoryRows(username);
    const history = historyRows.slice(0, 3);

    if (history.length === 0) {
        throw new Error("Bạn chưa học bài nào để kiểm tra kiến thức.");
    }

    return {
        history,
        questionCount: 10,
        isCustomSelection: false,
    };
}

async function getCustomLessonSources(username: string, selectedLessonIds: string[]) {
    const uniqueLessonIds = Array.from(new Set(selectedLessonIds.filter(Boolean)));

    if (uniqueLessonIds.length < 3) {
        throw new Error("Hãy chọn ít nhất 3 bài học để tạo bài kiểm tra tự chọn.");
    }

    const historyRows = await getHistoryRows(username);
    const historyByLessonId = new Map<string, HistoryRow>();

    for (const row of historyRows) {
        if (row.lesson_id && !historyByLessonId.has(row.lesson_id)) {
            historyByLessonId.set(row.lesson_id, row);
        }
    }

    const selectedHistory = uniqueLessonIds
        .map((lessonId) => historyByLessonId.get(lessonId))
        .filter((row): row is HistoryRow => Boolean(row));

    if (selectedHistory.length !== uniqueLessonIds.length) {
        throw new Error("Một số bài học đã chọn không còn hợp lệ trong lịch sử học tập.");
    }

    return {
        history: selectedHistory,
        questionCount: resolveQuestionCount(uniqueLessonIds.length),
        isCustomSelection: true,
    };
}

export async function generateQuizForUser(username: string, options: QuizGenerationOptions = {}): Promise<QuizQuestion[]> {
    console.log(`Generating quiz for user: ${username}`, options);

    const sourceBundle = options.mode === "custom"
        ? await getCustomLessonSources(username, options.selectedLessonIds || [])
        : await getAutoLessonSources(username);

    const lessonCount = sourceBundle.history.length;
    const questionCount = sourceBundle.questionCount;

    if (questionCount === 0) {
        throw new Error("\u0043\u0068\u01b0\u0061 \u0111\u1ee7 \u0073\u1ed1 \u006c\u01b0\u1ee3\u006e\u0067 \u0062\u00e0\u0069 \u0068\u1ecd\u0063 \u0111\u1ec3 \u0074\u1ea1\u006f \u0062\u00e0\u0069 \u006b\u0069\u1ec3\u006d \u0074\u0072\u0061.");
    }

    const lessonSources: Array<{
        courseSlug: string;
        lessonSlug: string;
        lessonTitle: string;
        sourceKey: string;
        content: string;
    }> = [];
    const lessonContentLimit = getLessonContentLimit(lessonCount);
    const allowedSources = new Map<string, QuizQuestionSource>();

    for (const item of sourceBundle.history) {
        const lesson = await getLesson(item.course_slug, item.lesson_slug);
        if (!lesson?.content) {
            continue;
        }

        const sourceKey = buildSourceKey(item);
        allowedSources.set(sourceKey, {
            sourceKey,
            lessonId: item.lesson_id,
            lessonTitle: item.lesson_title,
            lessonSlug: item.lesson_slug,
            courseSlug: item.course_slug,
        });

        lessonSources.push({
            courseSlug: item.course_slug,
            lessonSlug: item.lesson_slug,
            lessonTitle: item.lesson_title,
            sourceKey,
            content: lesson.content.substring(0, lessonContentLimit),
        });
    }

    if (lessonSources.length === 0) {
        throw new Error("\u004b\u0068\u00f4\u006e\u0067 \u0074\u00ec\u006d \u0074\u0068\u1ea5\u0079 \u006e\u1ed9\u0069 \u0064\u0075\u006e\u0067 \u0062\u00e0\u0069 \u0068\u1ecd\u0063.");
    }

    const sourceCatalog = Array.from(allowedSources.values())
        .map((source) => `- ${source.sourceKey} => ${source.lessonTitle} (courseSlug: ${source.courseSlug}, lessonSlug: ${source.lessonSlug})`)
        .join("\n");

    let lastError: Error | null = null;
    const carefulnessInstruction = getCarefulnessInstructionText(lessonCount);
    const selectedLessonIds = sourceBundle.history
        .map((item) => item.lesson_id)
        .filter((lessonId): lessonId is string => Boolean(lessonId));

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const prompt = buildQuizGenerationPrompt({
            questionCount,
            lessonCount,
            isCustomSelection: sourceBundle.isCustomSelection,
            explanationMaxLength: EXPLANATION_MAX_LENGTH,
            carefulnessInstruction,
            sourceCatalog,
            lessonSources,
            isRetry: attempt > 0,
        });

        try {
            return await runLoggedAiTask({
                username,
                taskType: "quiz-generation",
                promptId: AI_PROMPT_IDS.QUIZ_GENERATION,
                endpoint: "/api/quiz/generate",
                modelProvider: GEMINI_MODEL_PROVIDER,
                modelName: GEMINI_MODEL_NAME,
                promptText: prompt,
                requestPayload: {
                    mode: sourceBundle.isCustomSelection ? "custom" : "auto",
                    selectedLessonIds,
                    selectedLessonCount: selectedLessonIds.length,
                },
                metadata: {
                    attempt: attempt + 1,
                    isRetry: attempt > 0,
                    lessonCount,
                    questionCount,
                },
                generateResponseText: generateGeminiResponseText,
                parseResponse: (text) => {
                    let payload: unknown;

                    try {
                        payload = JSON.parse(sanitizeModelJson(text));
                    } catch (error) {
                        throw new LoggedAiTaskError("Failed to parse quiz generation JSON", { responseText: text }, error);
                    }

                    try {
                        return {
                            value: validateQuizQuestions(
                                payload,
                                questionCount,
                                allowedSources,
                            ),
                            responsePayload: payload,
                        };
                    } catch (error) {
                        throw new LoggedAiTaskError(
                            error instanceof Error ? error.message : "Invalid quiz generation payload",
                            {
                                responseText: text,
                                responsePayload: payload,
                            },
                            error,
                        );
                    }
                },
            });
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
            console.error(`Quiz generation attempt ${attempt + 1} failed:`, lastError);
        }
    }

    throw new Error(lastError?.message || "\u004c\u1ed7\u0069 \u006b\u0068\u0069 \u0078\u1eed \u006c\u00fd \u0064\u1eef \u006c\u0069\u1ec7\u0075 \u0074\u1eeb AI.");
}
