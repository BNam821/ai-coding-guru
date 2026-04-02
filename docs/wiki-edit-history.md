# Wiki Edit History

Chạy file [`docs/wiki-edit-history.sql`](./wiki-edit-history.sql) trong Supabase SQL Editor trước khi deploy phần giao diện và API.

Migration này tạo bảng `wiki_post_edit_history` để lưu:

- thời gian chỉnh sửa
- người chỉnh sửa
- tên hiển thị của người chỉnh sửa
- lí do chỉnh sửa

Ứng dụng dùng bảng này để render nút `Lịch sử chỉnh sửa` và bảng lịch sử bên dưới phần tác giả ở trang `/wiki/[slug]`.
