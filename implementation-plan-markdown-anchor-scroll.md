# Kế hoạch sửa cuộn tới mục lục Markdown

## Bối cảnh

Hiện tại liên kết mục lục trong Markdown đang dựa vào hành vi mặc định của thẻ `<a href="#...">`.

Hệ thống đã có:

- `id` cho heading trong `mode="full"`
- hỗ trợ `id` tường minh như `## Tiêu đề {#1}`
- `scroll-behavior: smooth` trong CSS global

Nhưng trang vẫn không tự cuộn ổn định khi bấm vào mục trong mục lục. Điều đó cho thấy chỉ dựa vào anchor mặc định là chưa đủ trong ngữ cảnh app hiện tại.

## Giả thuyết nguyên nhân

Các khả năng chính:

1. Trình duyệt đổi hash nhưng không thực hiện scroll vì DOM render lại hoặc hydration ở thời điểm click.
2. Hash link hoạt động không ổn định trong layout Next.js hiện tại do phần nội dung là SSR + hydrate.
3. Một số heading có `id` hợp lệ nhưng vị trí scroll bị lệch bởi navbar/sticky header.
4. Có trường hợp link mục lục được render đúng nhưng click không kích hoạt logic cuộn rõ ràng trên client.

## Phương án đề xuất

Không phụ thuộc vào scroll mặc định của browser nữa. Thay vào đó, xử lý chủ động trên client cho mọi anchor nội bộ trong Markdown.

### Phương án A: Intercept click ngay trong renderer Markdown

Thực hiện:

- Tạo một client component riêng, ví dụ `MarkdownAnchorLink`.
- Với các link có dạng `href="#..."`, thay vì render thẻ `<a>` thuần, render component này.
- Khi click:
  - `preventDefault()`
  - tìm phần tử bằng `document.getElementById(decodedHash)`
  - gọi `scrollIntoView({ behavior: "smooth", block: "start" })`
  - cập nhật URL bằng `window.history.replaceState(null, "", "#...")`

Ưu điểm:

- Chủ động, dễ kiểm soát
- Không phụ thuộc hành vi mặc định của browser
- Giải quyết trực tiếp yêu cầu "bấm mục lục thì cuộn xuống đúng nội dung"

Nhược điểm:

- Cần thêm một client component nhỏ vào pipeline render Markdown

### Phương án B: Hash scroll manager ở cấp container Markdown

Thực hiện:

- Tạo client wrapper như `MarkdownScrollManager`
- Bắt sự kiện click ở cấp container bằng event delegation
- Nếu phần tử click là link `#...`, tự scroll tới `id` tương ứng
- Đồng thời lắng nghe `hashchange` và xử lý khi người dùng mở trực tiếp URL có hash

Ưu điểm:

- Một nơi xử lý tập trung
- Bao quát được cả click và thay đổi hash từ nơi khác

Nhược điểm:

- Phức tạp hơn phương án A
- Dễ đụng thêm logic không liên quan nếu event delegation viết không chặt

### Phương án C: Scroll bằng offset thủ công thay vì `scrollIntoView`

Thực hiện:

- Khi tìm được target, tính:
  - `const y = target.getBoundingClientRect().top + window.scrollY - headerOffset`
- Gọi:
  - `window.scrollTo({ top: y, behavior: "smooth" })`

Ưu điểm:

- Kiểm soát chính xác khoảng cách với navbar/sticky header

Nhược điểm:

- Cần biết offset thực tế của header
- Phải hiệu chỉnh theo responsive nếu chiều cao navbar thay đổi

## Khuyến nghị

Nên triển khai theo thứ tự:

1. Phương án A
2. Nếu vẫn lệch vị trí do header, nâng cấp thêm Phương án C
3. Chỉ dùng Phương án B nếu muốn quản lý hash ở cấp toàn container

Lý do:

- A là thay đổi nhỏ nhất nhưng giải quyết đúng vấn đề lớn nhất
- C bổ sung cho độ chính xác vị trí
- B là phương án rộng hơn mức cần thiết ở thời điểm này

## Phạm vi thay đổi dự kiến

Các file khả năng sẽ phải sửa hoặc thêm:

- `src/components/markdown/markdown-components.tsx`
- `src/components/markdown/markdown-types.ts` nếu cần mở rộng options
- `src/components/markdown/markdown-renderer.tsx` nếu cần client wrapper
- file mới: `src/components/markdown/markdown-anchor-link.tsx`
- file mới tùy chọn: `src/components/markdown/markdown-scroll-manager.tsx`

## Tiêu chí nghiệm thu

1. Click vào `[Mục 1](#1)` sẽ cuộn tới heading `## ... {#1}`.
2. Click vào `[Giới thiệu](#gioi-thieu)` sẽ cuộn tới heading slug tự sinh tương ứng.
3. URL được cập nhật hash đúng sau khi click.
4. Không reload trang.
5. Không ảnh hưởng link ngoài và link nội bộ route như `/wiki/...`.
6. Vị trí scroll không bị che hoàn toàn bởi navbar.

## Checklist test thủ công

1. Vào trang bài wiki có mục lục Markdown.
2. Tạo 3 heading có `id` tường minh: `{#1}`, `{#2}`, `{#3}`.
3. Bấm từng mục trong danh sách mục lục.
4. Kiểm tra trang có cuộn đúng không.
5. Refresh trang với URL chứa hash như `/wiki/slug#2`.
6. Kiểm tra khi vào trực tiếp bằng URL hash, trang có nhảy đúng tới mục tương ứng không.
7. Kiểm tra với slug chữ thường kiểu `#cai-dat-moi-truong`.
8. Kiểm tra trên mobile khi có sticky navbar.

## Rủi ro cần lưu ý

- Nếu chỉ dùng `scrollIntoView`, vị trí có thể bị header che mất một phần.
- Nếu có nhiều heading trùng `id`, hành vi cuộn sẽ không ổn định.
- Nếu hash có ký tự đặc biệt, cần `decodeURIComponent` trước khi tìm `id`.

## Quyết định triển khai đề xuất

Triển khai một `MarkdownAnchorLink` client component để xử lý click anchor nội bộ, kèm fallback offset thủ công nếu test cho thấy `scrollIntoView` chưa đủ chính xác.
