"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { BookOpen, GraduationCap, BrainCircuit, ArrowRight } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";

interface FeatureCardProps {
    title: string;
    icon: React.ReactNode;
    description: string;
    href: string;
    buttonText: string;
    accentColor: string;
}

function FeatureCard({ title, icon, description, href, buttonText, accentColor }: FeatureCardProps) {
    return (
        <GlassCard className="group flex h-full flex-col p-5 transition-all duration-500 hover:border-white/20 sm:p-8">
            {/* Icon */}
            <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 sm:mb-6 sm:h-16 sm:w-16 ${accentColor}`}>
                {icon}
            </div>

            {/* Title */}
            <h3 className="mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl">{title}</h3>

            {/* Description with Markdown */}
            <div className="prose prose-invert prose-sm mb-5 max-w-none flex-1 text-white/70 leading-relaxed sm:mb-6">
                <MarkdownRenderer content={description} mode="lite" />
            </div>

            {/* CTA Button */}
            <Link href={href}>
                <button className={`w-full py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${accentColor} hover:opacity-90 group-hover:shadow-lg`}>
                    {buttonText}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </Link>
        </GlassCard>
    );
}

const features = [
    {
        title: "Blog Kiến thức",
        icon: <BookOpen size={28} className="text-black" />,
        description: `Thư viện bài viết **chất lượng cao** về lập trình:

- Hướng dẫn từ cơ bản đến nâng cao
- Mẹo & thủ thuật từ chuyên gia
- Cập nhật công nghệ mới nhất
- **Miễn phí** hoàn toàn!`,
        href: "/wiki",
        buttonText: "Khám phá Blog",
        accentColor: "bg-accent-secondary text-black"
    },
    {
        title: "Bài học",
        icon: <GraduationCap size={28} className="text-black" />,
        description: `Học lập trình **có hệ thống** với lộ trình rõ ràng:

- Bài giảng chi tiết & văn bản
- Bài tập thực hành
- Học theo phong cách riêng
- Theo dõi tiến độ`,
        href: "/learn",
        buttonText: "Bắt đầu học",
        accentColor: "bg-accent-primary text-black"
    },
    {
        title: "Kiểm tra cùng AI",
        icon: <BrainCircuit size={28} className="text-black" />,
        description: `Đánh giá năng lực với **AI thông minh**:

- Đề thi tự động sinh
- Chấm điểm & phản hồi tức thì
- Gợi ý cải thiện cá nhân hóa
- Mô phỏng phỏng vấn thực tế`,
        href: "/test",
        buttonText: "Làm bài kiểm tra",
        accentColor: "bg-purple-500 text-white"
    }
];

export function FeaturesSection() {
    return (
        <section id="features" className="relative z-10 px-4 py-16 sm:py-20">
            <div className="container mx-auto max-w-6xl">
                {/* Section Title - Left aligned */}
                <div className="mb-10 sm:mb-12">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                        <span className="text-accent-secondary">AI Coding Guru</span> có gì?
                    </h2>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid gap-4 sm:gap-8 md:grid-cols-3">
                    {features.map((feature) => (
                        <FeatureCard
                            key={feature.title}
                            title={feature.title}
                            icon={feature.icon}
                            description={feature.description}
                            href={feature.href}
                            buttonText={feature.buttonText}
                            accentColor={feature.accentColor}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
