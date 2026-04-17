import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";

export interface CodingProblem {
    id: string;
    title: string;
    description: string;
    skeleton_code: string;
    solution_code: string;
    expected_input: string;
    expected_output: string;
    language: string;
    tags?: string[];
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

/**
 * Lấy chi tiết 1 bài tập theo ID.
 */
export async function getCodingProblemById(id: string): Promise<CodingProblem | null> {
    try {
        const { data, error } = await supabase
            .from("coding_problems")
            .select("*")
            .eq("id", id)
            .single();
        
        if (!error && data) {
            return data as CodingProblem;
        }

        // Check in mock if not found in DB (for test purposes)
        const mock = mockProblems.find(p => p.id === id);
        if (mock) return mock;
    } catch (err) {
        console.error("Lỗi khi lấy bài tập theo ID:", err);
    }
    return null;
}

/**
 * Láy danh sách toàn bộ các tags duy nhất từ tất cả bài học.
 */
export async function getUniqueLessonTags(): Promise<string[]> {
    const { data, error } = await supabase.rpc('get_unique_lesson_tags');
    
    // Nếu rpc chưa được định nghĩa, fallback sang query chay (tốn kém hơn nhưng an toàn)
    if (error) {
        const { data: lessons } = await supabase.from('lessons').select('tags');
        if (!lessons) return [];
        const allTags = lessons.flatMap(l => l.tags || []);
        return Array.from(new Set(allTags));
    }
    
    return data || [];
}

/**
 * Lấy bài tập thông minh dựa trên lịch sử học (3 bài gần nhất) và bỏ qua các bài đã đạt 100đ.
 */
export async function getSmartCodingProblem(
    username: string,
    options?: { excludeProblemId?: string }
): Promise<{ problem: CodingProblem | null, status: 'ok' | 'exhausted' }> {

    // 1. Lấy 3 bài học gần nhất của user để lấy tags
    const { data: recentLessons } = await supabase
        .from('user_learning_history')
        .select('lesson_id')
        .eq('username', username)
        .order('updated_at', { ascending: false })
        .limit(3);

    let targetTags: string[] = [];
    if (recentLessons && recentLessons.length > 0) {
        const { data: lessons } = await supabase
            .from('lessons')
            .select('tags')
            .in('id', recentLessons.map(l => l.lesson_id));
        
        // Chuẩn hóa tags: lowercase và trim
        targetTags = Array.from(new Set(
            lessons?.flatMap(l => l.tags || [])
                .map(t => t.toLowerCase().trim()) || []
        ));
    }

    // 2. Lấy danh sách ID các bài tập user đã đạt 100đ
    const { data: completedHistory } = await supabase
        .from('user_problem_history')
        .select('problem_id')
        .eq('username', username)
        .eq('score', 100);
    
    const completedIds = completedHistory?.map(h => h.problem_id) || [];

    // 3. Tìm bài tập chưa hoàn thành
    let query = supabase.from('coding_problems').select('*');
    if (completedIds.length > 0) {
        // Đảm bảo syntax IN đúng với UUID list
        const quotedCompletedIds = completedIds.map((id: string) => `"${id}"`).join(',');
        query = query.not('id', 'in', `(${quotedCompletedIds})`);
    }

    if (options?.excludeProblemId) {
        query = query.neq('id', options.excludeProblemId);
    }

    const { data: allAvailable } = await query;
    if (!allAvailable || allAvailable.length === 0) {
        return { problem: null, status: 'exhausted' };
    }

    // 4. Phân tầng bài tập (Tiered Selection)
    // Tầng 1: Có Tags khớp với bài học gần đây
    const tier1 = allAvailable.filter(p => {
        if (!p.tags || !Array.isArray(p.tags)) return false;
        const problemTags = p.tags.map((t: string) => t.toLowerCase().trim());
        return problemTags.some((t: string) => targetTags.includes(t));
    });

    // Tầng 2: Có Tags nhưng không khớp với 3 bài học gần nhất
    const tier2 = allAvailable.filter(p => {
        if (!p.tags || !Array.isArray(p.tags) || p.tags.length === 0) return false;
        // Không nằm trong Tầng 1
        return !tier1.find(t1 => t1.id === p.id);
    });

    // Tầng 3: Hoàn toàn không có Tags (các bài tập cũ hoặc chưa gán nhãn)
    const tier3 = allAvailable.filter(p => !p.tags || !Array.isArray(p.tags) || p.tags.length === 0);

    // Lựa chọn Pool theo thứ tự ưu tiên
    let pool: CodingProblem[] = [];
    let selectionTier = "";

    if (tier1.length > 0) {
        pool = tier1;
        selectionTier = "tier1";
    } else if (tier2.length > 0) {
        pool = tier2;
        selectionTier = "tier2";
    } else {
        pool = tier3;
        selectionTier = "tier3";
    }

    // Xáo trộn ngẫu nhiên trong Pool đã chọn
    const randomIndex = Math.floor(Math.random() * pool.length);
    console.log(`[SmartSelection] User: ${username}, TargetTags: ${targetTags.join(',')}, Selected from ${selectionTier} (Size: ${pool.length})`);
    
    return { problem: pool[randomIndex] as CodingProblem, status: 'ok' };
}

/**
 * Ghi lại điểm số bài tập của user.
 */
export async function recordProblemScore(username: string, problemId: string, score: number) {
    // 1. Lưu lịch sử bài làm (ngắn hạn)
    const { error } = await supabase
        .from('user_problem_history')
        .upsert({ 
            username, 
            problem_id: problemId, 
            score, 
            updated_at: new Date().toISOString() 
        }, { onConflict: 'username,problem_id' });
    
    if (error) {
        console.error("Error recording problem score:", error);
        return;
    }

    // 2. Logic cộng XP trực tiếp nếu đạt 100 điểm
    if (score === 100) {
        try {
            // Kiểm tra xem đã nhận thưởng cho bài tập này chưa
            const { data: alreadyRewardeded } = await supabaseAdmin
                .from('user_completed_problems')
                .select('username')
                .eq('username', username)
                .eq('problem_id', problemId)
                .maybeSingle();

            if (!alreadyRewardeded) {
                // Đánh dấu đã nhận thưởng
                const { error: awardError } = await supabaseAdmin
                    .from('user_completed_problems')
                    .insert({ username, problem_id: problemId });

                if (!awardError) {
                    // Cộng 20 XP vào bảng users (cộng thẳng)
                    const { data: user } = await supabaseAdmin
                        .from('users')
                        .select('coding_xp')
                        .eq('username', username)
                        .single();
                    
                    const newXp = (user?.coding_xp || 0) + 20;

                    await supabaseAdmin
                        .from('users')
                        .update({ coding_xp: newXp })
                        .eq('username', username);
                    
                    console.log(`[XP] Awarded 20 XP to ${username} for problem ${problemId}`);
                }
            }
        } catch (awardLevelError) {
            console.error("Lỗi khi xử lý cộng XP thưởng:", awardLevelError);
        }
    }
}

/**
 * Xóa lịch sử làm bài bài tập của user.
 */
export async function resetProblemHistory(username: string) {
    await supabase.from('user_problem_history').delete().eq('username', username);
}
