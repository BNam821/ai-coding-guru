"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccountBackButton() {
    const router = useRouter();

    const handleBack = () => {
        let shouldGoDashboard = false;

        if (typeof window !== 'undefined') {
            const previousPath = sessionStorage.getItem("previousPath");
            if (previousPath && ['/', '/login'].includes(previousPath)) {
                shouldGoDashboard = true;
            }
        }

        if (shouldGoDashboard) {
            router.push('/dashboard');
        } else {
            router.back();
        }
    };

    return (
        <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group"
        >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại</span>
        </button>
    );
}
