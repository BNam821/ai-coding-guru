"use client";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const AI_BLANK_TOKEN = "__AI_BLANK__";

interface MarkdownCodeBlockProps {
    code: string;
    language?: string;
    languageLabel?: string;
    className?: string;
    children?: ReactNode;
}

function highlightAiBlankText(text: string, keyPrefix: string): ReactNode {
    if (!text.includes(AI_BLANK_TOKEN)) {
        return text;
    }

    const parts = text.split(AI_BLANK_TOKEN);

    return parts.flatMap((part, index) => {
        const nodes: ReactNode[] = [];

        if (part) {
            nodes.push(part);
        }

        if (index < parts.length - 1) {
            nodes.push(
                <span
                    key={`${keyPrefix}-${index}`}
                    className="rounded-sm bg-yellow-400 px-1.5 py-0.5 font-bold text-black shadow-[0_0_0_1px_rgba(250,204,21,0.35),0_0_18px_rgba(250,204,21,0.28)]"
                >
                    {AI_BLANK_TOKEN}
                </span>
            );
        }

        return nodes;
    });
}

function highlightAiBlankNode(node: ReactNode, keyPrefix = "blank"): ReactNode {
    if (typeof node === "string") {
        return highlightAiBlankText(node, keyPrefix);
    }

    if (typeof node === "number" || node == null || typeof node === "boolean") {
        return node;
    }

    if (Array.isArray(node)) {
        return node.map((child, index) => highlightAiBlankNode(child, `${keyPrefix}-${index}`));
    }

    if (isValidElement(node)) {
        const props = node.props as { children?: ReactNode };

        if (props.children === undefined) {
            return node;
        }

        return cloneElement(node, undefined, highlightAiBlankNode(props.children, keyPrefix));
    }

    return Children.map(node, (child, index) => highlightAiBlankNode(child, `${keyPrefix}-${index}`));
}

export function MarkdownCodeBlock({
    code,
    language,
    languageLabel,
    className,
    children,
}: MarkdownCodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const normalizedCode = code.replace(/\n$/, "");
    const lines = normalizedCode.split("\n");
    const lineNumbers = Array.from({ length: Math.max(lines.length, 1) }, (_, index) => index + 1);
    const renderedCode = highlightAiBlankNode(children ?? normalizedCode);

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
        <div className="my-6 max-w-full overflow-hidden rounded-2xl border border-accent-secondary/75 bg-[#12151b] shadow-[0_0_0_1px_rgba(0,223,154,0.2),0_0_22px_rgba(0,223,154,0.18),0_0_48px_rgba(0,223,154,0.08)]">
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
            <div className="flex min-w-0 bg-[#171a20] text-sm leading-6">
                <div
                    aria-hidden="true"
                    className="flex shrink-0 select-none flex-col border-r border-white/8 bg-black/20 px-3 py-2.5 text-right font-medium text-white/28"
                >
                    {lineNumbers.map((lineNumber) => (
                        <div key={lineNumber}>{lineNumber}</div>
                    ))}
                </div>
                <pre className="markdown-code-block-pre min-w-0 flex-1 overflow-x-hidden px-4 py-2.5 sm:overflow-x-auto">
                    <code className={cn("block whitespace-pre-wrap break-words sm:min-w-max sm:whitespace-pre sm:break-normal", className)}>{renderedCode}</code>
                </pre>
            </div>
        </div>
    );
}
