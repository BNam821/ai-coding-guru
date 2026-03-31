import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize from "rehype-sanitize";
import type { PluggableList } from "unified";
import { cn } from "@/lib/utils";
import { createMarkdownComponents } from "./markdown-components";
import type { MarkdownRenderMode, MarkdownRendererProps } from "./markdown-types";
import { markdownSanitizeSchema } from "./markdown-sanitize-schema";
import { remarkCallouts } from "./markdown-remark-callouts";

function getRehypePlugins(mode: MarkdownRenderMode): PluggableList {
    const sharedPlugins: PluggableList = [
        [rehypeSanitize, markdownSanitizeSchema],
        [rehypeKatex, { output: "html" }],
        rehypeHighlight,
    ];

    if (mode === "lite") {
        return [[rehypeSanitize, markdownSanitizeSchema]];
    }

    if (mode === "safe") {
        return sharedPlugins;
    }

    return [
        rehypeSlug,
        [rehypeAutolinkHeadings, {
            behavior: "append",
            properties: {
                className: ["markdown-heading-anchor"],
                ariaLabel: "Link to section",
                tabIndex: -1,
            },
        }],
        ...sharedPlugins,
    ];
}

export function MarkdownRenderer({
    content,
    mode = "safe",
    className,
    components,
    imageComponent,
    preserveWikiTips = false,
}: MarkdownRendererProps) {
    const mergedComponents = {
        ...createMarkdownComponents({
            imageComponent,
            preserveWikiTips,
        }),
        ...components,
    };

    return (
        <div className={cn("markdown-content", className)}>
            <ReactMarkdown
                remarkPlugins={mode === "lite" ? [remarkGfm] : [remarkGfm, remarkMath, remarkDirective, remarkCallouts]}
                rehypePlugins={getRehypePlugins(mode)}
                components={mergedComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
