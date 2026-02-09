"use client";

import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
    /** Custom message to display, defaults to "Đang tải..." */
    message?: string;
    /** Full screen mode (min-h-screen) or inline mode (min-h-[400px]) */
    fullScreen?: boolean;
}

/**
 * Unified loading component for consistent UX across the app.
 * Uses GPU-accelerated animations for smooth performance.
 */
export function LoadingScreen({
    message = "Đang tải...",
    fullScreen = false
}: LoadingScreenProps) {
    return (
        <div
            className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[400px]"
                }`}
        >
            <div className="flex flex-col items-center gap-4">
                {/* GPU-accelerated spin animation */}
                <Loader2
                    size={48}
                    className="animate-spin text-accent-secondary will-change-transform"
                />
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
                    {message}
                </p>
            </div>
        </div>
    );
}
