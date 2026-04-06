"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Book, GraduationCap, ClipboardCheck, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
    { name: "Trang chủ", href: "/", icon: <Home className="w-4 h-4" /> },
    { name: "Blogs", href: "/wiki", icon: <Book className="w-4 h-4" /> },
    { name: "Học tập", href: "/learn", icon: <GraduationCap className="w-4 h-4" /> },
    { name: "Kiểm tra", href: "/test", icon: <ClipboardCheck className="w-4 h-4" /> },
    { name: "Tài khoản", href: "/account", icon: <User className="w-4 h-4" /> },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <>
            <nav className="fixed top-6 left-1/2 z-50 hidden w-[95%] max-w-4xl -translate-x-1/2 sm:block">
                <div className="glass-panel flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-6 py-3 shadow-2xl backdrop-blur-xl">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Image src="/real_logo.png" alt="AI Coding Guru Logo" width={32} height={32} className="rounded-lg" />
                        <span className="font-heading font-bold tracking-tight text-starlight">AI Coding Guru</span>
                    </Link>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {navItems.map((item) => {
                            const isActive = item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "relative flex items-center gap-2 overflow-hidden rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300",
                                        isActive
                                            ? "text-accent-secondary"
                                            : "text-slate-400 hover:bg-white/5 hover:text-starlight"
                                    )}
                                >
                                    <span className={cn("transition-colors", isActive ? "text-accent-secondary" : "group-hover:text-starlight")}>
                                        {item.icon}
                                    </span>
                                    <span className="hidden md:block">{item.name}</span>

                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active"
                                            className="absolute inset-0 -z-10 rounded-lg border border-accent-secondary/20 bg-accent-secondary/10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <nav className="fixed inset-x-3 bottom-3 z-50 sm:hidden">
                <div className="glass-panel rounded-[1.75rem] border border-white/10 bg-black/65 px-2 py-2 shadow-2xl backdrop-blur-xl">
                    <div className="grid grid-cols-5 gap-1">
                        {navItems.map((item) => {
                            const isActive = item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all duration-300",
                                        isActive
                                            ? "text-accent-secondary"
                                            : "text-slate-400 active:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active-mobile"
                                            className="absolute inset-0 -z-10 rounded-2xl border border-accent-secondary/20 bg-accent-secondary/10"
                                            transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
                                        />
                                    )}
                                    <span>{item.icon}</span>
                                    <span className="text-center leading-tight">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
}
