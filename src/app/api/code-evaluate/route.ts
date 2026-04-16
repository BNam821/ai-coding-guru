import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userCode, problemObj } = body;

        if (!userCode || !problemObj) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const prompt = `Bạn là một hệ thống tự động chạy và chấm điểm code (AI Code Execution & Grading System).
Nhiệm vụ của bạn là đánh giá source code mà học sinh gửi so với đáp án chuẩn.

Đề bài:
${problemObj.description}

Code mẫu (solution chuẩn nhất 100 điểm):
${problemObj.solution_code}

Input mẫu:
${problemObj.expected_input || "(Không có input)"}

Output mẫu mong đợi (Expected Output):
${problemObj.expected_output}

Code học sinh nộp:
${userCode}

Hãy MÔ PHỎNG việc thực thi code của học sinh một cách chính xác với Input mẫu ở trên.
Yêu cầu:
1. "actualOutput": Mô phỏng lại chính xác text output nếu chạy code học sinh. Nếu code lỗi (Syntax error, Compile error), hãy mô phỏng thông báo lỗi.
2. "score": Số điểm từ 0 - 100. Tuân thủ TUYỆT ĐỐI quy tắc chấm điểm sau:
   - TIÊU CHÍ 0 ĐIỂM NGAY LẬP TỨC: Nếu "actualOutput" thiếu hẳn các chuỗi văn bản/câu từ quan trọng so với "Output mẫu mong đợi" (Ví dụ: đề bài yêu cầu in "2468 + 1234 = 3702" nhưng học sinh chỉ in "3702"), hoặc sai cấu trúc hoàn toàn, hoặc code lỗi biên dịch/runtime, BẮT BUỘC CHẤM 0 ĐIỂM. KHÔNG được châm chước.
   - TIÊU CHÍ TRỪ 5 ĐIỂM MỖI LỖI: Chỉ áp dụng khi output CỰC KỲ GIỐNG mẫu nhưng sai khác ở mức độ RẤT NHỎ (ví dụ: khoảng trắng thừa/thiếu giữa các từ, sai lệch in hoa/in thường, dư 1 dấu phẩy/chấm). TRỪ 5 ĐIỂM cho mỗi lỗi nhỏ này (trừ dồn).
   - ĐIỂM TỐI ĐA (100 điểm): Khi "actualOutput" giống hệt 100% "Output mẫu mong đợi", kể cả từng dấu cách. (Chỉ trừ nhẹ 1-2 điểm nếu code quá cồng kềnh).
3. "feedback": Nhận xét bằng tiếng Việt (Hỗ trợ Markdown). Giải thích rõ ràng vì sao lại cho 0 điểm (nếu output thiếu hẳn text) hoặc vì sao bị trừ 5 điểm (nếu chỉ sai định dạng nhỏ). Chỉ ra mẹo tối ưu code nếu có.

Phản hồi LUÔN LUÔN phải đúng chuẩn JSON sau:
{
  "actualOutput": "Output mà chương trình sinh ra",
  "score": 100,
  "feedback": "Nhận xét..."
}
`;

        const result = await geminiModel.generateContent(prompt);
        const textArea = result.response.text();
        
        // Parse the JSON string from Gemini (ensure it replaces code blocks if returned)
        let cleanJson = textArea.trim();
        if (cleanJson.startsWith("\`\`\`json")) {
            cleanJson = cleanJson.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
        } else if (cleanJson.startsWith("\`\`\`")) {
            cleanJson = cleanJson.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
        }

        const parsedData = JSON.parse(cleanJson);

        return NextResponse.json(parsedData);
    } catch (error) {
        console.error("Lỗi khi chấm bài code:", error);
        return NextResponse.json({ 
            actualOutput: "Lỗi hệ thống hoặc lỗi thực thi AI.",
            score: 0,
            feedback: "Hệ thống AI không phản hồi json tiêu chuẩn hoặc máy chủ gặp vấn đề." 
        }, { status: 500 });
    }
}
