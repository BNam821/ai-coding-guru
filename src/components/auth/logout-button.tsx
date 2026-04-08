"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
    iconOnly?: boolean;
}

export function LogoutButton({ iconOnly = false }: LogoutButtonProps) {
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
            className={
                iconOnly
                    ? "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
                    : "flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-red-400"
            }
            aria-label="Đăng xuất"
            title="Đăng xuất"
        >
            <LogOut size={16} />
            {!iconOnly && "Đăng xuất"}
        </button>
    );
}
