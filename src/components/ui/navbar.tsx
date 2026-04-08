"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
    const pathname = usePathname();

    if (pathname.startsWith("/dashboard")) {
        return null;
    }

    return (
        <nav className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 p-2 shadow-2xl backdrop-blur-xl">
                <Link
                    href="/login"
                    className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-starlight transition-colors hover:bg-white/5 hover:text-accent-secondary sm:text-sm"
                >
                    Đăng nhập
                </Link>
                <Link
                    href="/signup"
                    className="rounded-full bg-accent-secondary px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-deep-space transition-all hover:shadow-[0_0_25px_rgba(0,223,154,0.45)] sm:text-sm"
                >
                    Đăng kí
                </Link>
            </div>
        </nav>
    );
}
