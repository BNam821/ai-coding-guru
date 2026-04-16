import { createClient } from "./supabase-client";

export interface CodingProblem {
    id: string;
    title: string;
    description: string;
    skeleton_code: string;
    solution_code: string;
    expected_input: string;
    expected_output: string;
    language: string;
}

const mockProblems: CodingProblem[] = [
    {
        id: "mock-1",
        title: "Các phép toán cơ bản",
        description: `Bạn hãy viết chương trình hiển thị ra màn hình thông tin sau:
\`\`\`text
2468 + 1234 = {P1}
2468 - 1234 = {P2}
2468 * 1234 = {P3}
2468 / 1234 = {P4}
\`\`\`
Trong đó:
- \`{P1}\` là tổng của 2468 và 1234.
- \`{P2}\` là hiệu của 2468 và 1234.
- \`{P3}\` là tích của 2468 và 1234.
- \`{P4}\` là thương của 2468 và 1234.
`,
        language: "cpp",
        skeleton_code: `#include <iostream>

using namespace std;

int main() {
    ...
    return 0;
}`,
        solution_code: `#include <iostream>

using namespace std;

int main() {
    cout << "2468 + 1234 = " << 2468 + 1234 << endl;
    cout << "2468 - 1234 = " << 2468 - 1234 << endl;
    cout << "2468 * 1234 = " << 2468 * 1234 << endl;
    cout << "2468 / 1234 = " << 2468 / 1234;
    return 0;
}`,
        expected_input: "",
        expected_output: `2468 + 1234 = 3702
2468 - 1234 = 1234
2468 * 1234 = 3045552
2468 / 1234 = 2`
    }
];

/**
 * Lấy ngẫu nhiên 1 câu hỏi code từ database.
 * Nếu chưa dựng database hoặc lỗi mạng, tự động fallback sang câu hỏi mock (như trong ảnh).
 */
export async function getRandomCodingProblem(): Promise<CodingProblem> {
    const supabase = createClient();
    try {
        // Lấy toàn bộ id (giả định số lượng ít) hoặc rpc chọn random. Tạm thời fetch giới hạn.
        const { data, error } = await supabase
            .from("coding_problems")
            .select("*")
            .limit(50);
        
        if (!error && data && data.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.length);
            return data[randomIndex] as CodingProblem;
        }
    } catch (err) {
        console.error("Lỗi khi kết nối supabase tới bảng coding_problems, sử dụng mock data", err);
    }
    
    // Nếu lỗi hoặc chưa có bảng, trả về bảng giả
    return mockProblems[0];
}
