"use client";

import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";

export function AuthRequiredBanner() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="relative z-20 mx-auto mb-6 w-full max-w-4xl px-4 pt-24 sm:pt-28">
            <div className="flex items-start justify-between gap-4 rounded-[1.75rem] border border-amber-300/20 bg-black/45 px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-200">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200/80">Yêu cầu đăng nhập</p>
                        <p className="mt-1 text-lg font-semibold text-white">Bạn chưa đăng nhập</p>
                        <p className="mt-1 text-sm text-white/60">Hãy đăng nhập để truy cập trang tổng quan và đồng bộ tiến trình học tập của bạn.</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsVisible(false)}
                    className="rounded-full border border-white/10 p-2 text-white/55 transition-colors hover:border-white/20 hover:text-white"
                    aria-label="Đóng thông báo"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
