# Hướng Dẫn Quản Trị Đề Bài Code bằng Supabase (Dành cho Admin)

Tài liệu này hướng dẫn bạn cách đưa dữ liệu đề bài code lên hệ thống thông qua giao diện của Supabase, để AI có thể tự động chọn bài.

## Bước 1: Khởi tạo dữ liệu trên Supabase

1. Truy cập vào Dashboard dự án của bạn trên [Supabase](https://supabase.com/dashboard).
2. Tìm đến mục **SQL Editor** ở thanh điều hướng bên trái menu.
3. Tạo mộ Query mới (New query), copy toàn bộ mã SQL trong file `supabase_init_coding_problems.sql` đã được tạo tải lên và nhấn **RUN**.
4. Hành động này sẽ tạo bảng `coding_problems` và thiết lập quyền tự động để học viên (trên web) có quyền đọc và làm bài.

## Bước 2: Nhập Nội dung Câu Hỏi (Thêm mới đề bài)

Có 2 cách để thêm đề bài:

### Cách A: Dùng Table Editor (Thủ công / Dễ nhìn nhất)
1. Trong Supabase Dashboard, ấn vào trình đơn **Table Editor**.
2. Chọn bảng `coding_problems`.
3. Bấm vào nút `Insert row` ở góc trên bên phải màn hình.
4. Một thẻ mới hiện ra. Bạn hãy điền các thông tin sau:
   - `id`: Giữ nguyên `<default>` để nó tự sinh ID.
   - `title`: Tên chuyên đề/ bài tập ngắn gọn (vd: *Tính tổng hai số*).
   - `description`: Nhập nội dung câu hỏi dưới dạng ngôn ngữ Markdown (dùng `#` để làm tiêu đề, `*` để in nghiêng, vv.).
   - `skeleton_code`: Code khung mẫu bạn muốn điền sẵn vào màn hình học sinh khi làm bài. (Nên chèn `...` để ra hiệu cho học sinh viết tiếp).
   - `solution_code`: Code chính xác 100% để làm chuẩn cho AI chấm bài. (Chỉ mình AI & Admin biết).
   - `expected_input`: Giá trị đầu vào chuẩn để chạy thử đề bài này (vd: `5 10`). Nếu không cần Input thì bỏ trống.
   - `expected_output`: Kết quả đầu ra của phép tính (vd: `15`). Được dùng để tham chiếu độ chính xác.
   - `language`: Mã ngôn ngữ (Ví dụ: `cpp`, `python`, `javascript`).

### Cách B: Bổ sung qua SQL Insert (Khi muốn chèn nhiều dòng)
Bạn có thể dùng SQL Query và copy cú pháp `INSERT INTO ...` nằm trong file `supabase_init_coding_problems.sql` và thay đổi các chuỗi dữ liệu bên trong theo ý thích.

## Bước 3: Hoạt động của AI

Ngay khi bạn thêm mới (Insert) thành công 1 đề vào bảng `coding_problems`. Màn hình Website tại link `/test/code` sẽ tự động liên kết nối tới đó ngay lập tức, ngẫu nhiên chọn một đề trong bảng gửi tới cho học sinh làm.

Như vậy bạn đã hoàn thành việc Cập Nhật!
