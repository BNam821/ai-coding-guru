import { isValidElement, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, Sparkles } from "lucide-react";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import type { MarkdownComponentOptions } from "./markdown-types";
import { MarkdownCodeBlock } from "./markdown-code-block";

function normalizeLanguage(rawLanguage?: string): string | undefined {
    if (!rawLanguage) {
        return undefined;
    }

    const normalized = rawLanguage.toLowerCase();

    if (normalized === "c++") return "cpp";
    if (normalized === "c#") return "csharp";
    if (normalized === "js") return "javascript";
    if (normalized === "md") return "markdown";
    if (normalized === "ts") return "typescript";
    if (normalized === "py") return "python";
    if (normalized === "sh") return "bash";

    return normalized;
}

function getLanguageLabel(language?: string): string {
    if (!language) {
        return "Text";
    }

    const labels: Record<string, string> = {
        bash: "Bash",
        c: "C",
        cpp: "C++",
        csharp: "C#",
        css: "CSS",
        html: "HTML",
        java: "Java",
        javascript: "JavaScript",
        json: "JSON",
        jsx: "JSX",
        markdown: "Markdown",
        php: "PHP",
        python: "Python",
        ruby: "Ruby",
        rust: "Rust",
        sql: "SQL",
        text: "Text",
        tsx: "TSX",
        typescript: "TypeScript",
        yaml: "YAML",
    };

    return labels[language] || language.toUpperCase();
}

function extractText(children: ReactNode): string {
    if (typeof children === "string") {
        return children;
    }

    if (typeof children === "number") {
        return String(children);
    }

    if (Array.isArray(children)) {
        return children.map(extractText).join("");
    }

    if (isValidElement(children)) {
        return extractText((children.props as { children?: ReactNode }).children);
    }

    return "";
}

