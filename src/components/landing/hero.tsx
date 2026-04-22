"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Brain, Code, Rocket, Zap } from "lucide-react";
import { buildProductTourHref, getProductTourStep } from "@/lib/product-tour";
import { OnboardingModal } from "./onboarding-modal";
import { NeonButton } from "../ui/neon-button";

const HERO_TITLE_LINE_1 = "\u0043\u1ea3\u0069\u0020\u0074\u0068\u0069\u1ec7\u006e";
const HERO_TITLE_LINE_2 = "\u0054\u01b0\u0020\u0064\u0075\u0079\u0020\u006c\u1ead\u0070\u0020\u0074\u0072\u00ec\u006e\u0068";
const HERO_TITLE_END = "\u0063\u00f9\u006e\u0067\u0020\u0041\u0049";
const HERO_DESCRIPTION = "\u0048\u1ecd\u0063\u0020\u006c\u1ead\u0070\u0020\u0074\u0072\u00ec\u006e\u0068\u0020\u006b\u0068\u00f4\u006e\u0067\u0020\u0063\u00f2\u006e\u0020\u006b\u0068\u00f3\u0020\u006b\u0068\u0103\u006e\u002e";
const HERO_BRAND = "\u0041\u0049\u0020\u0043\u004f\u0044\u0049\u004e\u0047\u0020\u0047\u0055\u0052\u0055";
const HERO_ENDING = "\u0047\u0069\u00fa\u0070\u0020\u0062\u1ea1\u006e\u0020\u0062\u1ea5\u0074\u0020\u0111\u1ea7\u0075\u0020\u0074\u0068\u1ead\u0074\u0020\u0064\u1ec5\u0020\u0064\u00e0\u006e\u0067\u0020\u0076\u00e0\u0020\u0076\u1eef\u006e\u0067\u0020\u0063\u0068\u1eaf\u0063\u002e";
const HERO_LOGGED_IN_CTA = "\u0051\u0075\u1ea3\u006e\u0020\u006c\u00fd\u0020\u0074\u0069\u1ebf\u006e\u0020\u0074\u0072\u00ec\u006e\u0068\u0020\u0068\u1ecd\u0063\u0020\u0063\u1ee7\u0061\u0020\u0062\u1ea1\u006e";
const HERO_GUEST_CTA = "\u0042\u1ea5\u0074\u0020\u0111\u1ea7\u0075\u0020\u006b\u0068\u00e1\u006d\u0020\u0070\u0068\u00e1\u0020\u006e\u0067\u0061\u0079";
const GUIDE_LABEL = "\u0048\u01b0\u1edb\u006e\u0067\u0020\u0064\u1eab\u006e";
const SHORT_LABEL = "\u004e\u0067\u1eaf\u006e\u0020\u0067\u1ecd\u006e";
const SHORT_VALUE = "\u0054\u1ed1\u0069\u0020\u01b0\u0075\u0020\u0068\u00f3\u0061";
const EXERCISE_LABEL = "\u0042\u00e0\u0069\u0020\u0074\u1ead\u0070";
const EXERCISE_VALUE = "\u0052\u00e8\u006e\u0020\u006c\u0075\u0079\u1ec7\u006e";
const COMMUNITY_LABEL = "\u0043\u1ed9\u006e\u0067\u0020\u0111\u1ed3\u006e\u0067";
const COMMUNITY_VALUE = "\u0054\u01b0\u01a1\u006e\u0067\u0020\u0074\u00e1\u0063";
const SKILL_COMMENT = "// Analyzing skills...";
const AI_COMMENT = "// AI assistance activated";
const WELCOME_TOUR_STEP = getProductTourStep("welcome-choice");

