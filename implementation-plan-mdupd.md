# Markdown Upgrade Implementation Plan

## Mục tiêu

Nâng cấp hệ thống Markdown của `ai-coding-guru` từ mức cơ bản hiện tại lên một pipeline thống nhất, an toàn, và đủ mạnh cho:

- bài học lập trình
- blog/wiki kỹ thuật
- công thức toán học
- code block nâng cao
- tài liệu dài có mục lục, footnote, callout
- nội dung do người dùng tạo nhưng vẫn kiểm soát được bảo mật

## Hiện trạng

Repo hiện đang render Markdown rải rác ở nhiều nơi, chủ yếu dùng:

- `react-markdown`
- `remark-gfm`
- `rehype-highlight`

Các điểm render chính:

- `src/app/wiki/[slug]/page.tsx`
- `src/app/learn/[course]/[lesson]/page.tsx`
- `src/components/quiz/quiz-game.tsx`
- `src/components/landing/features-section.tsx`

Các điểm nhập nội dung Markdown:

- `src/app/wiki/create/page.tsx`
- `src/app/wiki/[slug]/edit/page.tsx`

Các hạn chế hiện tại:

- chưa hỗ trợ math
- chưa có renderer dùng chung
- chưa có sanitize pipeline rõ ràng
- chưa có heading slug/anchor
- chưa có TOC
- chưa có callout/admonition chuẩn
- code block mới dừng ở highlight cơ bản
- guide Markdown chưa phản ánh các tính năng mở rộng

## Nguyên tắc triển khai

1. Gom toàn bộ cấu hình render về một chỗ.
2. Ưu tiên an toàn trước khi bật tính năng mạnh như raw HTML.
3. Triển khai theo pha nhỏ để giảm rủi ro hồi quy.
4. Tính năng mới phải đi kèm cập nhật guide và dữ liệu test mẫu.

## Deliverables

Sau khi hoàn tất, hệ thống nên có:

- `MarkdownRenderer` dùng chung
- hỗ trợ math inline và block
- heading có slug và anchor
- sanitize schema cho nội dung user-generated
- hỗ trợ tốt GFM và footnote
- callout/admonition chuẩn
- code block có UX tốt hơn
- tùy chọn TOC cho bài dài
- guide Markdown cập nhật
- bộ nội dung test Markdown mẫu

## Packages đề xuất

### Bắt buộc

- `remark-math`
- `rehype-katex`
- `rehype-slug`
- `rehype-autolink-headings`
- `rehype-sanitize`
- `katex`

### Nâng cao

- `remark-directive`
- `rehype-raw`
- `mermaid`

## Kiến trúc đề xuất

### 1. Renderer dùng chung

Tạo các file mới:

- `src/components/markdown/markdown-renderer.tsx`
- `src/components/markdown/markdown-components.tsx`
- `src/components/markdown/markdown-sanitize-schema.ts`
- `src/components/markdown/markdown-types.ts`

Mục đích:

- gom toàn bộ plugin `remark` và `rehype`
- gom custom renderers như `img`, `code`, `a`, `table`, `blockquote`
- cho phép bật/tắt tính năng theo mode

### 2. Render mode

Đề xuất 3 mode:

- `lite`: cho text ngắn như feature card
- `safe`: cho nội dung do người dùng tạo
- `full`: cho bài học/wiki có đầy đủ tính năng kỹ thuật

Ví dụ:

- `landing` dùng `lite`
- `quiz` dùng `safe` hoặc `full` tùy mức tính năng cho explanation
- `wiki` dùng `full`
- `learn` dùng `full`

## Phạm vi file cần sửa

### Render

- `src/app/wiki/[slug]/page.tsx`
- `src/app/learn/[course]/[lesson]/page.tsx`
- `src/components/quiz/quiz-game.tsx`
- `src/components/landing/features-section.tsx`

### Style

- `src/app/globals.css`

### Authoring / Guide

- `src/app/wiki/create/page.tsx`
- `src/app/wiki/[slug]/edit/page.tsx`
- `src/app/wiki/markdown-guide/page.tsx`

### Dữ liệu test / tài liệu

- `docs/markdown-upgrade-implementation-plan.md`
- `docs/markdown-test-content.md` hoặc file tương đương

## Kế hoạch theo pha

## Pha 1: Chuẩn hóa renderer

### Mục tiêu

Tạo một nền tảng thống nhất để mọi trang dùng chung cùng một pipeline Markdown.

### Công việc

1. Tạo `MarkdownRenderer` mới.
2. Tạo mapping component cho:
   - `img`
   - `a`
   - `code`
   - `pre`
   - `table`
   - `blockquote`
   - `p`
   - `h1`-`h6`
3. Chuyển `wiki`, `learn`, `quiz`, `landing` sang renderer dùng chung.
4. Giữ nguyên behavior cũ trước khi thêm tính năng mới.

### Kết quả mong đợi

- loại bỏ cấu hình Markdown trùng lặp
- dễ kiểm soát hồi quy
- tạo nền để thêm plugin mới

## Pha 2: Bổ sung tính năng cốt lõi

### Mục tiêu

Giải quyết các thiếu hụt lớn nhất: math, anchor heading, sanitize.

### Công việc

1. Thêm `remark-math`.
2. Thêm `rehype-katex`.
3. Import CSS `katex`.
4. Thêm `rehype-slug`.
5. Thêm `rehype-autolink-headings`.
6. Thêm `rehype-sanitize` với schema tùy chỉnh.
7. Cập nhật CSS cho:
   - math inline
   - math block
   - heading anchor
   - table
   - checklist
   - horizontal rule

### Kết quả mong đợi

- hỗ trợ công thức toán học đầy đủ
- heading có thể deep-link
- nội dung user-generated an toàn hơn

