'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownAnchorLink } from '@/components/markdown/markdown-anchor-link';
import { useLearnSidebarState } from './learn-sidebar-state';
import type { LearnTocItem } from '@/lib/learn-toc';

interface LessonRightTocProps {
    items: LearnTocItem[];
}

function normalizeHeadingLabel(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^\s*\d+[\.\)\-:]*\s*/, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function resolveTocItems(items: LearnTocItem[]): LearnTocItem[] {
    return items.flatMap((item) => {
        const exactMatch = document.getElementById(item.id);

        if (exactMatch?.tagName === 'H2') {
            return [item];
        }

        const normalizedLabel = normalizeHeadingLabel(item.label);
        const headingByLabel = Array.from(document.querySelectorAll('h2[id]')).find((heading) => {
            return normalizeHeadingLabel(heading.textContent || '') === normalizedLabel;
        });

        if (!headingByLabel || !(headingByLabel instanceof HTMLElement)) {
            return [];
        }

        return [{
            ...item,
            id: headingByLabel.id,
            href: `#${headingByLabel.id}`,
        }];
    });
}

export function LessonRightToc({ items }: LessonRightTocProps) {
    const { isSidebarCollapsed } = useLearnSidebarState();
    const [resolvedItems, setResolvedItems] = useState<LearnTocItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [panelStyle, setPanelStyle] = useState<{ left: number; width: number } | null>(null);
    const containerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        let frameId = 0;

        const syncItems = () => {
            setResolvedItems(resolveTocItems(items));
        };

        frameId = window.requestAnimationFrame(syncItems);

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [items]);

    useEffect(() => {
        if (!isSidebarCollapsed) {
            return;
        }

        let frameId = 0;

        const syncPanelPosition = () => {
            const container = containerRef.current;

            if (!container) {
                return;
            }

            const rect = container.getBoundingClientRect();

            setPanelStyle((current) => {
                if (current && current.left === rect.left && current.width === rect.width) {
                    return current;
                }

                return {
                    left: rect.left,
                    width: rect.width,
                };
            });
        };

        const scheduleSync = () => {
            window.cancelAnimationFrame(frameId);
            frameId = window.requestAnimationFrame(syncPanelPosition);
        };

        const resizeObserver = new ResizeObserver(scheduleSync);

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        scheduleSync();
        window.addEventListener('resize', scheduleSync);
        window.addEventListener('scroll', scheduleSync, { passive: true });

        return () => {
            window.cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', scheduleSync);
            window.removeEventListener('scroll', scheduleSync);
        };
    }, [isSidebarCollapsed]);

    useEffect(() => {
        if (!isSidebarCollapsed || resolvedItems.length === 0) {
            return;
        }

        const headings = resolvedItems
            .map((item) => document.getElementById(item.id))
            .filter((element): element is HTMLElement => element instanceof HTMLElement);

        if (headings.length === 0) {
            return;
        }

        const updateActiveHeading = () => {
            const visibleHeadings = headings
                .map((heading) => ({
                    id: heading.id,
                    top: heading.getBoundingClientRect().top,
                }))
                .filter((heading) => heading.top <= 220)
                .sort((left, right) => right.top - left.top);

            if (visibleHeadings[0]) {
                setActiveId(visibleHeadings[0].id);
                return;
            }

            setActiveId(headings[0]?.id ?? null);
        };

        const observer = new IntersectionObserver(
            () => {
                updateActiveHeading();
            },
            {
                rootMargin: '-120px 0px -55% 0px',
                threshold: [0, 0.25, 0.5, 1],
            }
        );

        headings.forEach((heading) => observer.observe(heading));
        updateActiveHeading();

        return () => {
            observer.disconnect();
        };
    }, [isSidebarCollapsed, resolvedItems]);

    if (!isSidebarCollapsed || resolvedItems.length === 0) {
        return null;
    }

    const currentActiveId = activeId ?? resolvedItems[0]?.id ?? null;

    return (
        <aside ref={containerRef} className="hidden lg:block lg:w-64 xl:w-72">
            <div
                className="space-y-3 border-l border-white/10 pl-5"
                style={panelStyle ? {
                    position: 'fixed',
                    top: '7rem',
                    left: `${panelStyle.left}px`,
                    width: `${panelStyle.width}px`,
                    maxHeight: 'calc(100vh - 8.5rem)',
                    overflowY: 'auto',
                } : undefined}
            >
                <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">
                        Nội dung bài học
                    </p>

                    <nav className="space-y-1.5" aria-label="Mục lục bài học">
                        {resolvedItems.map((item) => {
                            const isActive = currentActiveId === item.id;

                            return (
                                <MarkdownAnchorLink
                                    key={item.id}
                                    href={item.href}
                                    className={cn(
                                        'relative block text-sm leading-6 transition-colors',
                                        isActive ? 'font-bold text-white' : 'text-white/45 hover:text-white/80'
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'absolute -left-5 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-opacity',
                                            isActive ? 'bg-accent-primary opacity-100' : 'bg-white/20 opacity-0'
                                        )}
                                    />
                                    {item.label}
                                </MarkdownAnchorLink>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </aside>
    );
}
