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
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
            <div className="glass-panel px-6 py-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between shadow-2xl">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <Image src="/real_logo.png" alt="AI Coding Guru Logo" width={32} height={32} className="rounded-lg" />
                    <span className="font-heading font-bold text-starlight tracking-tight hidden sm:block">AI Coding Guru</span>
                </Link>

                {/* Nav Links */}
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
                                    "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 overflow-hidden",
                                    isActive
                                        ? "text-accent-secondary"
                                        : "text-slate-400 hover:text-starlight hover:bg-white/5"
                                )}
                            >
                                <span className={cn("transition-colors", isActive ? "text-accent-secondary" : "group-hover:text-starlight")}>
                                    {item.icon}
                                </span>
                                <span className="hidden md:block">{item.name}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="nav-active"
                                        className="absolute inset-0 bg-accent-secondary/10 rounded-lg -z-10 border border-accent-secondary/20"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
