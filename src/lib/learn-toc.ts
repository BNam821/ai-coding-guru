const LEARN_TOC_MARKER_PATTERN = /<!--\s*learn-toc\s*-->/gi;
const LEARN_TOC_MARKER_SINGLE_PATTERN = /<!--\s*learn-toc\s*-->/i;
const HEADING_PATTERN = /^\s{0,3}(#{1,6})\s+(.+?)\s*$/;
const MARKDOWN_LINK_ITEM_PATTERN = /^\s*(?:[-*+]|\d+\.)\s+\[([^\]]+)\]\((#[^)]+)\)\s*$/;

export interface LearnTocItem {
    id: string;
    href: string;
    label: string;
}

export interface ParsedLearnLessonContent {
    content: string;
    tocItems: LearnTocItem[];
    hasMarkedToc: boolean;
}

function normalizeHeadingText(value: string) {
    return value
        .replace(/\s*\{#([A-Za-z0-9\-_:]+)\}\s*$/, '')
        .trim()
        .toLowerCase();
}

function cleanContent(content: string) {
    return content.replace(LEARN_TOC_MARKER_PATTERN, '').replace(/\n{3,}/g, '\n\n');
}

export function parseLearnLessonContent(content: string): ParsedLearnLessonContent {
    const cleanedContent = cleanContent(content);
    const markerMatch = LEARN_TOC_MARKER_SINGLE_PATTERN.exec(content);

    if (!markerMatch || typeof markerMatch.index !== 'number') {
        return {
            content: cleanedContent,
            tocItems: [],
            hasMarkedToc: false,
        };
    }

    const afterMarker = content.slice(markerMatch.index + markerMatch[0].length);
    const lines = afterMarker.split(/\r?\n/);
    let index = 0;

    while (index < lines.length && lines[index]?.trim() === '') {
        index += 1;
    }

    const headingLine = lines[index];
    const headingMatch = headingLine?.match(HEADING_PATTERN);

    if (!headingMatch || normalizeHeadingText(headingMatch[2] || '') !== 'mục lục') {
        return {
            content: cleanedContent,
            tocItems: [],
            hasMarkedToc: true,
        };
    }

    index += 1;

    while (index < lines.length && lines[index]?.trim() === '') {
        index += 1;
    }

    const tocItems: LearnTocItem[] = [];

    while (index < lines.length) {
        const line = lines[index] || '';
        const trimmed = line.trim();

        if (!trimmed) {
            if (tocItems.length > 0) {
                index += 1;
                continue;
            }

            index += 1;
            continue;
        }

        const linkMatch = line.match(MARKDOWN_LINK_ITEM_PATTERN);

        if (!linkMatch) {
            break;
        }

        const href = linkMatch[2]?.trim() || '';

        if (href.startsWith('#')) {
            tocItems.push({
                href,
                id: decodeURIComponent(href.slice(1)),
                label: linkMatch[1]?.trim() || href,
            });
        }

        index += 1;
    }

    return {
        content: cleanedContent,
        tocItems,
        hasMarkedToc: true,
    };
}
