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
    const { lesson_id, course_slug, lesson_slug, lesson_title, post_slug, post_title } = data;

    useEffect(() => {
        console.log(`[HistoryTracker] Component mounted for ${type}`, { isLoggedIn, data });

        const trackHistory = async () => {
            console.log(`[HistoryTracker] Executing track for ${type}...`);
            if (type === 'lesson') {
                // Hybrid track for lessons
                const trackData = {
                    lesson_id,
                    course_slug,
                    lesson_slug,
                    lesson_title
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
                            post_slug,
                            post_title
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
        
        let cleanupObserver: (() => void) | undefined;

        if (type === 'lesson') {
            // Add slight delay to ensure DOM is fully parsed
            const setupObserverTimeout = setTimeout(() => {
                const headings = Array.from(document.querySelectorAll('h2[id]'));
                if (headings.length > 0 && isLoggedIn) {
                    const seenHeadings = new Set<string>();
                    let maxProgress = 0;
                    let trackTimeout: NodeJS.Timeout | null = null;
                    
                    const updateProgress = () => {
                        const currentProgress = (seenHeadings.size / headings.length) * 100;
                        if (currentProgress > maxProgress) {
                            maxProgress = currentProgress;
                            
                            if (trackTimeout) clearTimeout(trackTimeout);
                            trackTimeout = setTimeout(() => {
                                fetch('/api/learn/track', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        lesson_id,
                                        course_slug,
                                        lesson_slug,
                                        lesson_title,
                                        progress_percent: maxProgress
                                    }),
                                }).catch(err => console.error('[HistoryTracker] Failed to update progress:', err));
                            }, 2000);
                        }
                    };

                    const observer = new IntersectionObserver((entries) => {
                        let changed = false;
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                seenHeadings.add(entry.target.id);
                                changed = true;
                            }
                        });
                        if (changed) updateProgress();
                    }, {
                        rootMargin: '-10% 0px -50% 0px',
                        threshold: 0
                    });

                    headings.forEach(h => observer.observe(h));
                    
                    cleanupObserver = () => {
                        observer.disconnect();
                        if (trackTimeout) clearTimeout(trackTimeout);
                    };
                }
            }, 500);

            const oldCleanup = cleanupObserver;
            cleanupObserver = () => {
                clearTimeout(setupObserverTimeout);
                if (oldCleanup) oldCleanup();
            };
        }

        return () => {
            clearTimeout(timer);
            if (cleanupObserver) cleanupObserver();
        };
    }, [type, isLoggedIn, data, lesson_id, course_slug, lesson_slug, lesson_title, post_slug, post_title]);

    return null;
}
