"use client";

import { useEffect } from "react";
import { Brain, Rocket } from "lucide-react";
import { ProductTourStep } from "@/lib/product-tour";
import { NeonButton } from "../ui/neon-button";

type OnboardingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    step: Extract<ProductTourStep, { kind: "choice" }>;
    onSelectChoice: (choiceId: string) => void;
};

export function OnboardingModal({
    isOpen,
    onClose,
    step,
    onSelectChoice,
}: OnboardingModalProps) {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0d1015]/95 p-6 shadow-[0_0_60px_rgba(0,223,154,0.18)] sm:p-8">
                <div className="mb-8 space-y-3 text-center">
                    <div className="inline-flex items-center rounded-full border border-accent-secondary/30 bg-accent-secondary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent-secondary">
                        {step.badge}
                    </div>
                    <h2 className="font-heading text-3xl font-bold text-starlight sm:text-4xl">
                        {step.title}
                    </h2>
                    <p className="mx-auto max-w-xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg">
                        {step.description}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {step.choices.map((choice) => {
                        const isSecondary = choice.accent === "secondary";
                        const Icon = choice.icon === "rocket" ? Rocket : Brain;

                        return (
                            <button
                                key={choice.id}
                                type="button"
                                onClick={() => onSelectChoice(choice.id)}
                                className={
                                    isSecondary
                                        ? "group rounded-[1.75rem] border border-accent-secondary/40 bg-accent-secondary/10 p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-accent-secondary hover:bg-accent-secondary/20 hover:shadow-[0_0_30px_rgba(0,223,154,0.18)]"
                                        : "group rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-accent-primary/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,204,0,0.12)]"
                                }
                            >
                                <div
                                    className={
                                        isSecondary
                                            ? "mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-secondary/20 text-accent-secondary"
                                            : "mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary"
                                    }
                                >
                                    <Icon size={20} />
                                </div>
                                <div className="text-xl font-semibold text-starlight">{choice.label}</div>
                                <p className="mt-2 text-pretty text-sm leading-8 text-slate-300">
                                    {choice.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 flex justify-center">
                    <NeonButton variant="ghost" onClick={onClose}>
                        {step.closeLabel}
                    </NeonButton>
                </div>
            </div>
        </div>
    );
}
