import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Coding Guru | THPT Cẩm Phả",
  description: "Sản phẩm dự thi AI Young Guru - Nhóm Cẩm Phả 8, trường THPT Cẩm Phả.",
};

import { Navbar } from "@/components/ui/navbar";
import { AnnouncementWidget } from "@/components/ui/announcement-widget";
import { Footer } from "@/components/ui/footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className="antialiased bg-deep-space text-starlight selection:bg-accent-primary selection:text-deep-space"
      >
        <div className="min-h-screen flex flex-col relative">
          <Navbar />
          <main className="flex-1 pb-24 sm:pb-0">
            {children}
          </main>
          <AnnouncementWidget />
          <Footer />
        </div>
      </body>
    </html>
  );
}
