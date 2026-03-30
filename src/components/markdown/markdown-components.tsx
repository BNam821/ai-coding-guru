import { isValidElement, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, Sparkles } from "lucide-react";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import type { MarkdownComponentOptions } from "./markdown-types";
import { MarkdownCodeBlock } from "./markdown-code-block";

function extractText(children: ReactNode): string {
    if (typeof children === "string") {
        return children;
    }

    if (Array.isArray(children)) {
        return children.map(extractText).join("");
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
        pre: ({ children }) => {
            if (isValidElement(children)) {
                const childProps = children.props as { className?: string; children?: ReactNode };
                const code = extractText(childProps.children).replace(/\n$/, "");
                const language = childProps.className?.replace(/^language-/, "").split(" ")[0];

                return (
                    <MarkdownCodeBlock
                        code={code}
                        language={language}
                        className={childProps.className}
                    />
                );
            }

            return <pre>{children}</pre>;
        },
        table: ({ className, children, ...props }) => (
            <div className="my-6 w-full overflow-x-auto">
                <table className={cn("w-full border-collapse", className)} {...props}>
                    {children}
                </table>
            </div>
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
