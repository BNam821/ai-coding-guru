"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white font-semibold transition-all group py-2"
        >
            <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-lg group-hover:-translate-x-1">
                <ArrowLeft size={20} />
            </div>
            <span className="text-sm uppercase tracking-widest">Quay lại</span>
        </button>
    );
}
