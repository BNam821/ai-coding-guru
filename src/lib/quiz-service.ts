import { getFullLearningTree, getLesson } from "@/lib/learn-db";
import { sanitizeModelJson } from "@/lib/learn-ai-question";
import { geminiModel } from "@/lib/gemini";
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

function getCarefulnessInstruction(lessonCount: number) {
    if (lessonCount > 10) {
        return "Người dùng đã chọn rất nhiều bài học. Hãy đọc kỹ toàn bộ nguồn, đối chiếu giữa các bài, ưu tiên độ chính xác tuyệt đối và chấp nhận xử lý chậm hơn để tránh nhầm lẫn.";
    }

    if (lessonCount >= 8) {
        return "Người dùng đã chọn nhiều bài học. Hãy đọc kỹ từng bài, so sánh các khái niệm gần nhau trước khi tạo câu hỏi để tránh trùng lặp và sai lệch.";
    }

    if (lessonCount >= 5) {
        return "Người dùng đã chọn một phạm vi khá rộng. Hãy bao quát toàn bộ bài đã chọn và phân bổ câu hỏi đều, chính xác.";
    }

    return "Hãy tập trung bám sát các bài đã chọn và tạo câu hỏi rõ ràng, cân bằng.";
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
        throw new Error("Chưa đủ số lượng bài học để tạo bài kiểm tra.");
    }

    let fullContent = "";
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

        const truncatedContent = lesson.content.substring(0, lessonContentLimit);
        fullContent += `\n\n--- Bài học: ${item.lesson_title} ---\nsourceLessonKey: ${sourceKey}\ncourseSlug: ${item.course_slug}\nlessonSlug: ${item.lesson_slug}\n${truncatedContent}`;
    }

    if (!fullContent) {
        throw new Error("Không tìm thấy nội dung bài học.");
    }

    const sourceCatalog = Array.from(allowedSources.values())
        .map((source) => `- ${source.sourceKey} => ${source.lessonTitle} (courseSlug: ${source.courseSlug}, lessonSlug: ${source.lessonSlug})`)
        .join("\n");

    let lastError: Error | null = null;
    const carefulnessInstruction = getCarefulnessInstruction(lessonCount);

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const prompt = `
        Bạn là một trợ lý AI giáo dục (AI Tutor). Dựa trên nội dung các bài học dưới đây mà người dùng ${sourceBundle.isCustomSelection ? "đã tự chọn từ lịch sử học tập" : "vừa học"}, hãy tạo ra đúng ${questionCount} câu hỏi trắc nghiệm bằng Tiếng Việt để kiểm tra độ hiểu bài.

        Yêu cầu:
        1. Câu hỏi phải liên quan trực tiếp đến nội dung cung cấp.
        2. Chỉ sử dụng thông tin có trong dữ liệu đầu vào. Không tự thêm kiến thức ngoài bài học, không suy diễn lan man, không đặt câu hỏi lạc đề.
        3. Câu hỏi phải chặt chẽ, rõ ràng, không mơ hồ, không đánh đố bằng cách diễn đạt rối.
        4. Độ khó: Trung bình đến khó.
        5. Mỗi câu có đúng 4 đáp án lựa chọn và chỉ 1 đáp án đúng.
        6. Các đáp án nhiễu phải hợp lý, bám sát ngữ cảnh bài học, nhưng không được gây hiểu sai do diễn đạt cẩu thả.
        7. "correctAnswer" phải là số nguyên 0, 1, 2 hoặc 3.
        8. "options" phải là mảng đúng 4 chuỗi.
        9. "question" và "explanation" được phép dùng Markdown.
        10. Nếu dữ liệu bài học có mã nguồn, cú pháp, hoặc đoạn chương trình, hãy ưu tiên tạo câu hỏi có snippet code để kiểm tra hiểu biết; dùng fenced code block chuẩn với ngôn ngữ phù hợp, ví dụ \`\`\`cpp ... \`\`\`.
        11. "explanation" phải ngắn gọn nhưng chính xác, đi thẳng vào lý do đáp án đúng, tối đa ${EXPLANATION_MAX_LENGTH} ký tự.
        12. Trong "explanation", ưu tiên dùng Markdown ngắn để làm rõ ý như **nhấn mạnh**, \`inline code\`, hoặc gạch đầu dòng rất ngắn nếu thực sự cần.
        13. Không viết explanation lan man, không lặp lại nguyên đề bài, không thêm chi tiết ngoài dữ liệu nguồn.
        14. Toàn bộ phản hồi phải là JSON array thuần túy hợp lệ. Không bọc toàn bộ output trong markdown hay code block. Không thêm bất kỳ lời dẫn hay ghi chú nào ngoài JSON.
        15. ${carefulnessInstruction}
        16. Hãy phân bổ câu hỏi đủ rộng trên toàn bộ các bài đã chọn, tránh dồn quá nhiều câu vào một bài duy nhất nếu không thật sự cần thiết.
        17. Mỗi câu hỏi bắt buộc phải có trường "sourceLessonKey" để chỉ ra câu đó lấy trực tiếp từ bài học nào.
        18. "sourceLessonKey" phải khớp chính xác một giá trị trong danh sách nguồn hợp lệ bên dưới. Không được tự tạo key mới, không được để trống.
        19. Chỉ gán một nguồn cho mỗi câu hỏi, và nguồn đó phải là bài học chính được dùng để tạo câu hỏi.
        ${attempt > 0 ? `20. Lần trả lời trước không đúng schema. Lần này bắt buộc bám sát schema tuyệt đối và trả về đúng ${questionCount} câu hỏi.` : ""}

        Dữ liệu bài học:
        Danh sách nguồn hợp lệ:
        ${sourceCatalog}

        ${fullContent}

        Output format hợp lệ:
        [
          {
            "id": 1,
            "question": "Nội dung câu hỏi bằng Markdown nếu cần.",
            "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
            "correctAnswer": 0,
            "explanation": "**Đúng** vì \`x\` tăng sau vòng lặp; bám sát ví dụ trong bài.",
            "sourceLessonKey": "lesson-id-hoac-course::lesson"
          }
        ]
        `;

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const questions = validateQuizQuestions(
                JSON.parse(sanitizeModelJson(text)),
                questionCount,
                allowedSources,
            );

            return questions;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
            console.error(`Quiz generation attempt ${attempt + 1} failed:`, lastError);
        }
    }

    throw new Error(lastError?.message || "Lỗi khi xử lý dữ liệu từ AI.");
}
