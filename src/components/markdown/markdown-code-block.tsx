"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownCodeBlockProps {
    code: string;
    language?: string;
    languageLabel?: string;
    className?: string;
    children?: ReactNode;
}

export function MarkdownCodeBlock({
    code,
    language,
    languageLabel,
    className,
    children,
}: MarkdownCodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="my-6 overflow-hidden rounded-2xl border border-white/10 bg-[#12151b] shadow-[0_0_18px_rgba(0,223,154,0.06)]">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent-secondary/75 shadow-[0_0_10px_rgba(0,223,154,0.45)]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/62">
                        {languageLabel || language || "Text"}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:border-accent-secondary/30 hover:text-white"
                >
                    {copied ? <Check size={14} className="text-accent-secondary" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className="overflow-x-auto bg-[#171a20] px-4 py-4 text-sm leading-7 shadow-[inset_0_1px_0_rgba(0,223,154,0.22)]">
                <code className={cn(className)}>{children ?? code}</code>
            </pre>
        </div>
    );
}
