import type { Components } from "react-markdown";
import type { ComponentType } from "react";

export type MarkdownRenderMode = "lite" | "safe" | "full";

export interface MarkdownComponentOptions {
    imageComponent?: ComponentType<any>;
    preserveWikiTips?: boolean;
}

export interface MarkdownRendererProps extends MarkdownComponentOptions {
    content: string;
    mode?: MarkdownRenderMode;
    className?: string;
    components?: Components;
    showToc?: boolean;
}
