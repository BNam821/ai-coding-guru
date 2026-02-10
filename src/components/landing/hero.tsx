"use client";

import Link from "next/link";
import Image from "next/image";
import { NeonButton } from "../ui/neon-button";
import { ArrowRight, Code, Zap, Brain, Rocket } from "lucide-react";

export function Hero() {
    const scrollToFeatures = () => {
        const element = document.getElementById('features');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Elements */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-accent-secondary/20 rounded-full blur-[100px] animate-blob" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-primary/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />

            <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Text Content */}
                <div className="space-y-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-accent-secondary animate-ping" />
                        <span className="text-sm font-medium text-starlight tracking-wide">AI-Powered Learning V.2.1</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight font-heading leading-tight">
                        Cải thiện <br />
                        <span className="text-gradient">Tư duy lập trình <br />
                        </span> cùng AI
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Học lập trình không còn khó khăn. <span className="text-accent-secondary">CẢI THIỆN TƯ DUY LẬP TRÌNH<br />
                        </span> Giúp bạn bắt đầu thật dễ dàng và vững chắc.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <div onClick={scrollToFeatures}>
                            <NeonButton variant="primary" icon={<ArrowRight className="w-5 h-5" />}>
                                Bắt đầu Khám phá ngay
                            </NeonButton>
                        </div>
                        <Link href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
                            <NeonButton variant="outline" icon={<Code className="w-5 h-5" />}>
                                Hướng dẫn
                            </NeonButton>
                        </Link>
                    </div>

                    {/* Feature Stats - Horizontal & Compact */}
                    <div className="flex flex-row gap-3 mt-10 w-full lg:max-w-[80%]">
                        <div className="glass-panel p-2.5 rounded-xl flex-1 flex flex-col items-center justify-center gap-2 border border-white/10 transition-all hover:bg-white/10 hover:-translate-y-1 duration-300 text-center group">
                            <div className="h-8 w-8 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
                                <Zap size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Ngắn gọn</div>
                                <div className="text-xs font-bold text-starlight">Tối ưu hóa</div>
                            </div>
                        </div>

                        <div className="glass-panel p-2.5 rounded-xl flex-1 flex flex-col items-center justify-center gap-2 border border-white/10 transition-all hover:bg-white/10 hover:-translate-y-1 duration-300 text-center group">
                            <div className="h-8 w-8 rounded-full bg-accent-secondary/10 flex items-center justify-center text-accent-secondary group-hover:bg-accent-secondary/20 transition-colors">
                                <Brain size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Bài tập</div>
                                <div className="text-xs font-bold text-starlight">Rèn luyện</div>
                            </div>
                        </div>

                        <div className="glass-panel p-2.5 rounded-xl flex-1 flex flex-col items-center justify-center gap-2 border border-white/10 transition-all hover:bg-white/10 hover:-translate-y-1 duration-300 text-center group">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                <Rocket size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Cộng đồng</div>
                                <div className="text-xs font-bold text-starlight">Tương tác</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Visual (Code Animation) */}
                <div className="relative animate-float mt-10 lg:mt-0 group flex justify-center">
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent-secondary to-accent-primary rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative w-full max-w-md bg-[#0f1115] rounded-xl border border-white/10 shadow-2xl overflow-hidden p-6 font-mono text-sm leading-relaxed">
                        <div className="flex gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex"><span className="text-purple-400 mr-2">const</span> <span className="text-yellow-400">coder</span> <span className="text-starlight mx-2">=</span> <span className="text-blue-400">await</span> <span className="text-accent-secondary">CodingGuru</span>.<span className="text-blue-300">init</span>();</div>
                            <div className="text-slate-500 italic">// Analyzing skills...</div>
                            <div className="flex"><span className="text-purple-400 mr-2">if</span> (<span className="text-starlight">status</span> === <span className="text-green-400">'beginner'</span>) {"{"}</div>
                            <div className="pl-4 flex"><span className="text-blue-400 mr-2">await</span> <span className="text-yellow-400">coder</span>.<span className="text-blue-300">boostLevel</span>(<span className="text-orange-400">100</span>);</div>
                            <div className="pl-4 text-slate-500 italic">// AI assistance activated 🚀</div>
                            <div className="text-purple-400">{"}"}</div>
                            <div className="mt-4 flex"><span className="text-accent-primary">console</span>.<span className="text-blue-300">log</span>(<span className="text-green-400">"Hello World, Vibe Coding!"</span>);</div>
                        </div>
                    </div>

                    {/* Floating UI Elements - Vertical Stack on Right */}
                    <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 flex flex-col gap-2 z-20 hidden md:flex">

                        {/* Card 1: Efficiency */}
                        <div className="glass-panel p-2.5 rounded-xl flex items-center gap-3 animate-float animation-delay-4000 border-l-2 border-accent-secondary bg-black/40 backdrop-blur-md">
                            <div className="h-8 w-8 rounded-full bg-accent-secondary/20 flex items-center justify-center text-accent-secondary">
                                <Zap size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Efficiency</div>
                                <div className="text-xs font-bold text-starlight">+500% Boost</div>
                            </div>
                        </div>

                        {/* Card 2: Code Output */}
                        <div className="glass-panel p-2.5 rounded-xl flex items-center gap-3 animate-float animation-delay-2000 border-l-2 border-blue-400 bg-black/40 backdrop-blur-md">
                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Code size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Lines Code</div>
                                <div className="text-xs font-bold text-starlight">10k+ Daily</div>
                            </div>
                        </div>

                        {/* Card 3: Accuracy */}
                        <div className="glass-panel p-2.5 rounded-xl flex items-center gap-3 animate-float animation-delay-1000 border-l-2 border-accent-primary bg-black/40 backdrop-blur-md">
                            <div className="h-8 w-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                                <Brain size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Accuracy</div>
                                <div className="text-xs font-bold text-starlight">99.8%</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section >
    );
}
