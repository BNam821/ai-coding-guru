'use client';

import { useEffect } from 'react';

interface HistoryTrackerProps {
    type: 'lesson' | 'wiki';
    data: {
        lesson_id?: string;
        course_slug?: string;
        lesson_slug?: string;
        lesson_title?: string;
        post_slug?: string;
        post_title?: string;
    };
    isLoggedIn: boolean;
}

export function HistoryTracker({ type, data, isLoggedIn }: HistoryTrackerProps) {
    useEffect(() => {
        const trackHistory = async () => {
            if (type === 'lesson') {
                // Hybrid track for lessons
                const trackData = {
                    lesson_id: data.lesson_id,
                    course_slug: data.course_slug,
                    lesson_slug: data.lesson_slug,
                    lesson_title: data.lesson_title
                };

                // Guest tracking
                if (!isLoggedIn) {
                    localStorage.setItem('last_lesson_guest', JSON.stringify({
                        ...trackData,
                        viewed_at: new Date().toISOString()
                    }));
                }

                // API tracking (will only save to DB if logged in)
                try {
                    await fetch('/api/learn/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(trackData),
                    });
                } catch (err) {
                    console.error('Failed to track lesson history:', err);
                }
            } else if (type === 'wiki' && isLoggedIn) {
                // Only track wiki for logged in users
                try {
                    await fetch('/api/wiki/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            post_slug: data.post_slug,
                            post_title: data.post_title
                        }),
                    });
                } catch (err) {
                    console.error('Failed to track wiki history:', err);
                }
            }
        };

        // Delay tracking slightly to avoid unnecessary calls on quick scrolls/clicks
        const timer = setTimeout(trackHistory, 3000);
        return () => clearTimeout(timer);
    }, [type, data, isLoggedIn]);

    return null; // Invisible component
}
