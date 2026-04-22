import { geminiModel } from "@/lib/gemini";
import {
    type LearnAiQuestion,
    type LearnAiQuestionRequest,
    sanitizeCodeAnswer,
    sanitizeKeywordGroups,
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

Quy tắc chọn loại câu hỏi:
1. Dùng "code_completion" khi người học cần điền một đoạn code ngắn, cụ thể, có thể xác định đúng sai dựa trên placeholder.
2. Dùng "short_concept" khi cần trả lời khái niệm, định nghĩa, vai trò, so sánh ngắn hoặc giải thích ngắn. Đây là lựa chọn mặc định cho các mục không cần điền code và không có đáp án số duy nhất.
3. Chỉ dùng "short_numeric" nếu section cho phép một đáp án số duy nhất, rõ ràng, không mơ hồ.
4. Nếu phân vân giữa "code_completion" và "short_concept", ưu tiên "short_concept" cho nội dung lý thuyết và ưu tiên "code_completion" cho nội dung cú pháp hoặc đoạn code.
5. Không tạo trắc nghiệm A/B/C/D.
6. Không tạo câu hỏi yêu cầu chép nguyên văn một câu dài từ bài học.

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

- Nếu là "short_concept":
{
  "questionType": "short_concept",
  "title": "Tiêu đề ngắn gọn",
  "instruction": "Mô tả ngắn gọn cho biết đây là câu trả lời khái niệm ngắn, không cần đúng từng ký tự",
  "question": "Câu hỏi đầy đủ",
  "canonicalAnswer": "Đáp án mẫu ngắn gọn, tự nhiên",
  "acceptedAnswers": ["một số cách trả lời ngắn hợp lệ, không cần exhaustive"],
  "keywordGroups": [
    ["cụm từ hoặc từ đồng nghĩa cho ý chính thứ nhất"],
    ["cụm từ hoặc từ đồng nghĩa cho ý chính thứ hai"]
  ],
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
- Toàn bộ nội dung hiển thị cho người học phải là tiếng Việt tự nhiên, có dấu đầy đủ.
- Nghiêm cấm trả lời tiếng Việt không dấu như "cau hoi", "goi y", "giai thich", "muc tieu".
- Các trường "title", "instruction", "question", "hint", "explanation", "canonicalAnswer", "inputDescription", "outputDescription" bắt buộc phải viết bằng tiếng Việt có dấu.
- Nếu là "code_completion", "templateCode" phải chứa đúng placeholder "__AI_BLANK__".
- Nếu là "code_completion", "acceptedAnswers" chỉ chứa phần học sinh cần điền, ngắn gọn, không thêm giải thích.
- Nếu là "short_concept", câu hỏi phải đánh giá ý hiểu, không đánh đố bằng khác biệt viết hoa, viết thường, dấu câu, khoảng trắng.
- Nếu là "short_concept", "acceptedAnswers" là các ví dụ hợp lệ, không cần liệt kê mọi cách diễn đạt.
- Nếu là "short_concept", "keywordGroups" phải gồm các ý bắt buộc để chấm bài mềm dẻo. Mỗi group là 1 ý, chỉ cần khớp 1 từ hoặc cụm từ trong group.
- Nếu là "short_concept", chỉ tạo câu trả lời ngắn 1 đến 3 câu hoặc 1 cụm ngắn, không yêu cầu bài luận dài.
- Không yêu cầu chạy code hay chấm theo test case.
- Không nhắc đến những kiến thức không có trong section đã cung cấp.
${isRetry ? "- Lần trả lời trước bị lỗi schema hoặc sai chuẩn tiếng Việt có dấu. Lần này bắt buộc bám sát schema tuyệt đối và dùng tiếng Việt có dấu ở mọi trường hiển thị." : ""}
`.trim();
}

function normalizeQuestion(question: LearnAiQuestion): LearnAiQuestion {
    if (question.questionType === "code_completion") {
        return {
            ...question,
            acceptedAnswers: question.acceptedAnswers.map(sanitizeCodeAnswer).filter(Boolean),
        };
    }

    if (question.questionType === "short_concept") {
        return {
            ...question,
            canonicalAnswer: question.canonicalAnswer.trim(),
            acceptedAnswers: question.acceptedAnswers.map((answer) => answer.trim()).filter(Boolean),
            keywordGroups: sanitizeKeywordGroups(question.keywordGroups),
        };
    }

    return {
        ...question,
        correctAnswer: sanitizeNumericAnswer(question.correctAnswer),
        acceptedAnswers: question.acceptedAnswers.map(sanitizeNumericAnswer).filter(Boolean),
    };
}

async function generateWithGemini(prompt: string) {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function generateQuestion(request: LearnAiQuestionRequest) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const prompt = buildPrompt(request, attempt > 0);
            const text = await generateWithGemini(prompt);
            const payload = JSON.parse(sanitizeModelJson(text));
            const validatedQuestion = validateLearnAiQuestion(payload);

            return normalizeQuestion(validatedQuestion);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
        }
    }

    throw lastError || new Error("Unknown Gemini error");
}

export async function generateLearnAiQuestion(request: LearnAiQuestionRequest): Promise<LearnAiQuestion> {
    if (!request.sectionContent.trim()) {
        throw new Error("Phần nội dung này chưa đủ dữ liệu để tạo câu hỏi.");
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Thiếu cấu hình Gemini cho tính năng này.");
    }

    try {
        return await generateQuestion(request);
    } catch (error) {
        const lastError = error instanceof Error ? error : new Error("Unknown Gemini error");
        console.error("Learn AI Question Error:", lastError);
        throw new Error("AI chưa tạo được câu hỏi hợp lệ cho phần này.");
    }
}
