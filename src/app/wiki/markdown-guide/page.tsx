import { ArrowLeft, Sparkles, Code, Image as ImageIcon, Type, List, Quote } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";

export default function MarkdownGuidePage() {
    const sections = [
        {
            title: "Quy tắc Độc quyền (AI Guru Features)",
            icon: <Sparkles className="text-yellow-400" />,
            items: [
                {
                    label: "Phần Mẹo (Tips)",
                    description: "Hiển thị một khung highlight nổi bật để cung cấp lời khuyên hoặc mẹo nhanh.",
                    syntax: "//Nội dung mẹo của bạn ở đây//",
                    note: "Lưu ý: Viết trên một dòng riêng biệt để kích hoạt giao diện Mẹo."
                }
            ]
        },
        {
            title: "Quy tắc Cơ bản",
            icon: <Type className="text-blue-400" />,
            items: [
                { label: "Tiêu đề", syntax: "# H1\n## H2\n### H3", description: "Dùng dấu # để tạo tiêu đề từ lớn đến nhỏ." },
                { label: "Định dạng chữ", syntax: "**Chữ đậm**\n*Chữ nghiêng*\n~~Gạch ngang~~", description: "Các kiểu nhấn mạnh văn bản cơ bản." },
                { label: "Danh sách", syntax: "- Mục 1\n- Mục 2\n\n1. Bước 1\n2. Bước 2", description: "Dùng dấu gạch ngang cho danh sách không thứ tự, số cho danh sách có thứ tự." }
            ]
        },
        {
            title: "Nâng cao & Đa phương tiện",
            icon: <ImageIcon className="text-purple-400" />,
            items: [
                { label: "Hình ảnh", syntax: "![Mô tả ảnh](URL_HÌNH_ẢNH)", description: "Chèn hình ảnh vào bài viết. Ảnh sẽ tự động được AI Guru tối ưu hiển thị." },
                { label: "Code Snippets", syntax: "```javascript\nconsole.log('Hello');\n```", description: "Dùng 3 dấu backtick kèm tên ngôn ngữ để highlight code." },
                { label: "Trích dẫn", syntax: "> Câu trích dẫn hay", icon: <Quote />, description: "Dùng dấu > ở đầu dòng để tạo khung trích dẫn." }
            ]
        }
    ];

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[160px] -z-10" />

            <div className="container mx-auto max-w-4xl">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <Link href="/wiki" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Quay lại Thư viện</span>
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold text-white">
                            Hướng dẫn soạn thảo <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI Markdown</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Học cách sử dụng Markdown để bài viết của bạn trở nên chuyên nghiệp và sinh động hơn trên AI Coding Guru.
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-12">
                        {sections.map((section, sIdx) => (
                            <section key={sIdx} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                                </div>

                                <div className="grid gap-6">
                                    {section.items.map((item, iIdx) => (
                                        <GlassCard key={iIdx} className="p-6 md:p-8 hover:bg-white/[0.07] transition-all">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                <div className="space-y-2 max-w-sm">
                                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                        {item.label}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                    {item.note && (
                                                        <p className="text-[10px] text-yellow-400/60 font-medium italic">
                                                            * {item.note}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-black/40 rounded-xl p-4 border border-white/10 font-mono text-sm group relative overflow-hidden">
                                                        <div className="absolute top-2 right-4 text-[10px] text-white/20 uppercase font-black">Syntax</div>
                                                        <pre className="text-blue-300 whitespace-pre-wrap">
                                                            {item.syntax}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* Footer Warning */}
                    <div className="p-8 rounded-2xl bg-yellow-400/5 border border-yellow-400/20 text-center">
                        <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                        <p className="text-yellow-100/80 text-sm">
                            Hệ thống AI sẽ tự động phân tích và tối ưu hóa bài viết của bạn dựa trên các quy tắc này. <br className="hidden md:block" />
                            Hãy đảm bảo bạn tuân thủ đúng cú pháp để có trải nghiệm hiển thị tốt nhất!
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
