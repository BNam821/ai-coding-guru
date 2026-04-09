import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Coding Guru | THPT Cẩm Phả",
  description: "Sản phẩm dự thi AI Young Guru - Nhóm Cẩm Phả 8, trường THPT Cẩm Phả.",
};

import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { RouteBackground } from "@/components/ui/route-background";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className="overflow-x-clip antialiased bg-deep-space text-starlight selection:bg-accent-primary selection:text-deep-space"
      >
        <div className="relative flex min-h-screen flex-col overflow-x-clip">
          <RouteBackground />
          <Navbar />
          <main className="flex-1 pb-24 sm:pb-0">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
