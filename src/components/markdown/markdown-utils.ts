import type { MarkdownHeading } from "./markdown-toc";

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
    const lines = content.split(/\r?\n/);
    const slugCounts = new Map<string, number>();
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

        const baseSlug = slugify(rawText);
        const count = slugCounts.get(baseSlug) || 0;
        slugCounts.set(baseSlug, count + 1);

        headings.push({
            depth,
            text: rawText,
            slug: count === 0 ? baseSlug : `${baseSlug}-${count}`,
        });
    }

    return headings;
}
