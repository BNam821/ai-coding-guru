"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { BookOpen, GraduationCap, BrainCircuit, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
        <GlassCard className="p-8 h-full flex flex-col group hover:border-white/20 transition-all duration-500">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${accentColor} transition-transform duration-500 group-hover:scale-110`}>
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>

            {/* Description with Markdown */}
            <div className="prose prose-invert prose-sm max-w-none flex-1 mb-6 text-white/70 leading-relaxed">
                <ReactMarkdown>{description}</ReactMarkdown>
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

- Bài giảng video & văn bản
- Bài tập thực hành
- Chứng nhận hoàn thành
- Theo dõi tiến độ`,
        href: "/lessons",
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
        href: "/tests",
        buttonText: "Làm bài kiểm tra",
        accentColor: "bg-purple-500 text-white"
    }
];

export function FeaturesSection() {
    return (
        <section className="py-20 px-4 relative z-10">
            <div className="container mx-auto max-w-6xl">
                {/* Section Title - Left aligned */}
                <div className="mb-12">
                    <h2 className="text-4xl font-bold text-white">
                        <span className="text-accent-secondary">AI Coding Guru</span> có gì?
                    </h2>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid md:grid-cols-3 gap-8">
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
