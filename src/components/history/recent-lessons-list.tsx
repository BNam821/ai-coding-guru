'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight, Loader2 } from 'lucide-react';

interface LessonHistory {
    lesson_id: string;
    course_slug: string;
    lesson_slug: string;
    lesson_title: string;
    updated_at: string;
}

export function RecentLessonsList({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [history, setHistory] = useState<LessonHistory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            if (isLoggedIn) {
                setLoading(true);
                try {
                    const res = await fetch('/api/learn/track?limit=6');
                    const data = await res.json();
                    if (data.success) {
                        setHistory(data.history || []);
                    }
                } catch (err) {
                    console.error('[RecentLessonsList] Failed to fetch history', err);
                } finally {
                    setLoading(false);
                }
            } else {
                // For guests, we only have one last lesson tracked in the previous logic
                // But we can try to find if there's any local storage for multiple ones if we implemented it.
                // For now, let's just stick to the single one or empty for guest.
                const local = localStorage.getItem('last_lesson_guest');
                if (local) {
                    try {
                        setHistory([JSON.parse(local)]);
                    } catch (e) { }
                }
            }
        };

        fetchHistory();
    }, [isLoggedIn]);

    if (!isLoggedIn && history.length === 0) return null;

    return (
        <div className="pt-12 mt-12 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                    Bài học đã xem gần đây
                </h2>
                <Link href="/history" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 group">
                    Xem tất cả <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
            ) : history.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {history.map((item) => (
                        <Link
                            key={item.lesson_id}
                            href={`/learn/${item.course_slug}/${item.lesson_slug}`}
                            className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors capitalize">
                                        {item.lesson_title}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.updated_at).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 rounded-xl border border-dashed border-white/10 bg-white/5">
                    <p className="text-gray-500 text-sm italic">Bạn chưa xem bài học nào gần đây.</p>
                </div>
            )}
        </div>
    );
}
