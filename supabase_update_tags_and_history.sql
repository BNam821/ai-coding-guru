-- 1. Thêm cột tags cho bảng lessons
ALTER TABLE lessons ADD COLUMN tags TEXT[] DEFAULT '{}';

-- 2. Thêm cột tags cho bảng coding_problems
ALTER TABLE coding_problems ADD COLUMN tags TEXT[] DEFAULT '{}';

-- 3. Tạo bảng lịch sử hoàn thành bài tập của người dùng
CREATE TABLE user_problem_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index để truy vấn nhanh theo username và problem_id
CREATE INDEX idx_user_problem_history_username ON user_problem_history(username);
CREATE INDEX idx_user_problem_history_composite ON user_problem_history(username, problem_id);

-- Ghi chú cho Admin:
-- Tags sẽ được lưu dưới dạng mảng text, ví dụ: {'vong-lap', 'toan-hoc'}
