"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Megaphone, X } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { cn } from "@/lib/utils";
import type { SiteAnnouncement } from "@/lib/announcements";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
});

function formatAnnouncementTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Vừa cập nhật" : dateFormatter.format(date);
}

export function AnnouncementWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [logoSrc, setLogoSrc] = useState("/announcement_logo.png");

    useEffect(() => {
        let isMounted = true;

        const loadAnnouncements = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/announcements", { cache: "no-store" });
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || "Không thể tải thông báo");
                }

                if (isMounted) {
                    setAnnouncements(data.announcements || []);
                    setError(null);
                }
            } catch (loadError) {
                if (isMounted) {
                    setAnnouncements([]);
                    setError(loadError instanceof Error ? loadError.message : "Không thể tải thông báo");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadAnnouncements();

        const handleChanged = () => {
            void loadAnnouncements();
        };

        window.addEventListener("announcements:changed", handleChanged);

        return () => {
            isMounted = false;
            window.removeEventListener("announcements:changed", handleChanged);
        };
    }, []);

    return (
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <motion.section
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-3xl border border-white/12 bg-black/80 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div>
                                <p className="text-sm font-semibold text-white">Thông báo từ website</p>
                                <p className="text-xs text-white/45">Hiển thị 2 cập nhật mới nhất</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-full border border-white/10 p-2 text-white/60 transition-colors hover:border-white/20 hover:text-white"
                                aria-label="Đóng thông báo"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[24rem] space-y-3 overflow-y-auto px-4 py-4">
                            {isLoading ? (
                                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/60">
                                    Đang tải thông báo...
                                </div>
                            ) : error ? (
                                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-5 text-sm text-red-200">
                                    {error}
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/60">
                                    Chưa có thông báo nào từ quản trị viên.
                                </div>
                            ) : (
                                announcements.map((announcement, index) => (
                                    <article
                                        key={announcement.id}
                                        className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4"
                                    >
                                        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-accent-secondary/90">
                                            <Megaphone className="h-3.5 w-3.5" />
                                            <span>Thông báo {index + 1}</span>
                                        </div>
                                        <div className="prose prose-invert prose-sm max-w-none text-white/85">
                                            <MarkdownRenderer
                                                content={announcement.message}
                                                mode="safe"
                                                preserveWikiTips
                                            />
                                        </div>
                                        <p className="mt-3 text-xs text-white/40">
                                            Cập nhật: {formatAnnouncementTime(announcement.updated_at)}
                                        </p>
                                    </article>
                                ))
                            )}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                aria-label={isOpen ? "Ẩn thông báo" : "Mở thông báo"}
                className={cn(
                    "group relative flex h-16 w-16 items-center justify-center rounded-full border border-accent-secondary/35 bg-gradient-to-br from-accent-secondary to-accent-primary text-deep-space shadow-[0_18px_45px_rgba(0,223,154,0.35)] transition-transform duration-200 hover:scale-105",
                    isOpen && "scale-105"
                )}
            >
                <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white/15 shadow-inner">
                    <Image
                        src={logoSrc}
                        alt="Logo thông báo"
                        width={34}
                        height={34}
                        className="h-8 w-8 object-contain"
                        onError={() => setLogoSrc("/real_logo.png")}
                    />
                </span>
                <span className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)]" />
                <span className="absolute right-1.5 top-1.5 h-3.5 w-3.5 animate-ping rounded-full bg-red-400/70" />
            </button>
        </div>
    );
}
