"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, User, Mail, Eye, EyeOff, Sparkles, Brain, Rocket } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import {
    PRODUCT_TOUR_RECOMMENDED_COURSE_PARAM,
    PRODUCT_TOUR_STEP_PARAM,
    buildTourUrl,
    getProductTourStep,
} from "@/lib/product-tour";
import { cn } from "@/lib/utils";

const PASSWORD_MISMATCH_ERROR = "M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp.";
const GENERIC_ERROR = "\u0110\u00e3 c\u00f3 l\u1ed7i x\u1ea3y ra. Vui l\u00f2ng th\u1eed l\u1ea1i.";
const SUCCESS_TITLE = "\u0110\u0103ng k\u00fd th\u00e0nh c\u00f4ng!";
const SUCCESS_DESCRIPTION = "\u0110ang \u0111\u0103ng nh\u1eadp v\u00e0 chuy\u1ec3n h\u01b0\u1edbng...";
const FORM_TITLE = "T\u1ea1o t\u00e0i kho\u1ea3n";
const FORM_DESCRIPTION = "Tham gia c\u00f9ng c\u1ed9ng \u0111\u1ed3ng AI Guru";
const USERNAME_LABEL = "T\u00ean \u0111\u0103ng nh\u1eadp";
const EMAIL_LABEL = "Email";
const PASSWORD_LABEL = "M\u1eadt kh\u1ea9u";
const CONFIRM_PASSWORD_LABEL = "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u";
const SUBMIT_LABEL = "\u0110\u0103ng k\u00fd ngay";
const SUBMIT_LOADING_LABEL = "\u0110ang x\u1eed l\u00fd...";
const LOGIN_PROMPT = "\u0110\u00e3 c\u00f3 t\u00e0i kho\u1ea3n?";
const LOGIN_LINK = "\u0110\u0103ng nh\u1eadp";
const STEP_THREE_TITLE_FALLBACK = "H\u00e3y cho AI Coding Guru bi\u1ebft:";

type GuidedFieldId = "username" | "email" | "password" | "confirmPassword" | "submit";

