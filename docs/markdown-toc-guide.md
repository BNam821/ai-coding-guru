# Hướng dẫn viết mục lục Markdown

Dự án hiện tại hỗ trợ viết mục lục Markdown thủ công theo kiểu GitHub ở những nơi dùng `MarkdownRenderer` với `mode="full"`.

## Cách hoạt động

- Mỗi heading Markdown như `#`, `##`, `###` sẽ được tự tạo `id`.
- Link nội bộ dạng `#ten-muc` sẽ trỏ tới đúng heading tương ứng.
- Heading cũng có nút anchor để copy link trực tiếp tới từng phần.

Trong mã nguồn, phần này được bật bởi:

- `rehype-slug`
- `rehype-autolink-headings`

File liên quan:

- `src/components/markdown/markdown-renderer.tsx`
- `src/components/markdown/markdown-components.tsx`

## Cách viết mục lục

Ví dụ:

```md
# Hướng dẫn React cơ bản

## Mục lục

- [Giới thiệu](#gioi-thieu)
- [Cài đặt môi trường](#cai-dat-moi-truong)
- [Tạo component đầu tiên](#tao-component-dau-tien)
- [Kết luận](#ket-luan)

## Giới thiệu

Nội dung mở đầu.

## Cài đặt môi trường

Nội dung cài đặt.

## Tạo component đầu tiên

Nội dung component.

## Kết luận

Nội dung kết luận.
```

## Quy tắc đặt link mục lục

Slug heading nên viết theo dạng chữ thường và nối bằng dấu `-`.

Ví dụ:

- `## Giới thiệu` -> `#gioi-thieu`
- `## Cài đặt môi trường` -> `#cai-dat-moi-truong`
- `## Bài 1: React là gì?` -> `#bai-1-react-la-gi`

## Cách đặt id tường minh cho mục lục

Nếu bạn muốn dùng các link ngắn, cố định như `#1`, `#2`, hãy đặt `id` trực tiếp ở cuối heading:

```md
## Giới thiệu {#1}
## Cài đặt môi trường {#2}
## Ví dụ đầu tiên {#3}
```

Khi đó bạn có thể viết mục lục như sau:

```md
## Mục lục

1. [Giới thiệu](#1)
2. [Cài đặt môi trường](#2)
3. [Ví dụ đầu tiên](#3)
```

Lưu ý:

- Phần `{#1}` sẽ không hiển thị ra giao diện, nó chỉ dùng để gán `id` cho heading.
- Nếu có đặt `id` tường minh, hệ thống sẽ ưu tiên `id` đó thay vì slug tự sinh.
- Nên dùng `id` duy nhất trong một bài viết.

## Mẫu nên dùng

```md
## Mục lục

1. [Phần 1](#phan-1)
2. [Phần 2](#phan-2)
3. [Phần 3](#phan-3)
```

Hoặc:

```md
## Mục lục

- [Phần 1](#phan-1)
- [Phần 2](#phan-2)
- [Phần 3](#phan-3)
```

## Lưu ý

- Đây là mục lục thủ công, không còn mục lục tự sinh tự động ở đầu bài.
- Nếu đổi tên heading, hãy cập nhật lại link trong mục lục.
- Tính năng này chỉ hoạt động ổn định ở nơi render Markdown với `mode="full"`.
- Nếu muốn an toàn, hãy dùng heading ngắn gọn, tránh ký tự quá phức tạp.

## Mẫu đầy đủ

```md
# JavaScript Cơ Bản

## Mục lục

- [Biến và hằng](#bien-va-hang)
- [Kiểu dữ liệu](#kieu-du-lieu)
- [Hàm](#ham)
- [Mảng](#mang)

## Biến và hằng

Nội dung.

## Kiểu dữ liệu

Nội dung.

## Hàm

Nội dung.

## Mảng

Nội dung.
```
