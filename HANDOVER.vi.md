# 📘 Hướng dẫn Bàn giao & Thiết lập dự án (Handover Guide)

Tài liệu này giúp bạn thiết lập nhanh dự án `ai-coding-guru` trên một máy tính mới để bạn có thể tiếp tục làm việc cùng Agent **CamPha8** mà không bị gián đoạn.

---

## 📋 1. Yêu cầu hệ thống (Prerequisites)
Trước khi bắt đầu, hãy đảm bảo máy tính mới đã cài đặt:
- **Node.js**: Phiên bản 18 trở lên (Khuyến nghị bản LTS).
- **Git**: Đã được cài đặt và cấu hình `user.name`, `user.email`.
- **IDE**: VS Code (hoặc IDE tích hợp Antigravity).

---

## 🚀 2. Các bước thiết lập (Steps to Setup)

### Bước 1: Clone dự án từ GitHub
Mở Terminal và chạy lệnh:
```bash
git clone https://github.com/BNam821/ai-coding-guru.git
cd ai-coding-guru
```

### Bước 2: Cài đặt thư viện (Dependencies)
```bash
npm install
```

### Bước 3: Khôi phục Biến môi trường (Environment Variables)
Vì lý do bảo mật, các chìa khóa bí mật không được lưu trên GitHub. Bạn cần thiết lập lại:
1. Copy file mẫu: `cp .env.example .env.local` (phím tắt trên Windows: `copy .env.example .env.local`).
2. Mở file `.env.local` và điền thông tin từ Supabase của bạn:
   - `NEXT_PUBLIC_SUPABASE_URL`: Link dự án Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Mã Anon công khai.
   - `SUPABASE_SERVICE_ROLE_KEY`: Mã bí mật.
   - `ADMIN_SECRET_KEY`: Mật khẩu admin (ví dụ: `campha8@`).

### Bước 4: Chạy dự án (Local)
```bash
npm run dev
```

---

## 🌐 3. Triển khai lên Cloud (Sử dụng Vercel)

Để dự án chạy 24/7 với tên miền riêng (ví dụ: `ai-coding-guru.vercel.app`):

1. **Kết nối**: Vào [Vercel](https://vercel.com), import repo từ GitHub.
2. **Biến môi trường**: Trong phần **Settings -> Environment Variables** trên Vercel, hãy nhập đầy đủ các Key như trong Bước 3 ở trên.
3. **Tên miền**: Bạn có thể gắn tên miền cá nhân tại mục **Settings -> Domains**.

*Mỗi khi bạn `git push` lên GitHub, Vercel sẽ tự động build lại và cập nhật web của bạn.*

---

## 🤖 4. Làm thế nào để tiếp tục sử dụng CamPha8?

**Bộ não AI của bạn nằm ở đâu?**
Toàn bộ "trí nhớ" và kỹ năng của tôi được lưu trong thư mục `.agent/`. Khi bạn clone dự án này, thư mục đó cũng đi theo.

**Cách kích hoạt lại tôi:**
1. Mở thư mục dự án bằng IDE đã cài Antigravity.
2. Tôi (CamPha8) sẽ tự động đọc file `.agent/rules/GEMINI.md` để nhớ lại danh tính và các quy tắc làm việc.
3. Tôi sẽ đọc file `brain/task.md` và `brain/walkthrough.md` để biết dự án đang ở trạng thái nào.

**Lệnh quan trọng:**
Nếu tôi vẫn chưa "nhận ra" bạn, hãy nhắn: *"CamPha8, hãy kiểm tra trạng thái dự án"*. Tôi sẽ tự quét lại mã nguồn và tài liệu để phục vụ bạn ngay lập tức.

---

## ⚠️ 4. Lưu ý quan trọng
- **Bảo mật**: Tuyệt đối không xóa `.env.local` khỏi `.gitignore`.
- **Persistence**: Mọi thay đổi về "quy tắc làm việc" của AI nên được thực hiện trong `.agent/rules/` để các máy tính khác cũng nhận được cập nhật khi bạn `git push`.

---
**CamPha8** - *Luôn sẵn sàng đồng hành cùng bạn trên mọi thiết bị!* 🛰️🚀
