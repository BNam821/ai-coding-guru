import { GlassCard } from "../ui/glass-card";
import { Terminal, Lightbulb, BookOpen, Trophy } from "lucide-react";

const features = [
    {
        icon: <Terminal className="w-8 h-8 text-accent-secondary" />,
        title: "Smart Debugger",
        desc: "AI phân tích lỗi logic, giải thích nguyên nhân và gợi ý cách sửa thay vì chỉ hiển thị stack trace.",
    },
    {
        icon: <Lightbulb className="w-8 h-8 text-accent-primary" />,
        title: "Code Optimizer",
        desc: "Học cách viết Clean Code ngay từ đầu với các gợi ý tối ưu hóa hiệu suất và độ dễ đọc.",
    },
    {
        icon: <BookOpen className="w-8 h-8 text-blue-400" />,
        title: "Learning Path",
        desc: "Lộ trình bài bản từ Zero đến Hero. Mỗi bài học đều có bài tập thực hành và dự án thực tế.",
    },
    {
        icon: <Trophy className="w-8 h-8 text-purple-400" />,
        title: "AI Quiz & Judge",
        desc: "Hệ thống bài tập trắc nghiệm sinh động và Online Judge chấm code tự động theo thời gian thực.",
    },
];

export function FeatureGrid() {
    return (
        <section className="py-24 relative z-10">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl font-bold font-heading">
                        Tại sao chọn <span className="text-accent-secondary">AI Coding Guru</span>?
                    </h2>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Chúng tôi kết hợp giáo trình chuẩn quốc tế với sức mạnh của AI để tạo ra trải nghiệm học tập đột phá.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => (
                        <GlassCard key={idx} className="h-full flex flex-col gap-4 group">
                            <div className="p-3 w-fit rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-starlight group-hover:text-accent-secondary transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </section>
    );
}
