# Phân tích cơ chế chọn bài tại `/test/code` theo lịch sử học

## 1) Tổng quan nhanh

Luồng chọn bài ở `/test/code` đang chạy theo mô hình:

1. Lấy **3 bài học gần nhất** của user từ `user_learning_history`.
2. Lấy `tags` của các bài học đó để tạo `targetTags`.
3. Loại các bài code user đã từng đạt **100 điểm** trong `user_problem_history`.
4. Chia bài còn lại thành 3 tầng ưu tiên:
   - `tier1`: tags khớp `targetTags`.
   - `tier2`: có tags nhưng không khớp.
   - `tier3`: không có tags.
5. Chọn ngẫu nhiên trong tầng ưu tiên cao nhất còn dữ liệu.

## 2) Các file chính tham gia

- `src/app/test/code/page.tsx`
- `src/app/api/test/smart-problem/route.ts`
- `src/lib/coding-problems-service.ts`
- `src/app/api/code-evaluate/route.ts`
- `src/components/history/history-tracker.tsx`
- `src/app/api/learn/track/route.ts`
- `src/app/learn/[course]/[lesson]/page.tsx`

## 3) Luồng dữ liệu đầu vào từ lịch sử học

### 3.1 Lịch sử học được ghi vào đâu?

- Khi user mở trang lesson, `HistoryTracker` được mount tại `src/app/learn/[course]/[lesson]/page.tsx`.
- `HistoryTracker` gọi `POST /api/learn/track` để ghi lesson vào bảng `user_learning_history`.
- API track dùng `upsert` theo `onConflict: 'username,lesson_id'` và cập nhật `updated_at` mới nhất.

Điều này đảm bảo bảng `user_learning_history` luôn có dữ liệu “vừa học gần đây” để thuật toán chọn bài code sử dụng.

### 3.2 Tags đến từ đâu?

- `lessons.tags` là tags của bài học.
- `coding_problems.tags` là tags của bài code (do admin chọn khi tạo/sửa bài).
- Thuật toán sẽ match 2 nhóm tags này với nhau.

## 4) Luồng chọn bài tại `/test/code`

### 4.1 Ở phía client (`/test/code`)

Trong `src/app/test/code/page.tsx`:

- Nếu URL có `?id=...`:
  - Gọi `getCodingProblemById(id)` và mở đúng bài đó.
  - Không đi qua logic chọn thông minh theo lịch sử.
- Nếu không có `id`:
  - Gọi `GET /api/test/smart-problem` (no-store) để lấy bài theo lịch sử.
- Nếu API trả `status = exhausted`:
  - Hiện màn hình “đã làm hết bài”.
  - Nút “BẮT ĐẦU LẠI TỪ ĐẦU” cho phép gọi lại luồng chọn bài.

### 4.2 Ở API `/api/test/smart-problem`

Trong `src/app/api/test/smart-problem/route.ts`:

- Bắt buộc có session (`getSession()`), nếu không có thì trả `401`.
- Gọi `getSmartCodingProblem(username)`.
- Nếu nhận `status = exhausted`:
  - Gọi `resetProblemHistory(username)` để xóa toàn bộ lịch sử làm bài code của user.
  - Trả message “đã làm hết bài”.
- Nếu còn bài: trả `{ status: 'ok', problem }`.

## 5) Thuật toán `getSmartCodingProblem` (chi tiết)

Trong `src/lib/coding-problems-service.ts`:

### Bước 1: Lấy 3 lesson gần nhất

- Query `user_learning_history` theo `username`.
- Sort `updated_at DESC`.
- `limit(3)`.
- Lấy mảng `lesson_id`.

### Bước 2: Tạo `targetTags`

- Query bảng `lessons` với các `lesson_id` vừa lấy.
- Lấy `tags`.
- Chuẩn hóa tags: `toLowerCase().trim()`.
- Khử trùng lặp bằng `Set`.

Kết quả là `targetTags` đại diện cho chủ đề user vừa học gần đây.

### Bước 3: Loại bài đã hoàn thành 100 điểm

- Query `user_problem_history` theo:
  - `username = current user`
  - `score = 100`
- Lấy danh sách `completedIds`.

### Bước 4: Lấy tập bài còn khả dụng

- Query `coding_problems`.
- Nếu có `completedIds`, thêm điều kiện loại trừ `id in completedIds`.
- Nếu không còn bài nào sau loại trừ: trả `status = exhausted`.

### Bước 5: Chia tầng ưu tiên

- `tier1`: bài có tags và có ít nhất 1 tag giao với `targetTags`.
- `tier2`: bài có tags nhưng không thuộc `tier1`.
- `tier3`: bài không có tags.

### Bước 6: Chọn pool và random

- Ưu tiên pool theo thứ tự: `tier1` -> `tier2` -> `tier3`.
- Random 1 bài trong pool được chọn.
- Trả về `{ problem, status: 'ok' }`.

## 6) Vòng lặp cập nhật lịch sử sau khi nộp bài

Trong `src/app/api/code-evaluate/route.ts`:

- Sau khi AI trả JSON chấm điểm, hệ thống gọi:
  - `recordProblemScore(session.username, problemObj.id, parsedData.score || 0)`.
- `recordProblemScore` dùng `upsert` vào `user_problem_history` theo `onConflict: 'username, problem_id'`.
- Vì vậy điểm mới nhất của bài sẽ ghi đè điểm cũ.

Tác động:

- Chỉ các bài đang có `score = 100` mới bị loại khỏi vòng chọn tiếp theo.
- Nếu một bài từng 100 nhưng lần sau bị ghi đè thành <100, bài đó có thể quay lại pool.

## 7) Các tình huống thực tế

### Case A: User có lịch sử học rõ ràng

- Có 3 lesson gần nhất với tags.
- Hệ thống ưu tiên rất mạnh vào `tier1` (match tags).

### Case B: User chưa có lịch sử học

- `targetTags` rỗng.
- `tier1` gần như rỗng.
- Hệ thống rơi xuống `tier2` (các bài có tags) rồi mới đến `tier3`.

### Case C: User đã đạt 100 tất cả bài

- Không còn bài sau bước loại trừ.
- API trả `exhausted` và xóa `user_problem_history` của user.
- Lần bắt đầu lại tiếp theo sẽ làm từ đầu.

### Case D: URL có `?id=...`

- Bỏ qua hoàn toàn smart-selection theo lịch sử.
- Dùng để mở đúng 1 bài cụ thể từ trang quản trị.

## 8) Kết luận ngắn

Cơ chế hiện tại là một chiến lược “tag-based + completion-based”:

- `tag-based`: dùng 3 lesson gần nhất để suy ra chủ đề ưu tiên.
- `completion-based`: chặn các bài đã đạt 100.
- `tier fallback`: luôn có đường lui nếu thiếu dữ liệu khớp tag.

Nó không dùng độ khó, thời gian làm bài, số lần sai, hay độ tiến bộ (`progress_percent`) để chấm mức ưu tiên chọn đề tại thời điểm này.
