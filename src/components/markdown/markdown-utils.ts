import GithubSlugger from "github-slugger";
import type { MarkdownHeading } from "./markdown-toc";

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
    const lines = content.split(/\r?\n/);
    const slugger = new GithubSlugger();
    const headings: MarkdownHeading[] = [];
    let inFence = false;

    for (const line of lines) {
        if (line.trimStart().startsWith("```")) {
            inFence = !inFence;
            continue;
        }

        if (inFence) {
            continue;
        }

        const match = /^(#{2,3})\s+(.*)$/.exec(line.trim());
        if (!match) {
            continue;
        }

        const depth = match[1].length;
        const rawText = match[2]
            .replace(/\[(.*?)\]\(.*?\)/g, "$1")
            .replace(/[*_`~]/g, "")
            .trim();

        if (!rawText) {
            continue;
        }

        headings.push({
            depth,
            text: rawText,
            slug: slugger.slug(rawText),
        });
    }

    return headings;
}
