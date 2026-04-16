"use client";

import Link from "next/link";
import { BrainCircuit, Sparkles, Database, Code2, Settings } from "lucide-react";
import { useEffect, useState } from "react";

export default function TestLandingPage() {
    const [showOptions, setShowOptions] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetch("/api/auth/session")
            .then(res => res.json())
            .then(session => {
                if (session && session.role === "admin") {
                    setIsAdmin(true);
                }
            })
            .catch(() => {});
    }, []);

    return (
        <main className="min-h-screen flex flex-col items-center pt-32 pb-20 p-4 relative overflow-hidden">
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
                        Hệ thống AI sẽ phân tích lịch sử học tập của bạn <br />và tạo ra bài kiểm tra được cá nhân hóa ngay lập tức.
                    </p>
                </div>

                {/* Main Action Area */}
                {!showOptions ? (
                    <div className="animate-fade-in-up delay-300 group">
                        <button 
                            onClick={() => setShowOptions(true)}
                            className="relative inline-block w-full max-w-sm mx-auto"
                        >
                            <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse" />
                            <div className="relative w-full px-12 py-8 bg-black/40 backdrop-blur-md border-2 border-yellow-400/50 hover:border-yellow-400 text-yellow-400 rounded-2xl transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.3)] flex flex-col items-center gap-4 group-hover:bg-yellow-400/10">
                                <BrainCircuit size={48} strokeWidth={1.5} />
                                <span className="text-2xl font-bold tracking-widest uppercase">
                                    Bắt đầu Kiểm tra
                                </span>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in-up delay-100 flex flex-col md:flex-row gap-6 justify-center w-full max-w-4xl mx-auto">
                        {/* Option 1: Trắc nghiệm */}
                        <Link href="/test/exam" className="group flex-1">
                            <div className="relative h-full px-8 py-10 bg-black/40 backdrop-blur-md border-2 border-purple-500/30 hover:border-purple-500 text-purple-400 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col items-center text-center gap-6 group-hover:bg-purple-500/10">
                                <div className="p-4 bg-purple-500/20 rounded-full">
                                    <Database size={40} className="text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Trắc nghiệm AI</h3>
                                    <p className="text-sm text-gray-400 mb-4 tracking-wide">Kiểm tra lý thuyết thông qua hệ thống câu hỏi đa lựa chọn được cá nhân hóa.</p>
                                </div>
                            </div>
                        </Link>

                        {/* Option 2: Code AI */}
                        <Link href="/test/code" className="group flex-1">
                            <div className="relative h-full px-8 py-10 bg-black/40 backdrop-blur-md border-2 border-cyan-500/30 hover:border-cyan-500 text-cyan-400 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col items-center text-center gap-6 group-hover:bg-cyan-500/10">
                                <div className="p-4 bg-cyan-500/20 rounded-full">
                                    <Code2 size={40} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Chấm Code AI</h3>
                                    <p className="text-sm text-gray-400 mb-4 tracking-wide">Làm bài tập lập trình thực tế, AI phân tích logic và đánh giá độ phức tạp thuật toán.</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Admin Quick Action */}
                {isAdmin && (
                    <div className="animate-fade-in-up delay-[600ms] pt-4">
                        <Link 
                            href="/test/admin/manage"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium group"
                        >
                            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                            <span>Quản lý danh sách bài tập (Admin)</span>
                        </Link>
                    </div>
                )}

                {/* Footer Info */}
                <div className="space-y-6 border-t border-white/5 pt-8 animate-fade-in-up delay-500">
                    <h3 className="text-white font-medium text-sm tracking-wider uppercase opacity-50">
                        Chi tiết bài kiểm tra:
                    </h3>
                    <div className="grid grid-cols-3 gap-8 text-sm text-gray-500">
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

                {/* AI Disclaimer */}
                <p className="text-[10px] text-gray-500/50 animate-fade-in-up delay-700 max-w-xs mx-auto">
                    Bài kiểm tra được tạo tự động bởi AI. <br />Vui lòng kiểm tra tính xác thực của nội dung.
                </p>
            </div>
        </main>
    );
}
