"use client";

import Link from "next/link";
import { BrainCircuit, Sparkles } from "lucide-react";

export default function TestLandingPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-deep-space -z-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />

            <div className="relative z-10 text-center space-y-12 max-w-2xl mx-auto">
                {/* Header */}
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm font-medium animate-fade-in-up">
                        <Sparkles size={16} />
                        <span>AI Knowledge Check</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-yellow-100 to-yellow-500 pb-2 animate-fade-in-up delay-100">
                        Kiểm tra Kiến thức
                    </h1>

                    <p className="text-xl text-gray-400 animate-fade-in-up delay-200">
                        Hệ thống AI sẽ phân tích lịch sử học tập của bạn và tạo ra bài kiểm tra được cá nhân hóa ngay lập tức.
                    </p>
                </div>

                {/* Main Action Button */}
                <div className="animate-fade-in-up delay-300 group">
                    <Link href="/test/quiz" className="relative inline-block">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse" />

                        {/* Button Content */}
                        <button className="relative px-12 py-8 bg-black/40 backdrop-blur-md border-2 border-yellow-400/50 hover:border-yellow-400 text-yellow-400 rounded-2xl transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.3)] flex flex-col items-center gap-4 group-hover:bg-yellow-400/10">
                            <BrainCircuit size={48} strokeWidth={1.5} />
                            <span className="text-2xl font-bold tracking-widest uppercase">
                                Bắt đầu Kiểm tra
                            </span>
                        </button>
                    </Link>
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-3 gap-8 text-sm text-gray-500 border-t border-white/5 pt-8 animate-fade-in-up delay-500">
                    <div>
                        <span className="block text-white font-bold text-lg mb-1">3</span>
                        Bài học gần nhất
                    </div>
                    <div>
                        <span className="block text-white font-bold text-lg mb-1">10</span>
                        Câu hỏi trắc nghiệm
                    </div>
                    <div>
                        <span className="block text-white font-bold text-lg mb-1">AI</span>
                        Phân tích & Chấm điểm
                    </div>
                </div>
            </div>
        </main>
    );
}
