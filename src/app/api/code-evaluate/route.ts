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

ĐÁP ÁN CHUẨN (Chỉ dùng để đối chiếu, TUYỆT ĐỐI không dùng code này để giả lập output cho học sinh):
${problemObj.solution_code}

Input mẫu:
${problemObj.expected_input || "(Không có input)"}

Output mẫu mong đợi (Expected Output):
${problemObj.expected_output}

CODE HỌC SINH NỘP (Đây là code duy nhất bạn được phép thực thi/mô phỏng):
${userCode}

Hãy MÔ PHỎNG việc thực thi "CODE HỌC SINH NỘP" một cách trung thực với Input mẫu ở trên.
Yêu cầu nghiêm ngặt:
1. "actualOutput": Mô phỏng lại chính xác text output nếu chạy code học sinh. 
   - Nếu code học sinh chỉ có bộ khung (skeleton) hoặc chứa các dấu "...", "TODO", hoặc không có logic giải quyết bài toán -> actualOutput phải là rỗng hoặc báo lỗi.
   - Nếu code lỗi biên dịch (ví dụ: thiếu dấu chấm phẩy, khai báo sai) -> mô phỏng chính xác thông báo lỗi compiler.
2. "score": Số điểm từ 0 - 100.
   - QUY TẮC SỐ 1: Nếu học sinh chưa viết code logic (code vẫn còn dấu "..." hoặc chỉ có main trống) -> BẮT BUỘC CHẤM 0 ĐIỂM.
   - QUY TẮC SỐ 2: Không được tự tiện "suy luận" rằng học sinh định viết gì. Nếu code không chạy được -> 0 điểm.
   - TIÊU CHÍ TRỪ 5 ĐIỂM MỖI LỖI: Chỉ áp dụng khi output CỰC KỲ GIỐNG mẫu nhưng sai khác ở mức độ RẤT NHỎ (ví dụ: khoảng trắng thừa/thiếu, khác biệt in hoa/in thường).
3. "feedback": Nhận xét bằng tiếng Việt (Markdown). 
   - CHỈ nhận xét về logic bài làm của học sinh, lỗi sai nếu có, hoặc lời khuyên tối ưu code.
   - TUYỆT ĐỐI KHÔNG đưa vào các thông tin như: tiêu chí chấm điểm, quy tắc trừ điểm, điểm số cụ thể (nằm ở trường score riêng), hay bất kỳ thông tin hệ thống nào không liên quan trực tiếp đến nội dung bài tập.
   - Nếu chấm 0 điểm do code trống/skeleton, hãy phản hồi ngắn gọn: "Bạn chưa hoàn thiện nội dung mã nguồn. Vui lòng thay thế phần '...' bằng logic giải bài toán."

Phản hồi LUÔN LUÔN phải đúng chuẩn JSON sau:
{
  "actualOutput": "Output thực tế từ code học sinh",
  "score": 0,
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