## Pha 3: Nâng cấp trải nghiệm tài liệu kỹ thuật

### Mục tiêu

Làm cho Markdown phù hợp với blog lập trình và giáo trình.

### Công việc

1. Thêm callout/admonition bằng `remark-directive`.
2. Chuẩn hóa các block:
   - `info`
   - `tip`
   - `warning`
   - `danger`
   - `success`
3. Thêm footnote nếu behavior hiện tại chưa đủ tốt.
4. Nâng code block:
   - copy button
   - nhãn ngôn ngữ
   - line highlight nếu cần
   - line number nếu cần
5. Thiết kế TOC cho bài dài.

### Kết quả mong đợi

- tài liệu kỹ thuật dễ đọc hơn
- thay thế dần cú pháp custom `//...//`

## Pha 4: Tính năng nâng cao

### Mục tiêu

Hỗ trợ các nhu cầu mở rộng nhưng vẫn kiểm soát rủi ro.

### Công việc

1. Cân nhắc bật raw HTML bằng `rehype-raw`.
2. Nếu bật, chỉ cho phép khi đi cùng sanitize schema chặt chẽ.
3. Whitelist các tag hữu ích:
   - `sup`
   - `sub`
   - `details`
   - `summary`
   - `kbd`
   - `mark`
4. Cân nhắc hỗ trợ Mermaid.
5. Cân nhắc media/embed whitelist.

### Kết quả mong đợi

- hỗ trợ tốt hơn cho tài liệu nâng cao
- không mở quá rộng bề mặt tấn công

## Pha 5: Nâng cấp authoring experience

### Mục tiêu

Người viết phải biết cách dùng các tính năng mới, không chỉ renderer hiểu.

### Công việc

1. Cập nhật trang guide Markdown.
2. Thêm ví dụ cho:
   - math inline
   - math block
   - table
   - footnote
   - callout
   - code block
3. Cập nhật placeholder/help text ở form tạo và sửa bài.
4. Tùy mức effort, thêm preview:
   - live preview
   - preview pane
   - preview modal

### Kết quả mong đợi

- tác giả soạn đúng cú pháp
- giảm lỗi hiển thị do viết sai

## Pha 6: Kiểm thử và hồi quy

### Mục tiêu

Đảm bảo nâng cấp không phá nội dung cũ và không mở lỗ hổng bảo mật.

### Công việc

1. Tạo file test Markdown mẫu.
2. Bao phủ các case:
   - heading
   - nested list
   - table
   - task list
   - image
   - link
   - inline code
   - fenced code block
   - footnote
   - math inline
   - math block
   - callout
   - raw HTML hợp lệ
   - raw HTML bị chặn
3. Kiểm tra trên:
   - wiki detail
   - lesson detail
   - quiz explanation
   - landing text
4. Kiểm tra mobile:
   - công thức dài
   - bảng rộng
   - code block dài
5. Kiểm tra bảo mật:
   - script injection
   - event handler HTML
   - unsafe URL

## Thứ tự triển khai khuyến nghị

1. Tạo `MarkdownRenderer` và chuyển các nơi render sang dùng chung.
2. Thêm `math + slug + anchor + sanitize + CSS`.
3. Cập nhật `wiki` và `learn` trước, rồi đến `quiz`, rồi `landing`.
4. Thêm callout, footnote, code block nâng cao, TOC.
5. Cập nhật guide và form authoring.
6. Bổ sung raw HTML có kiểm soát và Mermaid nếu vẫn cần.
7. Chạy kiểm thử hồi quy với dữ liệu mẫu.

## Rủi ro chính

### 1. XSS khi bật HTML

Nếu dùng `rehype-raw` mà không có sanitize schema chặt, nội dung user-generated có thể chèn HTML nguy hiểm.

### 2. Vỡ layout trên mobile

Math block, table, code block dài rất dễ làm vỡ layout nếu không có overflow handling.

### 3. Hồi quy nội dung cũ

Custom behavior hiện tại như block `//...//` có thể xung đột với parser mới nếu không xác định rõ chiến lược giữ hay thay thế.

### 4. Tăng độ phức tạp của renderer

Nếu dồn quá nhiều behavior vào một file, sau này sẽ khó bảo trì. Cần tách schema, components, mode config riêng.

## Quyết định cần chốt trước khi code

1. Có giữ cú pháp custom `//...//` nữa không, hay thay bằng callout chuẩn?
2. Có cho phép raw HTML không?
3. Có cần Mermaid ngay trong đợt 1 không?
4. Có làm preview editor ngay không, hay để sau?
5. `quiz` có cần full Markdown feature hay chỉ math + code + image là đủ?

## Definition of Done

Được xem là hoàn tất khi:

- tất cả điểm render Markdown dùng chung một renderer
- `wiki` và `learn` hiển thị được math
- heading có slug và anchor
- có sanitize rõ ràng cho nội dung user-generated
- guide Markdown có ví dụ cho các cú pháp mới
- có file test Markdown mẫu
- kiểm thử không thấy hồi quy lớn ở nội dung cũ

## Đề xuất chia commit

1. `refactor(markdown): add shared markdown renderer`
2. `feat(markdown): add math, heading anchors, sanitize`
3. `feat(markdown): add callouts and improve code blocks`
4. `docs(markdown): update guide and add markdown test content`
5. `feat(editor): improve authoring help and preview`

## Ghi chú cuối

Nếu cần triển khai nhanh, nên chốt phạm vi đợt 1 như sau:

- shared renderer
- math
- slug + anchor
- sanitize
- CSS prose chuẩn
- guide cập nhật

Đây là nhóm nâng cấp có tác động lớn nhất, rủi ro thấp nhất, và giải quyết ngay vấn đề toán học đang thiếu.
