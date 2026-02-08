```typescript
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tag, User, X, Bookmark, ChevronDown, Filter } from "lucide-react";
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
    const showSaved = searchParams.get("showSaved") === "true";

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/ wiki ? ${ params.toString() } `);
    };

    const toggleSaved = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (showSaved) {
            params.delete("showSaved");
        } else {
            params.set("showSaved", "true");
        }
        router.push(`/ wiki ? ${ params.toString() } `);
    };

    return (
        <div className="flex flex-wrap items-center gap-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Filter Toggle Icon (Mobile/Visual) */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-accent-secondary">
                <Filter size={18} />
            </div>

            {/* Category Dropdown */}
            <div className="relative group">
                <select 
                    value={currentCategory || ""} 
                    onChange={(e) => updateFilter("category", e.target.value || null)}
                    className="appearance-none bg-white/5 border border-white/10 text-white/90 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 hover:bg-white/10 hover:border-accent-secondary/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent-secondary/20 cursor-pointer"
                >
                    <option value="" className="bg-deep-space text-white">Chuyên mục: Tất cả</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-deep-space text-white">{cat}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none group-hover:text-accent-secondary transition-colors" />
            </div>

            {/* Author Dropdown */}
            <div className="relative group">
                <select 
                    value={currentAuthor || ""} 
                    onChange={(e) => updateFilter("author", e.target.value || null)}
                    className="appearance-none bg-white/5 border border-white/10 text-white/90 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 hover:bg-white/10 hover:border-accent-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary/20 cursor-pointer"
                >
                    <option value="" className="bg-deep-space text-white">Tác giả: Tất cả</option>
                    {authors.map((author) => (
                        <option key={author} value={author} className="bg-deep-space text-white">{author}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none group-hover:text-accent-primary transition-colors" />
            </div>

            <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />

            {/* Saved Posts Toggle Button */}
            <button
                onClick={toggleSaved}
                className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all shadow-lg",
                    showSaved 
                        ? "bg-accent-primary border-accent-primary text-black shadow-accent-primary/20" 
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-accent-primary/30"
                )}
            >
                <Bookmark size={16} className={showSaved ? "fill-black" : ""} />
                Bài viết đã lưu
            </button>

            {/* Active Filters Summary (Visible only when filters are active) */}
            {(currentCategory || currentAuthor) && (
                <button 
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (showSaved) params.set("showSaved", "true");
                        router.push(`/ wiki ? ${ params.toString() } `);
                    }}
                    className="text-xs font-bold text-white/40 hover:text-red-400 flex items-center gap-1 transition-colors ml-auto px-2"
                >
                    <X size={14} /> Xóa lọc
                </button>
            )}
        </div>
    );
}
```
