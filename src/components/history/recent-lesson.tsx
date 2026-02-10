'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlayCircle, Loader2 } from 'lucide-react';

interface RecentLessonData {
    lesson_title: string;
    course_slug: string;
    lesson_slug: string;
}

export function RecentLesson({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [lesson, setLesson] = useState<RecentLessonData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            let foundData = null;

            if (isLoggedIn) {
                try {
                    const res = await fetch('/api/learn/track');
                    const data = await res.json();
                    if (data.success && data.history && data.history.length > 0) {
                        foundData = data.history[0];
                        console.log('[RecentLesson] API Data found (latest):', foundData);
                    }
                    console.log('[RecentLesson] API Response:', data);
                } catch (err) {
                    console.error('[RecentLesson] API Error:', err);
                }
            }

            // Fallback to local storage if API didn't return anything or not logged in
            if (!foundData) {
                const local = localStorage.getItem('last_lesson_guest');
                console.log('[RecentLesson] Checking Local Storage Fallback:', local);
                if (local) {
                    try {
                        foundData = JSON.parse(local);
                    } catch (e) {
                        localStorage.removeItem('last_lesson_guest');
                    }
                }
            }

            setLesson(foundData);
            setLoading(false);
        };

        fetchRecent();
    }, [isLoggedIn]);

    if (loading) return null;
    if (!lesson) return null;

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <Link
                href={`/learn/${lesson.course_slug}/${lesson.lesson_slug}`}
                className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-bold transition-all group"
            >
                <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Tiếp tục học: <span className="text-white ml-1">{lesson.lesson_title}</span></span>
            </Link>
        </div>
    );
}
