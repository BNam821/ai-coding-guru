"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Tag, User, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface FilterBarProps {
    categories: string[];
    authors: string[];
}

export function FilterBar({ categories, authors }: FilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get("category");
    const currentAuthor = searchParams.get("author");

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/wiki?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push("/wiki");
    };

    return (
        <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={() => updateFilter("category", null)}
                    className={cn(
                        "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border backdrop-blur-md",
                        !currentCategory
                            ? "bg-accent-secondary text-black border-accent-secondary shadow-[0_0_15px_rgba(0,255,163,0.3)]"
                            : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                    )}
                >
                    Tất cả chuyên mục
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => updateFilter("category", cat)}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border backdrop-blur-md",
                            currentCategory === cat
                                ? "bg-accent-secondary text-black border-accent-secondary shadow-[0_0_15px_rgba(0,255,163,0.3)]"
                                : "bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Author Filter & Clear */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/5">
                <div className="flex items-center gap-4">
                    <span className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold flex items-center gap-2">
                        <User size={14} /> Lọc theo tác giả:
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {authors.map((auth) => (
                            <button
                                key={auth}
                                onClick={() => updateFilter("author", currentAuthor === auth ? null : auth)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border",
                                    currentAuthor === auth
                                        ? "bg-accent-primary/20 text-accent-primary border-accent-primary/40"
                                        : "bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white/60"
                                )}
                            >
                                {auth}
                            </button>
                        ))}
                    </div>
                </div>

                {(currentCategory || currentAuthor) && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <X size={14} /> Xóa tất cả bộ lọc
                    </button>
                )}
            </div>
        </div>
    );
}
