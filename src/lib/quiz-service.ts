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
        return "Nguoi dung da chon rat nhieu bai hoc. Hay doc ky toan bo nguon, doi chieu giua cac bai, uu tien do chinh xac tuyet doi va chap nhan xu ly cham hon de tranh nham lan.";
    }

    if (lessonCount >= 8) {
        return "Nguoi dung da chon nhieu bai hoc. Hay doc ky tung bai, so sanh cac khai niem gan nhau truoc khi tao cau hoi de tranh trung lap va sai lech.";
    }

    if (lessonCount >= 5) {
        return "Nguoi dung da chon mot pham vi kha rong. Hay bao quat toan bo bai da chon va phan bo cau hoi deu, chinh xac.";
    }

    return "Hay tap trung bam sat cac bai da chon va tao cau hoi ro rang, can bang.";
}

function validateQuizQuestions(payload: unknown, expectedQuestionCount: number): QuizQuestion[] {
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

        return {
            id,
            question,
            options,
            correctAnswer,
            explanation,
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
        throw new Error("Khong the lay lich su hoc tap");
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
        throw new Error("Ban chua hoc bai nao de kiem tra kien thuc.");
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
        throw new Error("Hay chon it nhat 3 bai hoc de tao bai kiem tra tu chon.");
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
        throw new Error("Mot so bai hoc da chon khong con hop le trong lich su hoc tap.");
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
        throw new Error("Chua du so luong bai hoc de tao bai kiem tra.");
    }

    let fullContent = "";
    const lessonContentLimit = getLessonContentLimit(lessonCount);

    for (const item of sourceBundle.history) {
        const lesson = await getLesson(item.course_slug, item.lesson_slug);
        if (!lesson?.content) {
            continue;
        }

        const truncatedContent = lesson.content.substring(0, lessonContentLimit);
        fullContent += `\n\n--- Bai hoc: ${item.lesson_title} ---\n${truncatedContent}`;
    }

    if (!fullContent) {
        throw new Error("Khong tim thay noi dung bai hoc.");
    }

    let lastError: Error | null = null;
    const carefulnessInstruction = getCarefulnessInstruction(lessonCount);

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const prompt = `
        Ban la mot tro ly AI giao duc (AI Tutor). Dua tren noi dung cac bai hoc duoi day ma nguoi dung ${sourceBundle.isCustomSelection ? "da tu chon tu lich su hoc tap" : "vua hoc"}, hay tao ra dung ${questionCount} cau hoi trac nghiem bang Tieng Viet de kiem tra do hieu bai.

        Yeu cau:
        1. Cau hoi phai lien quan truc tiep den noi dung cung cap.
        2. Chi su dung thong tin co trong du lieu dau vao. Khong tu them kien thuc ngoai bai hoc, khong suy dien lan man, khong dat cau hoi lac de.
        3. Cau hoi phai chat che, ro rang, khong mo ho, khong danh do bang cach dien dat roi.
        4. Do kho: Trung binh den kho.
        5. Moi cau co dung 4 dap an lua chon va chi 1 dap an dung.
        6. Cac dap an nhieu phai hop ly, bam sat ngu canh bai hoc, nhung khong duoc gay hieu sai do dien dat cau tha.
        7. "correctAnswer" phai la so nguyen 0, 1, 2 hoac 3.
        8. "options" phai la mang dung 4 chuoi.
        9. "question" va "explanation" duoc phep dung Markdown.
        10. Neu du lieu bai hoc co ma nguon, cu phap, hoac doan chuong trinh, hay uu tien tao cau hoi co snippet code de kiem tra hieu biet; dung fenced code block chuan voi ngon ngu phu hop, vi du \`\`\`cpp ... \`\`\`.
        11. "explanation" phai ngan gon nhung chinh xac, di thang vao ly do dap an dung, toi da ${EXPLANATION_MAX_LENGTH} ky tu.
        12. Trong "explanation", uu tien dung Markdown ngan de lam ro y nhu **nhan manh**, \`inline code\`, hoac gach dau dong rat ngan neu thuc su can.
        13. Khong viet explanation lan man, khong lap lai nguyen de bai, khong them chi tiet ngoai du lieu nguon.
        14. Toan bo phan hoi phai la JSON array thuan tuy hop le. Khong boc toan bo output trong markdown hay code block. Khong them bat ky loi dan hay ghi chu nao ngoai JSON.
        15. ${carefulnessInstruction}
        16. Hay phan bo cau hoi du rong tren toan bo cac bai da chon, tranh don qua nhieu cau vao mot bai duy nhat neu khong that su can thiet.
        ${attempt > 0 ? `17. Lan tra loi truoc khong dung schema. Lan nay bat buoc bam sat schema tuyet doi va tra ve dung ${questionCount} cau hoi.` : ""}

        Du lieu bai hoc:
        ${fullContent}

        Output format hop le:
        [
          {
            "id": 1,
            "question": "Noi dung cau hoi bang Markdown neu can.",
            "options": ["Dap an A", "Dap an B", "Dap an C", "Dap an D"],
            "correctAnswer": 0,
            "explanation": "**Dung** vi \`x\` tang sau vong lap; bam sat vi du trong bai."
          }
        ]
        `;

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const questions = validateQuizQuestions(JSON.parse(sanitizeModelJson(text)), questionCount);

            return questions;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
            console.error(`Quiz generation attempt ${attempt + 1} failed:`, lastError);
        }
    }

    throw new Error(lastError?.message || "Loi khi xu ly du lieu tu AI.");
}
