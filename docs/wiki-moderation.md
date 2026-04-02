# Wiki Moderation Setup

## 1. Tạo schema trên Supabase
Chạy file [`docs/wiki-moderation.sql`](./wiki-moderation.sql) trong Supabase SQL Editor.

Schema này sẽ:
- Thêm cột `author_role` vào `wiki_posts` để phân biệt bài của `ADMIN` và `MEMBER`.
- Tạo bảng `wiki_submissions` để lưu bài viết chờ duyệt.
- Tạo trigger `updated_at` cho submission.

## 2. Workflow sau khi bật moderation
- `ADMIN` tạo bài viết mới: bài được lưu trực tiếp vào `wiki_posts` và hiển thị ngay trên `/wiki`.
- `MEMBER` tạo bài viết mới: bài được lưu vào `wiki_submissions` với trạng thái `pending`.
- Đội dự án có thể xem bài chờ duyệt theo 2 cách:
  - Trong Supabase Dashboard, mở bảng `public.wiki_submissions`.
  - Trong ứng dụng, mở trang `/wiki/review` bằng tài khoản `ADMIN`.
- Khi `ADMIN` duyệt bài:
  - Submission được chuyển sang `wiki_posts`.
  - Bài viết bắt đầu xuất hiện công khai trên `/wiki`.
- Khi `ADMIN` từ chối bài:
  - Submission được giữ lại trong `wiki_submissions` với trạng thái `rejected`.
  - Có thể lưu `review_notes` để ghi chú lý do.

## 3. Các endpoint liên quan
- `POST /api/wiki`
  - `ADMIN`: publish trực tiếp
  - `MEMBER`: tạo submission chờ duyệt
- `GET /api/wiki/submissions`
  - Chỉ `ADMIN`, dùng để tải danh sách bài chờ duyệt
- `PATCH /api/wiki/submissions`
  - Chỉ `ADMIN`, dùng để approve hoặc reject submission

## 4. Ghi chú
- Trang `/wiki` chỉ hiển thị các bài đã nằm trong `wiki_posts`.
- Badge `ADMIN`/`MEMBER` trên giao diện đọc dữ liệu từ `author_role`.
- Nếu chưa chạy SQL migration, luồng moderation sẽ không hoạt động vì Supabase chưa có bảng/cột cần thiết.

