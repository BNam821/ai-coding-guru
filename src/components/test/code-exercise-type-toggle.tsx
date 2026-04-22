"use client";

import { Bug, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeExerciseType } from "@/lib/code-exercise";

interface CodeExerciseTypeToggleProps {
    value: CodeExerciseType;
    onChange: (value: CodeExerciseType) => void;
    className?: string;
}

export function CodeExerciseTypeToggle({ value, onChange, className }: CodeExerciseTypeToggleProps) {
    return (
        <div className={cn("grid gap-3 md:grid-cols-2", className)}>
            <button
                type="button"
                onClick={() => onChange("solve")}
                className={cn(
                    "rounded-2xl border px-5 py-4 text-left backdrop-blur-md transition-all duration-300",
                    value === "solve"
                        ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                        : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300/50 hover:bg-cyan-400/15"
                )}
            >
                <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-cyan-400/20 p-3">
                        <Wrench size={22} className="text-cyan-200" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold">Hoàn thiện code</h3>
                            {value === "solve" && (
                                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-100">
                                    Đang chọn
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-cyan-100/75">
                            Bắt đầu từ code khung và tự hoàn thiện lời giải theo đề bài gốc.
                        </p>
                    </div>
                </div>
            </button>

            <button
                type="button"
                onClick={() => onChange("fix_bug")}
                className={cn(
                    "rounded-2xl border px-5 py-4 text-left backdrop-blur-md transition-all duration-300",
                    value === "fix_bug"
                        ? "border-rose-300/60 bg-rose-400/15 text-rose-50 shadow-[0_0_24px_rgba(251,113,133,0.18)]"
                        : "border-rose-400/30 bg-rose-400/10 text-rose-100 hover:border-rose-300/50 hover:bg-rose-400/15"
                )}
            >
                <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-rose-400/20 p-3">
                        <Bug size={22} className="text-rose-200" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold">Sửa lỗi code</h3>
                            {value === "fix_bug" && (
                                <span className="rounded-full border border-rose-300/30 bg-rose-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-100">
                                    Đang chọn
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-rose-100/75">
                            AI tạo sẵn một phiên bản code gần hoàn chỉnh nhưng đã bị cài lỗi để bạn luyện debug thực tế.
                        </p>
                    </div>
                </div>
            </button>
        </div>
    );
}
