"use client";

import { Share2, Bookmark, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function ArticleActions({ slug }: { slug: string }) {
    const [isSaved, setIsSaved] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkSavedStatus = async () => {
            try {
                const res = await fetch("/api/wiki/save");
                const data = await res.json();
                if (data.success) {
                    setIsSaved(data.saved_posts.includes(slug));
                }
            } catch (err) {
                console.error("Failed to check saved status:", err);
            }
        };
        checkSavedStatus();
    }, [slug]);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            alert("Không thể sao chép liên kết.");
        }
    };

    const handleSave = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const method = isSaved ? "DELETE" : "POST";
            const url = isSaved ? `/api/wiki/save?slug=${slug}` : "/api/wiki/save";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: isSaved ? null : JSON.stringify({ slug }),
            });
            const data = await res.json();
            if (data.success) {
                setIsSaved(!isSaved);
            } else if (data.error === "Unauthorized") {
                alert("Vui lòng đăng nhập để lưu bài viết.");
            }
        } catch (err) {
            console.error("Failed to toggle save status:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4 pt-12 border-t border-white/5">
            <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent-secondary/30 transition-all text-sm font-bold text-white/90"
            >
                {isCopied ? (
                    <>
                        <Check size={16} className="text-accent-secondary" />
                        Đã sao chép
                    </>
                ) : (
                    <>
                        <Share2 size={16} className="text-accent-secondary" />
                        Chia sẻ
                    </>
                )}
            </button>
            <button
                onClick={handleSave}
                disabled={loading}
                className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl border transition-all text-sm font-bold disabled:opacity-50",
                    isSaved
                        ? "bg-accent-primary/20 border-accent-primary text-accent-primary shadow-[0_0_15px_rgba(255,0,163,0.2)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-accent-primary/30 text-white/90"
                )}
            >
                <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
                {isSaved ? "Đã lưu kho" : "Lưu bài viết"}
            </button>
        </div>
    );
}
