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

        const prompt = `Bạn là hệ thống AI chuyên gia chấm bài lập trình chuyên nghiệp.
Nhiệm vụ của bạn là đánh giá mã nguồn của học sinh dựa trên hai tiêu chí cốt lõi:
1) Kết quả đầu ra (Actual Output) phải chính xác so với mong đợi.
2) Logic thuật toán phải đúng đắn, không gian lận bằng cách in kết quả trực tiếp (hardcode).

ĐỀ BÀI:
${problemObj.description}

ĐÁP ÁN CHUẨN (Dùng để đối chiếu logic, TUYỆT ĐỐI không dùng để giả lập kết quả):
${problemObj.solution_code}

DỮ LIỆU ĐẦU VÀO (INPUT):
${problemObj.expected_input || "(Không có đầu vào)"}

KẾT QUẢ MONG ĐỢI (EXPECTED OUTPUT):
${problemObj.expected_output}

MÃ NGUỒN CỦA HỌC SINH (Đây là mã duy nhất bạn được phép mô phỏng và đánh giá):
${userCode}

--- LUẬT PHÒNG CHỐNG GIAN LẬN (BẮT BUỘC TUÂN THỦ) ---
1. PHÁT HIỆN HARDCODE: Nếu học sinh in trực tiếp kết quả (Ví dụ: cout << 36; hoặc printf("36");) mà không thực hiện tính toán từ input: CHẤM 0 ĐIỂM NGAY LẬP TỨC.
2. GIAN LẬN NHIỀU TRƯỜNG HỢP: Nếu dùng câu lệnh điều kiện (if-else, switch) để khớp kết quả cho từng test case (Ví dụ: if (n==3) cout << 36;): CHẤM 0 ĐIỂM NGAY LẬP TỨC.
3. BỎ QUA ĐẦU VÀO: Nếu bài toán có dữ liệu đầu vào nhưng học sinh không dùng lệnh đọc dữ liệu (cin, scanf, ...) hoặc đọc vào nhưng không dùng trong tính toán: CHẤM 0 ĐIỂM.
4. MẢNG KẾT QUẢ TÍNH SẴN: Không chấp nhận việc tạo mảng chứa sẵn kết quả để in ra trừ khi đề bài yêu cầu tối ưu hóa đặc biệt: CHẤM 0 ĐIỂM.

--- QUY TRÌNH ĐÁNH GIÁ ---
A. Phân tích logic bài toán: Từ đề bài và đáp án chuẩn, xác định các bước xử lý (đọc input nào, vòng lặp/nhánh rẽ nào là bắt buộc).
B. Kiểm tra mã nguồn học sinh: Xem code có thực hiện các bước logic đó hay chỉ đang "lách luật" để có output đúng.
C. Mô phỏng thực thi: Chạy thử trong đầu mã nguồn học sinh với INPUT MAU để xem Actual Output là gì.
D. Quyết định điểm số (0-100):
   - 0 điểm: Vi phạm Luật phòng chống gian lận, code trống, hoặc lỗi biên dịch nghiêm trọng.
   - 10-40 điểm: Logic sai hoàn toàn nhưng có nỗ lực viết code xử lý (không gian lận).
   - 50-90 điểm: Logic đúng 80% trở lên, kết quả đúng nhưng còn lỗi định dạng hoặc tối ưu hóa.
   - 100 điểm: Logic hoàn toàn chính xác, không gian lận, output khớp tuyệt đối.

--- YÊU CẦU ĐỊNH DẠNG PHẢN HỒI (JSON) ---
Trả về kết quả duy nhất dưới dạng JSON với các trường:
- "actualOutput": Kết quả thực tế khi chạy code (nếu lỗi biên dịch, ghi rõ thông báo lỗi).
- "score": Điểm từ 0 đến 100.
- "feedback": Nhận xét bằng tiếng Việt có dấu, chỉ ra ưu điểm và lỗi sai (đặc biệt là lỗi gian lận nếu có). Đơn giản, dễ hiểu cho học sinh.

Mẫu JSON:
{
  "actualOutput": "...",
  "score": 0,
  "feedback": "..."
}
`;

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
