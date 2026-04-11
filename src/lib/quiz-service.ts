import { supabaseAdmin } from "@/lib/supabase-admin";
import { getLesson } from "@/lib/learn-db";
import { geminiModel } from "@/lib/gemini";
import { sanitizeModelJson } from "@/lib/learn-ai-question";

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number; // 0-3
    explanation: string;
}

function validateQuizQuestions(payload: unknown): QuizQuestion[] {
    if (!Array.isArray(payload) || payload.length === 0) {
        throw new Error("Quiz payload must be a non-empty array");
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
            ? (item as { options: unknown[] }).options.filter((option): option is string => typeof option === "string").map((option) => option.trim())
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

        return {
            id,
            question,
            options,
            correctAnswer,
            explanation,
        };
    });
}

export async function generateQuizForUser(username: string): Promise<QuizQuestion[]> {
    console.log(`Generating quiz for user: ${username}`);

    // 1. Get recent history (Top 3 most recently accessed lessons)
    const { data: history, error } = await supabaseAdmin
        .from("user_learning_history")
        .select("course_slug, lesson_slug, lesson_title")
        .eq("username", username)
        .order("updated_at", { ascending: false })
        .limit(3);

    if (error) {
        console.error("Error fetching history:", error);
        throw new Error("Không thể lấy lịch sử học tập");
    }

    if (!history || history.length === 0) {
        throw new Error("Bạn chưa học bài nào để kiểm tra kiến thức.");
    }

    // 2. Get content from these lessons
    let fullContent = "";
    console.log(`Found ${history.length} recent lessons.`);

    for (const item of history) {
        const lesson = await getLesson(item.course_slug, item.lesson_slug);
        if (lesson?.content) {
            // Limit content per lesson to avoid token limits (approx 2000 chars)
            // Gemini Flash has huge context but let's be efficient
            const truncatedContent = lesson.content.substring(0, 5000);
            fullContent += `\n\n--- Bài học: ${item.lesson_title} ---\n${truncatedContent}`;
        }
    }

    if (!fullContent) {
        throw new Error("Không tìm thấy nội dung bài học.");
    }

    // 3. Generate with Gemini
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const prompt = `
        Bạn là một trợ lý AI giáo dục (AI Tutor). Dựa trên nội dung các bài học dưới đây mà người dùng vừa học, hãy tạo ra đúng 10 câu hỏi trắc nghiệm bằng Tiếng Việt để kiểm tra độ hiểu bài.

        Yêu cầu:
        1. Câu hỏi phải liên quan trực tiếp đến nội dung cung cấp.
        2. Độ khó: Trung bình đến khó.
        3. Mỗi câu có đúng 4 đáp án lựa chọn và chỉ 1 đáp án đúng.
        4. "correctAnswer" phải là số nguyên 0, 1, 2 hoặc 3.
        5. "options" phải là mảng đúng 4 chuỗi.
        6. Mỗi câu phải có "explanation" ngắn gọn, rõ ràng.
        7. Trả về JSON array thuần túy, không markdown, không code block, không giải thích thêm ngoài JSON.
        ${attempt > 0 ? '8. Lần trả lời trước không đúng schema. Lần này bắt buộc bám sát schema tuyệt đối.' : ""}

        Dữ liệu bài học:
        ${fullContent}

        Output format hợp lệ:
        [
          {
            "id": 1,
            "question": "Nội dung câu hỏi?",
            "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
            "correctAnswer": 0,
            "explanation": "Giải thích ngắn gọn."
          }
        ]
        `;

        console.log(`Sending prompt to Gemini (attempt ${attempt + 1})...`);

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log("Gemini response received.");

            const questions = validateQuizQuestions(JSON.parse(sanitizeModelJson(text)));
            return questions;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
            console.error(`Quiz generation attempt ${attempt + 1} failed:`, lastError);
        }
    }

    throw new Error("Lỗi khi xử lý dữ liệu từ AI.");
}
