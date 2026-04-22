"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AiLogCleanupButton() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    const handleCleanup = async () => {
        try {
            setIsSubmitting(true);
            setMessage(null);
            setIsError(false);

            const response = await fetch("/api/ai/logs/cleanup", {
                method: "POST",
            });
            const payload = await response.json();

            if (!response.ok || !payload.success) {
                throw new Error(payload.error || "Khong the don dep AI logs luc nay.");
            }

            setMessage(`Da xoa ${payload.deletedCount || 0} log het han.`);
            router.refresh();
        } catch (error) {
            setIsError(true);
            setMessage(error instanceof Error ? error.message : "Khong the don dep AI logs luc nay.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={handleCleanup}
                disabled={isSubmitting}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? "Dang cleanup..." : "Cleanup log het han"}
            </button>
            {message ? (
                <p className={`text-sm ${isError ? "text-rose-200" : "text-emerald-200"}`}>
                    {message}
                </p>
            ) : null}
        </div>
    );
}
