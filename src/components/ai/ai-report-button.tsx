"use client";

import { useEffect, useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const REPORT_CONFIRM_MESSAGE = "Nội dung của AI tạo có vấn đề sao?\n Hãy dừng lại và gửi thông tin cho chúng tôi.";

interface AiReportButtonProps {
    interactionId?: string | null;
    source: string;
    initialReported?: boolean;
    className?: string;
    hideWhenUnavailable?: boolean;
}

type ReportStatus = "idle" | "loading" | "reported" | "error";

export function AiReportButton({
    interactionId,
    source,
    initialReported = false,
    className,
    hideWhenUnavailable = false,
}: AiReportButtonProps) {
    const [status, setStatus] = useState<ReportStatus>(initialReported ? "reported" : "idle");

    useEffect(() => {
        setStatus(initialReported ? "reported" : "idle");
    }, [initialReported, interactionId]);

    if (!interactionId && hideWhenUnavailable) {
        return null;
    }

    const disabled = !interactionId || status === "loading" || status === "reported";

    const handleReport = async () => {
        if (!interactionId || disabled) {
            return;
        }

        if (!window.confirm(REPORT_CONFIRM_MESSAGE)) {
            return;
        }

        setStatus("loading");

        try {
            const response = await fetch("/api/ai/logs/report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    interactionId,
                    source,
                }),
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || "Không thể gửi báo cáo lúc này.");
            }

            setStatus("reported");
        } catch (_error) {
            setStatus("error");
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <button
                type="button"
                onClick={handleReport}
                disabled={disabled}
                className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors",
                    disabled
                        ? "cursor-not-allowed border-red-400/10 bg-red-500/5 text-red-200/45"
                        : "border-red-400/30 bg-red-500/12 text-red-100 hover:bg-red-500/18",
                )}
            >
                {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                {status === "reported" ? "Đã báo cáo" : "Báo cáo"}
            </button>

            {status === "reported" ? (
                <p className="text-xs text-red-100/80">Báo cáo đã được ghi nhận để đội ngũ kiểm tra.</p>
            ) : null}

            {status === "error" ? (
                <p className="text-xs text-red-200/80">Chưa gửi được báo cáo. Vui lòng thử lại.</p>
            ) : null}

            {!interactionId && status !== "error" ? (
                <p className="text-xs text-red-100/70">
                    Chưa tìm thấy log AI tương ứng để gửi báo cáo ngay lúc này.
                </p>
            ) : null}
        </div>
    );
}
