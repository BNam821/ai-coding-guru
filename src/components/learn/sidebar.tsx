'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseWithChapters } from '@/lib/learn-db';
import { AddCourseButton, EditCourseButton } from './course-actions';

interface LearnSidebarProps {
    courses: CourseWithChapters[];
    isAdmin?: boolean;
}

export function LearnSidebar({ courses, isAdmin = false }: LearnSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-full md:w-64 shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-md hidden md:block h-[calc(100vh-6rem)] sticky top-24 overflow-y-auto">
            <div className="p-4 space-y-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 px-2">
                    Học Tập
                </h2>

                <div className="space-y-2">
                    {courses.map((course) => (
                        <CourseItem
                            key={course.id}
                            course={course}
                            pathname={pathname}
                            isAdmin={isAdmin}
                        />
                    ))}

                    {/* Admin: Add Course Button */}
                    {isAdmin && (
                        <div className="pt-2">
                            <AddCourseButton />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

function CourseItem({
    course,
    pathname,
    isAdmin
}: {
    course: CourseWithChapters;
    pathname: string;
    isAdmin: boolean;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const isActive = pathname.startsWith(`/learn/${course.slug}`);

    return (
        <div className="space-y-1">
            <div className="flex items-center group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center flex-1 p-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/5",
                        isActive ? "text-blue-400" : "text-gray-400"
                    )}
                >
                    {isOpen ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    <span className="truncate">{course.title}</span>
                </button>

                {/* Admin: Edit Button */}
                {isAdmin && (
                    <EditCourseButton
                        course={{
                            id: course.id,
                            title: course.title,
                            description: course.description || undefined
                        }}
                    />
                )}
            </div>

            {isOpen && (
                <div className="ml-4 space-y-1 border-l border-white/10 pl-2">
                    {course.chapters.map((chapter) => (
                        <div key={chapter.id} className="space-y-1">
                            <div className="flex items-center px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                                {chapter.title}
                            </div>
                            {chapter.lessons?.map((lesson) => {
                                const href = `/learn/${course.slug}/${lesson.slug}`;
                                const isLessonActive = pathname === href;

                                return (
                                    <Link
                                        key={lesson.id}
                                        href={href}
                                        className={cn(
                                            "flex items-center px-2 py-1.5 text-sm rounded-md transition-colors",
                                            isLessonActive
                                                ? "bg-blue-500/10 text-blue-400"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <FileText className="w-3 h-3 mr-2 opacity-70" />
                                        <span className="truncate">{lesson.title}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

