import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";
import { getSession } from "@/lib/auth";
import { recordProblemScore } from "@/lib/coding-problems-service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userCode, problemObj } = body;

        if (!userCode || !problemObj) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const prompt = `Bạn là hệ thống AI chuyên gia chấm bài lập trình chuyên nghiệp và cực kỳ khắt khe.
Nhiệm vụ của bạn là đánh giá mã nguồn dựa trên việc MÔ PHỎNG THỰC TẾ mã nguồn đó, không được tự ý suy diễn kết quả nếu mã nguồn không thực hiện.

ĐỀ BÀI:
${problemObj.description}

ĐÁP ÁN CHUẨN (Chỉ dùng để tham khảo logic):
${problemObj.solution_code}

DỮ LIỆU ĐẦU VÀO (INPUT):
${problemObj.expected_input || "(Không có đầu vào)"}

KẾT QUẢ MONG ĐỢI (EXPECTED OUTPUT):
${problemObj.expected_output}

MÃ NGUỒN CỦA HỌC SINH (Đây là đối tượng duy nhất bạn được phép chấm):
${userCode}

--- QUY TẮC BẮT BUỘC (PHẢI TUÂN THỦ) ---
1. KIỂM TRA LỆNH IN: Trước khi chấm điểm, bạn phải tìm trong mã nguồn học sinh có các lệnh in ra màn hình hay không (Ví dụ: cout, printf, print, println, console.log...). 
   - Nếu KHÔNG CÓ lệnh in: Giá trị "actualOutput" trong JSON trả về BẮT BUỘC phải là chuỗi rỗng "" hoặc "Mã nguồn không in kết quả". 
   - TUYỆT ĐỐI KHÔNG được tự điền kết quả ${problemObj.expected_output} vào "actualOutput" nếu mã nguồn của học sinh không thực hiện lệnh in giá trị đó.
2. PHÁT HIỆN GIAN LẬN: Nếu in trực tiếp kết quả (Hardcode) mà không tính toán: Chấm 0 điểm.
3. LOGIC THUẬT TOÁN: Kiểm tra xem thuật toán có giải quyết đúng vấn đề không. Đừng chỉ đối chiếu với đáp án chuẩn, hãy chấp nhận các cách giải khác nhau miễn là đúng logic và hiệu quả.
4. TỐI ƯU HÓA (VÒNG LẶP): Nếu đề bài yêu cầu in lặp lại nội dung giống nhau hoặc theo quy luật nhiều lần:
   - Sử dụng vòng lặp (for, while, loop...): Chấm 100 điểm (nếu kết quả đúng).
   - In thủ công lặp lại bằng nhiều câu lệnh in (ví dụ: in 5 dòng bằng 5 lệnh cout): Chỉ chấm tối đa 40 điểm dù kết quả đúng.
5. ĐỘ PHỨC TẠP THỜI GIAN: Bạn phải đánh giá độ phức tạp của mã nguồn (Big O). 
   - Nếu thuật toán có độ phức tạp thời gian quá lớn so với mức tối ưu (ví dụ: dùng O(n^2) trong khi có thể giải bằng O(n) hoặc O(n log n)): TRỪ TRỰC TIẾP 50 ĐIỂM khỏi tổng số điểm đáng lẽ đạt được.

--- HƯỚNG DẪN CHẤM ĐIỂM (0-100) ---
- 0 điểm: Vi phạm luật gian lận (in thẳng đáp án của bài toán cần tính toán), hoặc thuật toán sai VÀ thiếu lệnh in.
- 20 điểm: Logic thuật toán đúng hoàn toàn nhưng THIẾU LỆNH IN kết quả cuối cùng.
- 40 điểm: Kết quả đúng nhưng cách làm "thủ công", không tối ưu (ví dụ: dùng nhiều lệnh in thay vì dùng vòng lặp cho các bài toán lặp lại).
- 50-90 điểm: Thuật toán đúng, có lệnh in nhưng kết quả sai định dạng hoặc chỉ đúng một phần test case, hoặc thuật toán KHÔNG TỐI ƯU về thời gian (bị trừ 50 điểm).
- 100 điểm: Thuật toán chính xác, có lệnh in, sử dụng vòng lặp/logic tối ưu, độ phức tạp thời gian ĐẠT MỨC TỐI ƯU, kết quả khớp tuyệt đối.

--- QUY TRÌNH PHÂN TÍCH ---
BƯỚC 1: Liệt kê các lệnh in kết quả tìm được trong mã nguồn.
BƯỚC 2: Mô phỏng chạy mã nguồn với INPUT cung cấp. Nếu không có lệnh in, Actual Output là "".
BƯỚC 3: So sánh Actual Output với Expected Output.
BƯỚC 4: Đánh giá logic để quyết định điểm dựa trên thang điểm trên.

--- YÊU CẦU ĐỊNH DẠNG PHẢN HỒI (JSON) ---
Trả về kết quả duy nhất dưới dạng JSON:
{
  "actualOutput": "...",
  "score": 0,
  "feedback": "...",
  "suggestion": "..."
}
- Feedback: Nhận xét tổng quan về bài làm (Tiếng Việt).
- Suggestion: 
    + Nếu < 100 điểm: Đưa ra các chỉ dẫn cụ thể, gợi ý thuật toán hoặc đoạn mã mẫu để học sinh sửa lỗi (Tiếng Việt). Nếu bị 40 điểm do in thủ công thay vì dùng vòng lặp, hãy giải thích rõ ưu điểm của vòng lặp. Nếu bị trừ 50 điểm vì độ phức tạp thời gian, hãy ghi rõ độ phức tạp Big O hiện tại của học sinh và mức độ tối ưu mong muốn.
    + Nếu = 100 điểm: Trả về chính xác câu: "Bạn đã đạt điểm tuyệt đối! Tôi không có gì cần góp ý cho đoạn code này cả."`;

        const result = await geminiModel.generateContent(prompt);
        const textArea = result.response.text();

        // Parse JSON string from Gemini and strip code fences if present.
        let cleanJson = textArea.trim();
        if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const parsedData = JSON.parse(cleanJson);

        // Save score history if user session exists.
        const session = await getSession();
        if (session && session.username && problemObj.id) {
            await recordProblemScore(session.username, problemObj.id, parsedData.score || 0);
        }

        return NextResponse.json(parsedData);
    } catch (error) {
        console.error("Loi khi cham bai code:", error);
        return NextResponse.json(
            {
                actualOutput: "Loi he thong hoac loi thuc thi AI.",
                score: 0,
                feedback: "He thong AI khong phan hoi JSON tieu chuan hoac may chu gap van de.",
            },
            { status: 500 }
        );
    }
}
