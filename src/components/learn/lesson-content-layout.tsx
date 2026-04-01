'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useLearnSidebarState } from './learn-sidebar-state';
import type { LearnTocItem } from '@/lib/learn-toc';

const LessonRightToc = dynamic(
    () => import('./lesson-right-toc').then((module) => module.LessonRightToc),
    { ssr: false }
);

interface LessonContentLayoutProps {
    tocItems: LearnTocItem[];
    children: React.ReactNode;
}

export function LessonContentLayout({ tocItems, children }: LessonContentLayoutProps) {
    const { isSidebarCollapsed } = useLearnSidebarState();
    const showRightToc = isSidebarCollapsed && tocItems.length > 0;

    return (
        <div
            className={cn(
                'relative z-10 w-full',
                showRightToc && 'lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-12'
            )}
        >
            <div className={cn('min-w-0', showRightToc && 'lg:max-w-3xl xl:max-w-4xl')}>
                {children}
            </div>

            <LessonRightToc items={tocItems} />
        </div>
    );
}
