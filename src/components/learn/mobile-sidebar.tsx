'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';
import { LearnSidebar } from './sidebar';
import type { CourseWithChapters } from '@/lib/learn-db';

export function MobileSidebar({ courses, isAdmin = false }: { courses: CourseWithChapters[]; isAdmin?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Drawer */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-white/10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <LearnSidebar courses={courses} isAdmin={isAdmin} />
                </div>
            </div>
        </>
    );
}
