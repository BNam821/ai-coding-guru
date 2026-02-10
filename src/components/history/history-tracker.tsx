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
        console.log(`[HistoryTracker] Component mounted for ${type}`, { isLoggedIn, data });

        const trackHistory = async () => {
            console.log(`[HistoryTracker] Executing track for ${type}...`);
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
                    console.log('[HistoryTracker] Saving to LocalStorage (Guest)');
                    localStorage.setItem('last_lesson_guest', JSON.stringify({
                        ...trackData,
                        viewed_at: new Date().toISOString()
                    }));
                }

                // API tracking (saves to DB if logged in, handles backup if server fails)
                try {
                    const response = await fetch('/api/learn/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(trackData),
                    });
                    const resData = await response.json();
                    console.log('[HistoryTracker] Lesson API Response:', resData);
                } catch (err) {
                    console.error('[HistoryTracker] Failed to track lesson history:', err);
                }
            } else if (type === 'wiki' && isLoggedIn) {
                // Only track wiki for logged in users
                try {
                    const response = await fetch('/api/wiki/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            post_slug: data.post_slug,
                            post_title: data.post_title
                        }),
                    });
                    const resData = await response.json();
                    console.log('[HistoryTracker] Wiki API Response:', resData);
                } catch (err) {
                    console.error('[HistoryTracker] Failed to track wiki history:', err);
                }
            }
        };

        // Tracking after 1 second
        const timer = setTimeout(trackHistory, 1000);
        return () => clearTimeout(timer);
    }, [type, isLoggedIn, data.lesson_id, data.post_slug]);

    return null;
}
