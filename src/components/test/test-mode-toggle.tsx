"use client";

import { ClipboardList, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type TestMode = "custom" | "auto" | null;

interface TestModeToggleProps {
    mode: TestMode;
    onSelect: (mode: Exclude<TestMode, null>) => void;
    className?: string;
}

export function TestModeToggle({ mode, onSelect, className }: TestModeToggleProps) {
    return (
        <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-stretch", className)}>
            <button
                type="button"
                onClick={() => onSelect("custom")}
                className={cn(
                    "group flex-1 rounded-2xl border bg-black/40 px-5 py-4 text-left text-gray-300 backdrop-blur-md transition-all duration-300 hover:bg-gray-500/10",
                    mode === "custom"
                        ? "border-gray-300/60 bg-gray-500/10 shadow-[0_0_24px_rgba(156,163,175,0.16)]"
                        : "border-gray-500/30 hover:border-gray-400/50 hover:shadow-[0_0_24px_rgba(156,163,175,0.12)]"
                )}
            >
                <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-gray-500/20 p-3">
                        <ClipboardList size={22} className="text-gray-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold">Kiểm tra tự chọn</h3>
                            {mode === "custom" && (
                                <span className="rounded-full border border-gray-300/20 bg-gray-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-200">
                                    Đã chọn
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-400">
                            Chọn thủ công kiểu kiểm tra hoặc mức độ phù hợp với mục tiêu của bạn.
                        </p>
                    </div>
                </div>
            </button>

            <button
                type="button"
                onClick={() => onSelect("auto")}
                className={cn(
                    "group flex-1 rounded-2xl border px-5 py-4 text-left backdrop-blur-md transition-all duration-300",
                    mode === "auto"
                        ? "border-yellow-300/60 bg-yellow-400/15 text-yellow-50 shadow-[0_0_24px_rgba(250,204,21,0.18)]"
                        : "border-yellow-400/40 bg-yellow-400/10 text-yellow-100 hover:border-yellow-300/60 hover:bg-yellow-400/15 hover:shadow-[0_0_24px_rgba(250,204,21,0.16)]"
                )}
            >
                <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-yellow-400/20 p-3">
                        <WandSparkles size={22} className="text-yellow-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold">Kiểm tra tự động</h3>
                            {mode === "auto" && (
                                <span className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-200">
                                    Đã chọn
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-yellow-100/70">
                            Hệ thống AI tự tạo và phân phối nội dung ngay sau khi bạn chọn chế độ này.
                        </p>
                    </div>
                </div>
            </button>
        </div>
    );
}