export function createMarkdownComponents(options: MarkdownComponentOptions = {}): Components {
    const { imageComponent: ImageComponent, preserveWikiTips = false } = options;
    const calloutMeta = {
        info: {
            label: "Info",
            icon: <Info size={16} className="text-sky-300" />,
        },
        tip: {
            label: "Tip",
            icon: <Lightbulb size={16} className="text-emerald-300" />,
        },
        warning: {
            label: "Warning",
            icon: <AlertTriangle size={16} className="text-amber-300" />,
        },
        danger: {
            label: "Danger",
            icon: <AlertTriangle size={16} className="text-rose-300" />,
        },
        success: {
            label: "Success",
            icon: <CheckCircle2 size={16} className="text-green-300" />,
        },
    } as const;

    return {
        a: ({ href = "", children, className, ...props }) => {
            const linkClassName = cn("text-blue-400 no-underline transition-colors hover:text-blue-300", className);

            if (href.startsWith("/")) {
                return (
                    <Link href={href} className={linkClassName}>
                        {children}
                    </Link>
                );
            }

            if (href.startsWith("#")) {
                return (
                    <a href={href} className={linkClassName} {...props}>
                        {children}
                    </a>
                );
            }

            return (
                <a
                    href={href}
                    className={linkClassName}
                    target="_blank"
                    rel="noreferrer noopener"
                    {...props}
                >
                    {children}
                </a>
            );
        },
        blockquote: ({ className, children, ...props }) => (
            <blockquote
                className={cn(
                    "border-l-4 border-blue-500 bg-white/5 px-4 py-2 not-italic text-white/85",
                    className
                )}
                {...props}
            >
                {children}
            </blockquote>
        ),
        code: ({ className, children, ...props }) => {
            const isInline = !className?.includes("language-");

            if (isInline) {
                return (
                    <code className={cn("rounded-md", className)} {...props}>
                        {children}
                    </code>
                );
            }

            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        h1: ({ className, children, ...props }) => (
            <h1 className={cn("scroll-mt-24", className)} {...props}>
                {children}
            </h1>
        ),
        h2: ({ className, children, ...props }) => (
            <h2 className={cn("scroll-mt-24", className)} {...props}>
                {children}
            </h2>
        ),
        h3: ({ className, children, ...props }) => (
            <h3 className={cn("scroll-mt-24", className)} {...props}>
                {children}
            </h3>
        ),
        h4: ({ className, children, ...props }) => (
            <h4 className={cn("scroll-mt-24", className)} {...props}>
                {children}
            </h4>
        ),
        h5: ({ className, children, ...props }) => (
            <h5 className={cn("scroll-mt-24", className)} {...props}>
                {children}
            </h5>
        ),
        h6: ({ className, children, ...props }) => (
            <h6 className={cn("scroll-mt-24", className)} {...props}>
                {children}
            </h6>
        ),
        img: ({ className, ...props }) => {
            if (ImageComponent) {
                return <ImageComponent className={className} {...props} />;
            }

            // eslint-disable-next-line @next/next/no-img-element
            return <img className={cn("rounded-lg border border-white/10", className)} alt="" {...props} />;
        },
        p: ({ className, children, ...props }) => {
            const textContent = extractText(children).trim();

            if (preserveWikiTips && textContent.startsWith("//") && textContent.endsWith("//")) {
                const tipContent = textContent.slice(2, -2).trim();

                return (
                    <div className="glass-panel my-5 max-w-2xl rounded-lg border-l-2 border-accent-secondary bg-accent-secondary/5 px-4 py-2.5 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center gap-2.5">
                            <Sparkles size={16} className="shrink-0 text-accent-secondary" />
                            <div className="text-base leading-tight text-white/90 italic">
                                <span className="mr-2 text-sm font-bold uppercase tracking-tight text-accent-secondary">
                                    Mẹo:
                                </span>
                                <span>&quot;{tipContent}&quot;</span>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <p className={cn("mb-4 leading-relaxed last:mb-0", className)} {...props}>
                    {children}
                </p>
            );
        },
        ul: ({ className, children, ...props }) => (
            <ul className={cn("mb-4 ml-6 list-disc space-y-2 marker:text-white/65", className)} {...props}>
                {children}
            </ul>
        ),
        ol: ({ className, children, ...props }) => (
            <ol className={cn("mb-4 ml-6 list-decimal space-y-2 marker:text-white/65", className)} {...props}>
                {children}
            </ol>
        ),
        li: ({ className, children, ...props }) => {
            const hasCheckbox = isValidElement(children)
                ? children.type === "input"
                : Array.isArray(children) && children.some((child) => isValidElement(child) && child.type === "input");

            return (
                <li
                    className={cn(
                        hasCheckbox && "list-none ml-[-1.5rem] flex items-start gap-3 marker:content-none",
                        className
                    )}
                    {...props}
                >
                    {children}
                </li>
            );
        },
        input: ({ className, type, checked, disabled, ...props }) => {
            if (type === "checkbox") {
                return (
                    <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        className={cn(
                            "mt-1 h-4 w-4 shrink-0 rounded border border-white/40 bg-white/10 accent-emerald-400",
                            checked && "border-emerald-400/90 bg-emerald-400/15 shadow-[0_0_0_1px_rgba(74,222,128,0.35)]",
                            className
                        )}
                        {...props}
                    />
                );
            }

            return <input className={className} type={type} checked={checked} disabled={disabled} {...props} />;
        },
        pre: ({ children }) => {
            if (isValidElement(children)) {
                const childProps = children.props as { className?: string; children?: ReactNode };
                const code = extractText(childProps.children).replace(/\n$/, "");
                const languageMatch = childProps.className?.match(/language-([a-zA-Z0-9#+-]+)/);
                const language = normalizeLanguage(languageMatch?.[1]);

                return (
                    <MarkdownCodeBlock
                        code={code}
                        language={language}
                        languageLabel={getLanguageLabel(language)}
                        className={childProps.className}
                    >
                        {childProps.children}
                    </MarkdownCodeBlock>
                );
            }

            return <pre>{children}</pre>;
        },
        table: ({ className, children, ...props }) => (
            <div className="my-6 w-full overflow-x-auto">
                <table className={cn("w-full border-collapse border border-white/80", className)} {...props}>
                    {children}
                </table>
            </div>
        ),
        thead: ({ className, children, ...props }) => (
            <thead className={cn("bg-white/8", className)} {...props}>
                {children}
            </thead>
        ),
        tbody: ({ className, children, ...props }) => (
            <tbody className={cn("divide-y divide-white/80", className)} {...props}>
                {children}
            </tbody>
        ),
        tr: ({ className, children, ...props }) => (
            <tr className={cn("border-b border-white/80", className)} {...props}>
                {children}
            </tr>
        ),
        th: ({ className, children, ...props }) => (
            <th className={cn("border border-white/80 px-4 py-2 text-left font-semibold text-white", className)} {...props}>
                {children}
            </th>
        ),
        td: ({ className, children, ...props }) => (
            <td className={cn("border border-white/80 px-4 py-2 align-top text-white/90", className)} {...props}>
                {children}
            </td>
        ),
        div: ({ className, children, title, ...props }) => {
            const calloutType = Object.keys(calloutMeta).find((type) => className?.includes(`markdown-callout-${type}`));

            if (calloutType) {
                const meta = calloutMeta[calloutType as keyof typeof calloutMeta];

                return (
                    <div className={cn("markdown-callout", className)} {...props}>
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em]">
                            {meta.icon}
                            <span>{title || meta.label}</span>
                        </div>
                        <div className="space-y-3 text-white/85">
                            {children}
                        </div>
                    </div>
                );
            }

            return (
                <div className={className} {...props}>
                    {children}
                </div>
            );
        },
    };
}
