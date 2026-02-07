"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NeonButton } from "@/components/ui/neon-button";

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (res.ok) {
            router.refresh();
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/40 hover:text-red-400 transition-colors text-sm font-medium"
        >
            <LogOut size={16} />
            Thoát quản trị
        </button>
    );
}
