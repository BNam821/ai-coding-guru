"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface AppNavLink {
    label: string;
    href: string;
    external?: boolean;
}

const appNavLinks: AppNavLink[] = [
    { label: "Trang chủ", href: "/" },
    { label: "Tổng quan", href: "/dashboard" },
    { label: "Học tập", href: "/learn" },
    { label: "GIthub", href: "https://github.com/BNam821/ai-coding-guru", external: true },
];

function isActive(pathname: string, href: string) {
    if (href === "/") {
        return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
    const pathname = usePathname();

    if (pathname.startsWith("/dashboard") || pathname.startsWith("/learn")) {
        return null;
    }

    if (pathname.startsWith("/account")) {
        return (
            <nav className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
                <Link
                    href="/dashboard"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-[#17191f] px-4 py-2 text-sm font-medium text-white/85 shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:px-5"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Quay lại tổng quan</span>
                </Link>
            </nav>
        );
    }

    return (
        <nav className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
            <div className="inline-flex rounded-[2rem] border border-white/10 bg-[#17191f] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-3">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {appNavLinks.map(({ label, href, external }) => (
                        <Link
                            key={label}
                            href={href}
                            aria-current={isActive(pathname, href) ? "page" : undefined}
                            target={external ? "_blank" : undefined}
                            rel={external ? "noopener noreferrer" : undefined}
                            className={
                                isActive(pathname, href)
                                    ? "inline-flex min-h-11 items-center justify-center rounded-full border border-[#f4e588]/50 bg-[#f4e588] px-4 py-2 text-sm font-medium text-[#151720] transition-colors sm:px-5"
                                    : "inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:px-5"
                            }
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