export function Hero({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
    const router = useRouter();
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

    const handlePrimaryAction = () => {
        if (isLoggedIn) {
            router.push("/dashboard");
            return;
        }

        setIsWelcomeOpen(true);
    };

    const handleGuideChoice = (href: string) => {
        setIsWelcomeOpen(false);
        router.push(href);
    };

    const handleTourChoice = (choiceId: string) => {
        if (!WELCOME_TOUR_STEP || WELCOME_TOUR_STEP.kind !== "choice") {
            return;
        }

        const choice = WELCOME_TOUR_STEP.choices.find((item) => item.id === choiceId);
        if (!choice) {
            return;
        }

        const href = "nextStepId" in choice
            ? buildProductTourHref(choice.href, choice.nextStepId)
            : choice.href;

        handleGuideChoice(href as "/signup" | "/login");
    };

    return (
        <>
            <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-28 pt-24 sm:px-0 sm:pb-0 sm:pt-20">
                <div className="absolute left-0 top-12 h-56 w-56 rounded-full bg-accent-secondary/20 blur-[90px] sm:left-20 sm:top-20 sm:h-72 sm:w-72 sm:blur-[100px]" />
                <div className="absolute bottom-12 right-0 h-72 w-72 rounded-full bg-accent-primary/10 blur-[100px] sm:bottom-20 sm:right-20 sm:h-96 sm:w-96 sm:blur-[120px]" />

                <div className="container relative z-10 mx-auto grid items-center gap-12 px-0 lg:grid-cols-2">
                    <div className="space-y-6 text-center sm:space-y-8 lg:text-left">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                            <span className="flex h-2 w-2 animate-ping rounded-full bg-accent-secondary" />
                            <span className="text-sm font-medium tracking-wide text-starlight">AI-Powered Learning V.2.1</span>
                        </div>

                        <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
                            {HERO_TITLE_LINE_1} <br />
                            <span className="text-gradient">{HERO_TITLE_LINE_2} <br /></span> {HERO_TITLE_END}
                        </h1>

                        <p className="mx-auto block max-w-xl text-base leading-relaxed text-slate-400 sm:hidden">
                            {HERO_DESCRIPTION}<br /> <span className="text-accent-secondary">{HERO_BRAND}<br /></span> {HERO_ENDING}
                        </p>

                        <p className="mx-auto hidden max-w-xl text-base leading-relaxed text-slate-400 sm:block sm:max-w-2xl sm:text-xl lg:mx-0">
                            {HERO_DESCRIPTION} <span className="text-accent-secondary">{HERO_BRAND}<br /></span> {HERO_ENDING}
                        </p>

                        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
                            <div onClick={handlePrimaryAction} className="w-full sm:w-auto">
                                <NeonButton variant="primary" icon={<ArrowRight className="h-5 w-5" />}>
                                    {isLoggedIn ? HERO_LOGGED_IN_CTA : HERO_GUEST_CTA}
                                </NeonButton>
                            </div>
                            <Link href="https://bnam821.github.io/redirect_bnam8210/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                <NeonButton variant="outline" icon={<Code className="h-5 w-5" />}>
                                    {GUIDE_LABEL}
                                </NeonButton>
                            </Link>
                        </div>

                        <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 lg:max-w-[80%]">
                            <div className="glass-panel group flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 p-2.5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary transition-colors group-hover:bg-accent-primary/20">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{SHORT_LABEL}</div>
                                    <div className="text-xs font-bold text-starlight">{SHORT_VALUE}</div>
                                </div>
                            </div>

                            <div className="glass-panel group flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 p-2.5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-secondary/10 text-accent-secondary transition-colors group-hover:bg-accent-secondary/20">
                                    <Brain size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{EXERCISE_LABEL}</div>
                                    <div className="text-xs font-bold text-starlight">{EXERCISE_VALUE}</div>
                                </div>
                            </div>

                            <div className="glass-panel group flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 p-2.5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500/20">
                                    <Rocket size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{COMMUNITY_LABEL}</div>
                                    <div className="text-xs font-bold text-starlight">{COMMUNITY_VALUE}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="group relative mt-4 flex justify-center sm:mt-10 lg:mt-0">
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-accent-secondary to-accent-primary opacity-30 blur transition duration-1000 group-hover:opacity-50"></div>
                        <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0f1115] p-4 font-mono text-xs leading-relaxed shadow-2xl sm:p-6 sm:text-sm">
                            <div className="mb-5 flex gap-2 sm:mb-6">
                                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                            </div>

                            <div className="space-y-1 break-words">
                                <div className="flex flex-wrap"><span className="mr-2 text-purple-400">const</span> <span className="text-yellow-400">coder</span> <span className="mx-2 text-starlight">=</span> <span className="text-blue-400">await</span> <span className="text-accent-secondary">CodingGuru</span>.<span className="text-blue-300">init</span>();</div>
                                <div className="italic text-slate-500">{SKILL_COMMENT}</div>
                                <div className="flex flex-wrap"><span className="mr-2 text-purple-400">if</span> (<span className="text-starlight">status</span> === <span className="text-green-400">&apos;beginner&apos;</span>) {"{"}</div>
                                <div className="flex pl-4"><span className="mr-2 text-blue-400">await</span> <span className="text-yellow-400">coder</span>.<span className="text-blue-300">boostLevel</span>(<span className="text-orange-400">100</span>);</div>
                                <div className="pl-4 italic text-slate-500">{AI_COMMENT}</div>
                                <div className="text-purple-400">{"}"}</div>
                                <div className="mt-4 flex flex-wrap"><span className="text-accent-primary">console</span>.<span className="text-blue-300">log</span>(<span className="text-green-400">&quot;Hello World, Vibe Coding!&quot;</span>);</div>
                            </div>
                        </div>

                        <div className="absolute top-1/2 z-20 hidden -translate-y-1/2 transform flex-col gap-2 md:-right-2 md:flex">
                            <div className="glass-panel animate-float animation-delay-4000 flex items-center gap-3 rounded-xl border-l-2 border-accent-secondary bg-black/40 p-2.5 backdrop-blur-md">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-secondary/20 text-accent-secondary">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Efficiency</div>
                                    <div className="text-xs font-bold text-starlight">+500% Boost</div>
                                </div>
                            </div>

                            <div className="glass-panel animate-float animation-delay-2000 flex items-center gap-3 rounded-xl border-l-2 border-blue-400 bg-black/40 p-2.5 backdrop-blur-md">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                    <Code size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Lines Code</div>
                                    <div className="text-xs font-bold text-starlight">10k+ Daily</div>
                                </div>
                            </div>

                            <div className="glass-panel animate-float animation-delay-1000 flex items-center gap-3 rounded-xl border-l-2 border-accent-primary bg-black/40 p-2.5 backdrop-blur-md">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/20 text-accent-primary">
                                    <Brain size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Accuracy</div>
                                    <div className="text-xs font-bold text-starlight">99.8%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {WELCOME_TOUR_STEP && WELCOME_TOUR_STEP.kind === "choice" ? (
                <OnboardingModal
                    isOpen={isWelcomeOpen}
                    step={WELCOME_TOUR_STEP}
                    onClose={() => setIsWelcomeOpen(false)}
                    onSelectChoice={handleTourChoice}
                />
            ) : null}
        </>
    );
}
