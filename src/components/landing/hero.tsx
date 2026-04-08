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
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-28 pt-24 sm:px-0 sm:pb-0 sm:pt-20">
            {/* Background Elements */}
            <div className="absolute left-0 top-12 h-56 w-56 rounded-full bg-accent-secondary/20 blur-[90px] sm:left-20 sm:top-20 sm:h-72 sm:w-72 sm:blur-[100px]" />
            <div className="absolute bottom-12 right-0 h-72 w-72 rounded-full bg-accent-primary/10 blur-[100px] sm:bottom-20 sm:right-20 sm:h-96 sm:w-96 sm:blur-[120px]" />

            <div className="container relative z-10 mx-auto grid items-center gap-12 px-0 lg:grid-cols-2">
                {/* Text Content */}
                <div className="space-y-6 text-center lg:text-left sm:space-y-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-accent-secondary animate-ping" />
                        <span className="text-sm font-medium text-starlight tracking-wide">AI-Powered Learning V.2.1</span>
                    </div>

                    <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
                        Cải thiện <br />
                        <span className="text-gradient">Tư duy lập trình <br />
                        </span> cùng AI
                    </h1>

                    <p className="mx-auto block max-w-xl text-base leading-relaxed text-slate-400 sm:hidden">
                        Học lập trình không còn khó khăn.<br /> <span className="text-accent-secondary">AI CODING GURU<br />
                        </span> Giúp bạn bắt đầu thật dễ dàng và vững chắc.
                    </p>

                    <p className="mx-auto hidden max-w-xl text-base leading-relaxed text-slate-400 sm:block sm:max-w-2xl sm:text-xl lg:mx-0">
                        Học lập trình không còn khó khăn. <span className="text-accent-secondary">AI CODING GURU<br />
                        </span> Giúp bạn bắt đầu thật dễ dàng và vững chắc.
                    </p>

                    <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
                        <div onClick={scrollToFeatures} className="w-full sm:w-auto">
                            <NeonButton variant="primary" icon={<ArrowRight className="w-5 h-5" />}>
                                Bắt đầu Khám phá ngay
                            </NeonButton>
                        </div>
                        <Link href="https://bnam821.github.io/redirect_bnam8210/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <NeonButton variant="outline" icon={<Code className="w-5 h-5" />}>
                                Hướng dẫn
                            </NeonButton>
                        </Link>
                    </div>

                    {/* Feature Stats - Horizontal & Compact */}
                    <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 lg:max-w-[80%]">
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
                <div className="group relative mt-4 flex justify-center sm:mt-10 lg:mt-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent-secondary to-accent-primary rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0f1115] p-4 font-mono text-xs leading-relaxed shadow-2xl sm:p-6 sm:text-sm">
                        <div className="mb-5 flex gap-2 sm:mb-6">
                            <div className="h-3 w-3 rounded-full bg-red-500/80" />
                            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                            <div className="h-3 w-3 rounded-full bg-green-500/80" />
                        </div>

                        <div className="space-y-1 break-words">
                            <div className="flex flex-wrap"><span className="mr-2 text-purple-400">const</span> <span className="text-yellow-400">coder</span> <span className="mx-2 text-starlight">=</span> <span className="text-blue-400">await</span> <span className="text-accent-secondary">CodingGuru</span>.<span className="text-blue-300">init</span>();</div>
                            <div className="text-slate-500 italic">{"// Analyzing skills..."}</div>
                            <div className="flex flex-wrap"><span className="mr-2 text-purple-400">if</span> (<span className="text-starlight">status</span> === <span className="text-green-400">&apos;beginner&apos;</span>) {"{"}</div>
                            <div className="flex pl-4"><span className="mr-2 text-blue-400">await</span> <span className="text-yellow-400">coder</span>.<span className="text-blue-300">boostLevel</span>(<span className="text-orange-400">100</span>);</div>
                            <div className="pl-4 text-slate-500 italic">{"// AI assistance activated 🚀"}</div>
                            <div className="text-purple-400">{"}"}</div>
                            <div className="mt-4 flex flex-wrap"><span className="text-accent-primary">console</span>.<span className="text-blue-300">log</span>(<span className="text-green-400">&quot;Hello World, Vibe Coding!&quot;</span>);</div>
                        </div>
                    </div>

                    {/* Floating UI Elements - Vertical Stack on Right */}
                    <div className="absolute top-1/2 z-20 hidden -translate-y-1/2 transform flex-col gap-2 md:-right-2 md:flex">

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