export function SignupForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [guidedIndex, setGuidedIndex] = useState(0);

    const router = useRouter();
    const searchParams = useSearchParams();

    const usernameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const submitRef = useRef<HTMLButtonElement>(null);

    const tourStepId = searchParams.get(PRODUCT_TOUR_STEP_PARAM);
    const activeTourStep = getProductTourStep(tourStepId);
    const signupGuideStep = getProductTourStep("signup-guide");
    const signupStepThree = getProductTourStep("signup-step-3");
    const isGuidedSignup =
        activeTourStep?.id === "signup-guide" && activeTourStep.kind === "guided-form";
    const isStepThree =
        activeTourStep?.id === "signup-step-3" && activeTourStep.kind === "choice";

    const guidedFields = useMemo(
        () => (isGuidedSignup && signupGuideStep?.kind === "guided-form" ? signupGuideStep.fields : []),
        [isGuidedSignup, signupGuideStep]
    );

    const activeGuide = guidedFields[guidedIndex] ?? null;
    const activeGuideId = activeGuide?.id as GuidedFieldId | undefined;

    useEffect(() => {
        if (!isGuidedSignup) {
            setGuidedIndex(0);
        }
    }, [isGuidedSignup]);

    useEffect(() => {
        if (!isGuidedSignup || !activeGuideId) {
            return;
        }

        const focusMap: Record<GuidedFieldId, () => void> = {
            username: () => usernameRef.current?.focus(),
            email: () => emailRef.current?.focus(),
            password: () => passwordRef.current?.focus(),
            confirmPassword: () => confirmPasswordRef.current?.focus(),
            submit: () => submitRef.current?.focus(),
        };

        focusMap[activeGuideId]?.();
    }, [activeGuideId, isGuidedSignup]);

    const isGuideStepComplete = (fieldId: GuidedFieldId | undefined) => {
        switch (fieldId) {
            case "username":
                return username.trim().length > 0;
            case "email":
                return email.trim().length > 0;
            case "password":
                return password.length > 0;
            case "confirmPassword":
                return confirmPassword.length > 0;
            case "submit":
                return true;
            default:
                return false;
        }
    };

    const canAdvanceGuide = isGuideStepComplete(activeGuideId);

    const handleGuideAdvance = () => {
        if (!isGuidedSignup || !canAdvanceGuide) {
            return;
        }

        setGuidedIndex((current) => Math.min(current + 1, guidedFields.length - 1));
    };

    const renderGuidePanel = (fieldId: GuidedFieldId) => {
        if (!isGuidedSignup || activeGuideId !== fieldId || !activeTourStep) {
            return null;
        }

        return (
            <div className="relative z-20 mt-3 rounded-2xl border border-accent-secondary/25 bg-accent-secondary/10 p-4 shadow-[0_0_30px_rgba(0,223,154,0.12)]">
                <div className="mb-2 inline-flex items-center rounded-full border border-accent-secondary/30 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent-secondary">
                    {activeTourStep.badge}
                </div>
                <h2 className="text-xl font-bold text-white">{activeGuide?.label ?? activeTourStep.title}</h2>
                <p className="mt-2 text-sm leading-7 text-white/75">
                    {activeGuide?.instruction}
                </p>
                {activeGuide?.id !== "submit" ? (
                    <div className="mt-4 flex justify-end">
                        <NeonButton
                            type="button"
                            variant="secondary"
                            className="rounded-xl px-5 py-2.5 text-xs"
                            onClick={handleGuideAdvance}
                            disabled={!canAdvanceGuide}
                        >
                            {activeGuide?.advanceLabel || "Ti\u1ebfp t\u1ee5c"}
                        </NeonButton>
                    </div>
                ) : null}
            </div>
        );
    };

    const getSectionState = (fieldId: GuidedFieldId) => {
        if (!isGuidedSignup || !activeGuideId) {
            return { isActive: false, isMuted: false };
        }

        return {
            isActive: activeGuideId === fieldId,
            isMuted: activeGuideId !== fieldId,
        };
    };

    const shouldDisableSection = (fieldId: GuidedFieldId) => {
        if (!isGuidedSignup || !activeGuideId) {
            return false;
        }

        return activeGuideId !== fieldId;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(PASSWORD_MISMATCH_ERROR);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();
            if (data.success) {
                if (isGuidedSignup && signupGuideStep?.kind === "guided-form") {
                    setSuccess(true);
                    router.replace(buildTourUrl("/signup", { [PRODUCT_TOUR_STEP_PARAM]: signupGuideStep.nextStepId }));
                    return;
                }

                setSuccess(true);
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            } else {
                setError(data.error);
            }
        } catch {
            setError(GENERIC_ERROR);
        } finally {
            setIsLoading(false);
        }
    };

    if (isStepThree && signupStepThree?.kind === "choice") {
        return (
            <GlassCard className="mx-auto max-w-2xl space-y-6 border-white/10 p-8 text-center shadow-2xl" hoverEffect={false}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-secondary/15 text-accent-secondary">
                    <Sparkles size={28} />
                </div>
                <div className="space-y-3">
                    <div className="inline-flex items-center rounded-full border border-accent-secondary/25 bg-accent-secondary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent-secondary">
                        {signupStepThree.badge}
                    </div>
                    <h2 className="text-3xl font-bold text-white">{signupStepThree.title || STEP_THREE_TITLE_FALLBACK}</h2>
                    <p className="mx-auto max-w-xl text-base leading-relaxed text-white/70">
                        {signupStepThree.description}
                    </p>
                </div>

                <div className="grid gap-4 text-left sm:grid-cols-2">
                    {signupStepThree.choices.map((choice) => {
                        const isSecondary = choice.accent === "secondary";
                        const recommendedCourse = "recommendedCourse" in choice ? choice.recommendedCourse : "";
                        const href = buildTourUrl(choice.href, {
                            [PRODUCT_TOUR_STEP_PARAM]: "signup-step-3",
                            [PRODUCT_TOUR_RECOMMENDED_COURSE_PARAM]: recommendedCourse,
                        });

                        return (
                            <Link
                                key={choice.id}
                                href={href}
                                className={cn(
                                    "group rounded-[1.75rem] border p-5 transition duration-300 hover:-translate-y-1",
                                    isSecondary
                                        ? "border-accent-secondary/40 bg-accent-secondary/10 hover:border-accent-secondary hover:bg-accent-secondary/20 hover:shadow-[0_0_30px_rgba(0,223,154,0.18)]"
                                        : "border-white/10 bg-white/5 hover:border-accent-primary/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,204,0,0.12)]"
                                )}
                            >
                                <div
                                    className={cn(
                                        "mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full",
                                        isSecondary
                                            ? "bg-accent-secondary/20 text-accent-secondary"
                                            : "bg-accent-primary/15 text-accent-primary"
                                    )}
                                >
                                    {isSecondary ? <Rocket size={20} /> : <Brain size={20} />}
                                </div>
                                <div className="text-xl font-semibold text-starlight">{choice.label}</div>
                                <p className="mt-2 text-sm leading-7 text-slate-300">{choice.description}</p>
                            </Link>
                        );
                    })}
                </div>
            </GlassCard>
        );
    }

    if (success) {
        return (
            <GlassCard className="mx-auto max-w-md space-y-4 border-white/10 p-8 text-center shadow-2xl">
                <div className="mb-4 text-5xl text-accent-secondary">✓</div>
                <h2 className="text-2xl font-bold text-white">{SUCCESS_TITLE}</h2>
                <p className="text-white/60">{SUCCESS_DESCRIPTION}</p>
            </GlassCard>
        );
    }

    const usernameState = getSectionState("username");
    const emailState = getSectionState("email");
    const passwordState = getSectionState("password");
    const confirmPasswordState = getSectionState("confirmPassword");
    const submitState = getSectionState("submit");

    return (
        <div className="relative">
            {isGuidedSignup ? (
                <div className="pointer-events-none fixed inset-0 z-0 bg-black/55 backdrop-blur-[2px]" />
            ) : null}

            <GlassCard
                className={cn(
                    "relative mx-auto max-w-md border-white/10 p-8 shadow-2xl",
                    isGuidedSignup && "z-10 border-accent-secondary/20 bg-[#0f1418]/95 shadow-[0_0_40px_rgba(0,223,154,0.12)]"
                )}
                hoverEffect={!isGuidedSignup}
            >
                <form onSubmit={handleSignup} className="space-y-4 text-left">
                    <header
                        className={cn(
                            "mb-6 space-y-2 text-center transition-all duration-300",
                            isGuidedSignup && "opacity-20 blur-[1px]"
                        )}
                    >
                        <h2 className="text-2xl font-bold tracking-tight text-white">{FORM_TITLE}</h2>
                        <p className="text-sm text-white/60">{FORM_DESCRIPTION}</p>
                    </header>

                    {error ? (
                        <div
                            className={cn(
                                "rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-500 transition-all duration-300",
                                isGuidedSignup && "opacity-20 blur-[1px]"
                            )}
                        >
                            {error}
                        </div>
                    ) : null}

                    <div
                        className={cn(
                            "space-y-1 rounded-2xl p-3 transition-all duration-300",
                            usernameState.isActive && "relative z-20 border border-accent-secondary/30 bg-black/25 shadow-[0_0_28px_rgba(0,223,154,0.12)]",
                            usernameState.isMuted && "opacity-20 blur-[1px]"
                        )}
                    >
                        <label className="ml-1 text-sm font-medium text-white">{USERNAME_LABEL}</label>
                        <div className="group relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent-primary">
                                <User size={18} />
                            </div>
                            <input
                                ref={usernameRef}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={shouldDisableSection("username")}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white transition-all focus:border-accent-primary/50 focus:outline-none disabled:cursor-not-allowed"
                                placeholder="username123"
                                required
                            />
                        </div>
                        {renderGuidePanel("username")}
                    </div>

                    <div
                        className={cn(
                            "space-y-1 rounded-2xl p-3 transition-all duration-300",
                            emailState.isActive && "relative z-20 border border-accent-secondary/30 bg-black/25 shadow-[0_0_28px_rgba(0,223,154,0.12)]",
                            emailState.isMuted && "opacity-20 blur-[1px]"
                        )}
                    >
                        <label className="ml-1 text-sm font-medium text-white">{EMAIL_LABEL}</label>
                        <div className="group relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent-primary">
                                <Mail size={18} />
                            </div>
                            <input
                                ref={emailRef}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={shouldDisableSection("email")}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white transition-all focus:border-accent-primary/50 focus:outline-none disabled:cursor-not-allowed"
                                placeholder="example@email.com"
                                required
                            />
                        </div>
                        {renderGuidePanel("email")}
                    </div>

                    <div
                        className={cn(
                            "space-y-1 rounded-2xl p-3 transition-all duration-300",
                            passwordState.isActive && "relative z-20 border border-accent-secondary/30 bg-black/25 shadow-[0_0_28px_rgba(0,223,154,0.12)]",
                            passwordState.isMuted && "opacity-20 blur-[1px]"
                        )}
                    >
                        <label className="ml-1 text-sm font-medium text-white">{PASSWORD_LABEL}</label>
                        <div className="group relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent-primary">
                                <Lock size={18} />
                            </div>
                            <input
                                ref={passwordRef}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={shouldDisableSection("password")}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-white transition-all focus:border-accent-primary/50 focus:outline-none disabled:cursor-not-allowed"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={shouldDisableSection("password")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {renderGuidePanel("password")}
                    </div>

                    <div
                        className={cn(
                            "space-y-1 rounded-2xl p-3 transition-all duration-300",
                            confirmPasswordState.isActive && "relative z-20 border border-accent-secondary/30 bg-black/25 shadow-[0_0_28px_rgba(0,223,154,0.12)]",
                            confirmPasswordState.isMuted && "opacity-20 blur-[1px]"
                        )}
                    >
                        <label className="ml-1 text-sm font-medium text-white">{CONFIRM_PASSWORD_LABEL}</label>
                        <div className="group relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent-primary">
                                <Lock size={18} />
                            </div>
                            <input
                                ref={confirmPasswordRef}
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={shouldDisableSection("confirmPassword")}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-white transition-all focus:border-accent-primary/50 focus:outline-none disabled:cursor-not-allowed"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {renderGuidePanel("confirmPassword")}
                    </div>

                    <div
                        className={cn(
                            "mt-4 flex flex-col items-center rounded-2xl p-3 transition-all duration-300",
                            submitState.isActive && "relative z-20 border border-accent-secondary/30 bg-black/25 shadow-[0_0_28px_rgba(0,223,154,0.12)]",
                            submitState.isMuted && "opacity-20 blur-[1px]"
                        )}
                    >
                        <NeonButton
                            ref={submitRef}
                            type="submit"
                            variant="primary"
                            className="min-w-[220px] rounded-xl py-4 font-bold"
                            disabled={isLoading || shouldDisableSection("submit")}
                        >
                            {isLoading ? SUBMIT_LOADING_LABEL : SUBMIT_LABEL}
                        </NeonButton>
                        {renderGuidePanel("submit")}
                    </div>

                    <p
                        className={cn(
                            "mt-4 text-center text-sm text-white/40 transition-all duration-300",
                            isGuidedSignup && "opacity-20 blur-[1px]"
                        )}
                    >
                        {LOGIN_PROMPT}{" "}
                        <Link href="/login" className="cursor-pointer text-accent-secondary hover:underline">
                            {LOGIN_LINK}
                        </Link>
                    </p>
                </form>
            </GlassCard>
        </div>
    );
}
