import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Coding Guru | THPT Cẩm Phả",
  description: "Trải nghiệm học lập trình cùng AI với phong cách Dark Space Futuristic.",
};

import { Navbar } from "@/components/ui/navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-deep-space text-starlight selection:bg-accent-primary selection:text-deep-space`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
