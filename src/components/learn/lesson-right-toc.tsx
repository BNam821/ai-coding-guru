'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownAnchorLink } from '@/components/markdown/markdown-anchor-link';
import { useLearnSidebarState } from './learn-sidebar-state';
import type { LearnTocItem } from '@/lib/learn-toc';

interface LessonRightTocProps {
    items: LearnTocItem[];
}

function resolveTocItems(items: LearnTocItem[]): LearnTocItem[] {
    return items.flatMap((item) => {
        const element = document.getElementById(item.id);

        if (!element || element.tagName !== 'H2') {
            return [];
        }

        return [item];
    });
}

export function LessonRightToc({ items }: LessonRightTocProps) {
    const { isSidebarCollapsed } = useLearnSidebarState();
    const resolvedItems = useMemo(() => resolveTocItems(items), [items]);
    const [activeId, setActiveId] = useState<string | null>(resolvedItems[0]?.id ?? null);

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

    return (
        <aside className="hidden lg:block lg:w-64 xl:w-72">
            <div className="sticky top-28">
                <div className="space-y-3 border-l border-white/10 pl-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">
                        Mục lục
                    </p>

                    <nav className="space-y-1.5" aria-label="Mục lục bài học">
                        {resolvedItems.map((item) => {
                            const isActive = activeId === item.id;

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
