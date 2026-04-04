const LEARN_TOC_MARKER_PATTERN = /<!--\s*learn-toc\s*-->/gi;
const LEARN_TOC_MARKER_SINGLE_PATTERN = /<!--\s*learn-toc\s*-->/i;
const HEADING_PATTERN = /^\s{0,3}(#{1,6})\s+(.+?)\s*$/;
const MARKDOWN_LINK_ITEM_PATTERN = /^\s*(?:[-*+]|\d+\.)\s+\[([^\]]+)\]\((#[^)]+)\)\s*$/;
const EXPLICIT_HEADING_ID_PATTERN = /\s*\{#([A-Za-z0-9\-_:]+)\}\s*$/;
const FENCE_START_PATTERN = /^\s{0,3}(`{3,}|~{3,})/;

export interface LearnTocItem {
    id: string;
    href: string;
    label: string;
}

export interface LearnLessonSection {
    id: string;
    heading: string;
    content: string;
    index: number;
}

export interface ParsedLearnLessonContent {
    content: string;
    intro: string;
    sections: LearnLessonSection[];
    tocItems: LearnTocItem[];
    hasMarkedToc: boolean;
}

function cleanHeadingText(value: string) {
    return value
        .replace(EXPLICIT_HEADING_ID_PATTERN, '')
        .replace(/\s+#+\s*$/, '')
        .trim();
}

function normalizeHeadingText(value: string) {
    return cleanHeadingText(value)
        .toLowerCase();
}

function cleanContent(content: string) {
    return content.replace(LEARN_TOC_MARKER_PATTERN, '').replace(/\n{3,}/g, '\n\n');
}

function trimBlankLines(value: string) {
    return value.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '').trim();
}

function slugifyHeading(value: string) {
    const normalized = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return normalized;
}

function getFenceToken(line: string) {
    const match = line.match(FENCE_START_PATTERN);
    return match?.[1] || null;
}

function isFenceClosingLine(line: string, fenceToken: string) {
    const fenceChar = fenceToken[0];
    const minimumLength = fenceToken.length;
    const closingPattern = new RegExp(`^\\s{0,3}${fenceChar}{${minimumLength},}\\s*$`);

    return closingPattern.test(line);
}

function getUniqueSectionId(baseId: string, seenIds: Map<string, number>, fallbackIndex: number) {
    const normalizedBase = baseId || `section-${fallbackIndex}`;
    const count = seenIds.get(normalizedBase) || 0;

    seenIds.set(normalizedBase, count + 1);

    if (count === 0) {
        return normalizedBase;
    }

    return `${normalizedBase}-${count + 1}`;
}

function splitLearnLessonSections(content: string): Pick<ParsedLearnLessonContent, 'intro' | 'sections'> {
    const lines = content.split(/\r?\n/);
    const sections: LearnLessonSection[] = [];
    const seenIds = new Map<string, number>();
    const introLines: string[] = [];

    let currentSectionLines: string[] | null = null;
    let currentHeading = '';
    let currentSectionId = '';
    let currentFenceToken: string | null = null;

    const flushCurrentSection = () => {
        if (!currentSectionLines) {
            return;
        }

        const sectionContent = trimBlankLines(currentSectionLines.join('\n'));

        if (!sectionContent) {
            currentSectionLines = null;
            currentHeading = '';
            currentSectionId = '';
            return;
        }

        sections.push({
            id: currentSectionId || `section-${sections.length + 1}`,
            heading: currentHeading,
            content: sectionContent,
            index: sections.length + 1,
        });

        currentSectionLines = null;
        currentHeading = '';
        currentSectionId = '';
    };

    for (const line of lines) {
        const possibleFenceToken = getFenceToken(line);

        if (currentFenceToken) {
            if (possibleFenceToken && possibleFenceToken[0] === currentFenceToken[0] && isFenceClosingLine(line, currentFenceToken)) {
                currentFenceToken = null;
            }
        } else if (possibleFenceToken) {
            currentFenceToken = possibleFenceToken;
        }

        const headingMatch = !currentFenceToken ? line.match(HEADING_PATTERN) : null;
        const headingLevel = headingMatch?.[1] || '';

        if (headingMatch && headingLevel === '##') {
            flushCurrentSection();

            const rawHeading = headingMatch[2] || '';
            const explicitIdMatch = rawHeading.match(EXPLICIT_HEADING_ID_PATTERN);
            const heading = cleanHeadingText(rawHeading);
            const baseId = explicitIdMatch?.[1]?.trim() || slugifyHeading(heading);

            currentHeading = heading;
            currentSectionId = getUniqueSectionId(baseId, seenIds, sections.length + 1);
            currentSectionLines = [line];
            continue;
        }

        if (currentSectionLines) {
            currentSectionLines.push(line);
            continue;
        }

        introLines.push(line);
    }

    flushCurrentSection();

    return {
        intro: trimBlankLines(introLines.join('\n')),
        sections,
    };
}

export function parseLearnLessonContent(content: string): ParsedLearnLessonContent {
    const cleanedContent = cleanContent(content);
    const sectionData = splitLearnLessonSections(cleanedContent);
    const markerMatch = LEARN_TOC_MARKER_SINGLE_PATTERN.exec(content);

    if (!markerMatch || typeof markerMatch.index !== 'number') {
        return {
            content: cleanedContent,
            intro: sectionData.intro,
            sections: sectionData.sections,
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
            intro: sectionData.intro,
            sections: sectionData.sections,
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
        intro: sectionData.intro,
        sections: sectionData.sections,
        tocItems,
        hasMarkedToc: true,
    };
}
