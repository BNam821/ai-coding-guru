'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Clock, ArrowRight, Loader2 } from 'lucide-react';

interface WikiHistory {
    post_slug: string;
    post_title: string;
    viewed_at: string;
}

export function ReadArticles({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [history, setHistory] = useState<WikiHistory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/wiki/track');
                const data = await res.json();
                if (data.success) {
                    setHistory(data.history || []);
                }
                console.log('[ReadArticles] API Response:', data);
            } catch (err) {
                console.error('[ReadArticles] API Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [isLoggedIn]);

    if (!isLoggedIn) return null;

    return (
        <div className="pt-12 mt-12 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-accent-secondary" />
                    Bài viết đã đọc gần đây
                </h2>
                <Link href="/wiki" className="text-sm text-gray-500 hover:text-white transition-colors">
                    Xem tất cả bài viết
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
            ) : history.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {history.map((item) => (
                        <Link
                            key={item.post_slug}
                            href={`/wiki/${item.post_slug}`}
                            className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-accent-secondary/10 rounded-lg text-accent-secondary">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="text-white font-medium truncate group-hover:text-accent-secondary transition-colors">
                                        {item.post_title}
                                    </h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.viewed_at).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 rounded-xl border border-dashed border-white/10 bg-white/5">
                    <p className="text-gray-500 text-sm italic">Bạn chưa đọc bài viết nào gần đây.</p>
                </div>
            )}
        </div>
    );
}
