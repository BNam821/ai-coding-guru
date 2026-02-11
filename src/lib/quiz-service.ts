import { supabase } from "@/lib/supabase";
import { getLesson } from "@/lib/learn-db";
import { geminiModel } from "@/lib/gemini";

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number; // 0-3
    explanation: string;
}

export async function generateQuizForUser(username: string): Promise<QuizQuestion[]> {
    console.log(`Generating quiz for user: ${username}`);

    // 1. Get recent history (Top 3 most recently accessed lessons)
    const { data: history, error } = await supabase
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
    const prompt = `
    Bạn là một trợ lý AI giáo dục (AI Tutor). Dựa trên nội dung các bài học dưới đây mà người dùng vừa học, hãy tạo ra 10 câu hỏi trắc nghiệm (Multiple Choice Questions) bằng Tiếng Việt để kiểm tra độ hiểu bài.

    Yêu cầu:
    1. Câu hỏi phải liên quan trực tiếp đến nội dung cung cấp.
    2. Độ khó: Trung bình - Khó.
    3. Có 4 đáp án lựa chọn, chỉ 1 đáp án đúng.
    4. Giải thích ngắn gọn tại sao đáp án đó đúng.

    Dữ liệu bài học:
    ${fullContent}

    Output Format (JSON Array ONLY, no markdown code blocks):
    [
        {
            "id": 1,
            "question": "Nội dung câu hỏi?",
            "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
            "correctAnswer": 0, // Index của đáp án đúng (0, 1, 2, hoặc 3)
            "explanation": "Giải thích..."
        }
    ]
    `;

    console.log("Sending prompt to Gemini...");
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini response received.");

    try {
        // Clean up markdown if present (Gemini sometimes wraps in ```json ... ```)
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const questions = JSON.parse(jsonStr);

        // Validate structure briefly
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Format JSON không hợp lệ");
        }

        return questions;
    } catch (e) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("Lỗi khi xử lý dữ liệu từ AI.");
    }
}
