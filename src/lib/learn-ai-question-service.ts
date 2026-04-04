import { geminiModel } from "@/lib/gemini";
import {
    type LearnAiQuestion,
    type LearnAiQuestionRequest,
    sanitizeCodeAnswer,
    sanitizeModelJson,
    sanitizeNumericAnswer,
    validateLearnAiQuestion,
} from "@/lib/learn-ai-question";

const MAX_SECTION_CONTENT_LENGTH = 6000;

function buildPrompt(request: LearnAiQuestionRequest, isRetry = false) {
    const truncatedSectionContent = request.sectionContent.trim().slice(0, MAX_SECTION_CONTENT_LENGTH);

    return `
Bạn là AI giáo dục cho một nền tảng học lập trình.

Hãy tạo đúng 1 câu hỏi kiểm tra kiến thức cho phần bài học bên dưới.

Ngữ cảnh:
- Bài học: ${request.lessonTitle}
- Mục số: ${request.sectionIndex}
- Tiêu đề mục: ${request.sectionHeading}
- Section ID: ${request.sectionId}

Nội dung được phép dùng:
${truncatedSectionContent}

Luật chọn loại câu hỏi:
1. Mặc định ưu tiên "code_completion".
2. Chỉ dùng "short_numeric" nếu phần kiến thức này phù hợp với một câu hỏi có đáp án số duy nhất, rõ ràng, không mơ hồ, có thể kiểm tra cục bộ.
3. Nếu phân vân giữa 2 loại, bắt buộc chọn "code_completion".
4. Không tạo trắc nghiệm A/B/C/D và không tạo câu trả lời văn bản tự do.

Schema bắt buộc:
- Nếu là "code_completion":
{
  "questionType": "code_completion",
  "title": "Tiêu đề ngắn gọn",
  "instruction": "Mô tả ngắn về yêu cầu hoàn thành đoạn code",
  "language": "Tên ngôn ngữ lập trình",
  "templateCode": "Đoạn code có chứa đúng 1 placeholder",
  "blankPlaceholder": "__AI_BLANK__",
  "acceptedAnswers": ["đoạn code đúng để thay thế placeholder"],
  "inputDescription": "Mô tả input mẫu hoặc điều kiện đầu vào",
  "outputDescription": "Mô tả output mong đợi",
  "hint": "Gợi ý ngắn",
  "explanation": "Giải thích tại sao đáp án đúng"
}

- Nếu là "short_numeric":
{
  "questionType": "short_numeric",
  "title": "Tiêu đề ngắn gọn",
  "instruction": "Mô tả ngắn về dạng câu hỏi số",
  "question": "Câu hỏi đầy đủ",
  "correctAnswer": "Một giá trị số ở dạng chuỗi hoặc số",
  "acceptedAnswers": ["các biến thể tương đương của đáp án số"],
  "unit": "Đơn vị nếu có, nếu không thì để chuỗi rỗng",
  "hint": "Gợi ý ngắn",
  "explanation": "Giải thích tại sao đáp án đúng"
}

Ràng buộc:
- Trả về JSON object duy nhất, không markdown, không code block.
- Dùng tiếng Việt cho toàn bộ nội dung hiển thị.
- Nếu là "code_completion", "templateCode" phải chứa đúng placeholder "__AI_BLANK__".
- "acceptedAnswers" phải ngắn gọn, chỉ chứa phần học sinh cần điền.
- Không yêu cầu chạy code hay chấm theo test case.
- Không nhắc đến những kiến thức không có trong section đã cung cấp.
${isRetry ? '- Lần trả lời trước bị lỗi schema. Lần này bắt buộc bám sát schema tuyệt đối.' : ""}
`.trim();
}

function normalizeQuestion(question: LearnAiQuestion): LearnAiQuestion {
    if (question.questionType === "code_completion") {
        return {
            ...question,
            acceptedAnswers: question.acceptedAnswers.map(sanitizeCodeAnswer).filter(Boolean),
        };
    }

    return {
        ...question,
        correctAnswer: sanitizeNumericAnswer(question.correctAnswer),
        acceptedAnswers: question.acceptedAnswers.map(sanitizeNumericAnswer).filter(Boolean),
    };
}

export async function generateLearnAiQuestion(request: LearnAiQuestionRequest): Promise<LearnAiQuestion> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Thiếu cấu hình Gemini cho tính năng này.");
    }

    if (!request.sectionContent.trim()) {
        throw new Error("Phần nội dung này chưa đủ dữ liệu để tạo câu hỏi.");
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const result = await geminiModel.generateContent(buildPrompt(request, attempt > 0));
            const response = await result.response;
            const text = response.text();
            const payload = JSON.parse(sanitizeModelJson(text));
            const validatedQuestion = validateLearnAiQuestion(payload);

            return normalizeQuestion(validatedQuestion);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
        }
    }

    console.error("Learn AI Question Error:", lastError);
    throw new Error("AI chưa tạo được câu hỏi hợp lệ cho phần này.");
}
