-- Tạo bảng coding_problems
CREATE TABLE IF NOT EXISTS public.coding_problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,          -- Đề bài, hỗ trợ định dạng Markdown
    skeleton_code TEXT NOT NULL,        -- Code khung cho học viên bắt đầu
    solution_code TEXT NOT NULL,        -- Code giải chuẩn, dùng để AI đối chiếu
    expected_input TEXT,                -- Input mẫu để test
    expected_output TEXT NOT NULL,      -- Output mẫu mong đợi (để đối chiếu)
    language TEXT DEFAULT 'cpp',         -- Ngôn ngữ mặc định
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cấp quyền (Row Level Security - RLS)
-- Cho phép bất kì ai (authenticated & anon) ĐỌC đề bài
ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
ON public.coding_problems 
FOR SELECT 
USING (true);

-- Cho phép Admin (những người được uỷ quyền, vd có role nhất định hoặc từ service role) INSERT/UPDATE.
-- Ở cấu hình cơ bản, chúng ta sẽ quản lý insert qua màn hình Supabase Dashboard nên không cần policy write rườm rà.

-- Bỏ comment dòng dưới để tạo Data giả lập test ban đầu:
/*
INSERT INTO public.coding_problems (
  title, description, skeleton_code, solution_code, expected_input, expected_output, language
) VALUES (
  'Các phép toán cơ bản',
  'Bạn hãy viết chương trình hiển thị ra màn hình thông tin sau:
2468 + 1234 = {P1}
2468 - 1234 = {P2}
2468 * 1234 = {P3}
2468 / 1234 = {P4}

Trong đó: {P1} là tổng, {P2} là hiệu, {P3} là tích, {P4} là thương của 2468 và 1234.',
  '#include <iostream>

using namespace std;

int main() {
    ...
    return 0;
}',
  '#include <iostream>

using namespace std;

int main() {
    cout << "2468 + 1234 = " << 2468 + 1234 << endl;
    cout << "2468 - 1234 = " << 2468 - 1234 << endl;
    cout << "2468 * 1234 = " << 2468 * 1234 << endl;
    cout << "2468 / 1234 = " << 2468 / 1234;
    return 0;
}',
  '',
  '2468 + 1234 = 3702
2468 - 1234 = 1234
2468 * 1234 = 3045552
2468 / 1234 = 2',
  'cpp'
);
*/
