"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Book, ClipboardCheck, GraduationCap, Home, User } from "lucide-react";
import { AnnouncementWidget } from "@/components/ui/announcement-widget";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "\u0054\u0072\u0061\u006e\u0067\u0020\u0063\u0068\u1ee7", href: "/", icon: <Home className="h-4 w-4" /> },
    { name: "Blogs", href: "/wiki", icon: <Book className="h-4 w-4" /> },
    { name: "\u0048\u1ecd\u0063\u0020\u0074\u1ead\u0070", href: "/learn", icon: <GraduationCap className="h-4 w-4" /> },
    { name: "\u004b\u0069\u1ec3\u006d\u0020\u0074\u0072\u0061", href: "/test", icon: <ClipboardCheck className="h-4 w-4" /> },
];

type NavbarSession = {
    username: string | null;
    role: string | null;
    avatarUrl?: string | null;
};

function AccountButton({
    isLoggedIn,
    avatarUrl,
    avatarAlt,
    avatarInitial,
    isActive,
    className,
    mobile = false,
}: {
    isLoggedIn: boolean;
    avatarUrl?: string | null;
    avatarAlt: string;
    avatarInitial: string;
    isActive: boolean;
    className: string;
    mobile?: boolean;
}) {
    const avatarFrameClassName = cn(
        "relative flex items-center justify-center overflow-hidden rounded-full",
        mobile ? "h-10 w-10 border border-white/10 bg-white/5" : "h-full w-full",
    );

    return (
        <Link href="/dashboard" aria-label="\u0054\u00e0\u0069\u0020\u006b\u0068\u006f\u1ea3\u006e" className={className}>
            <span
                className={cn(
                    mobile
                        ? "relative mx-auto flex min-h-[4.25rem] w-full items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300"
                        : "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border transition-all duration-300",
                    mobile
                        ? isActive
                            ? "border-accent-secondary/20 bg-accent-secondary/10"
                            : "border-transparent bg-transparent active:bg-white/5"
                        : isActive
                            ? "border-accent-secondary/40 bg-accent-secondary/10 shadow-[0_0_24px_rgba(255,214,10,0.16)]"
                            : "border-white/10 bg-white/5 hover:bg-white/10",
                )}
            >
                {isLoggedIn && avatarUrl ? (
                    <span className={avatarFrameClassName}>
                        <Image
                            src={avatarUrl}
                            alt={avatarAlt}
                            fill
                            className="object-cover"
                            sizes={mobile ? "40px" : "44px"}
                        />
                    </span>
                ) : isLoggedIn ? (
                    <span
                        className={cn(
                            "text-sm font-semibold text-white",
                            mobile && "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5",
                        )}
                    >
                        {avatarInitial}
                    </span>
                ) : (
                    <span
                        className={cn(
                            mobile && "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5",
                        )}
                    >
                        <User className="h-5 w-5" />
                    </span>
                )}
            </span>
        </Link>
    );
}

export function Navbar() {
    const pathname = usePathname();
    const [session, setSession] = useState<NavbarSession | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadSession = async () => {
            try {
                const res = await fetch("/api/auth/session", { cache: "no-store" });
                const data = (await res.json()) as NavbarSession;
                if (isMounted) {
                    setSession(data);
                }
            } catch {
                if (isMounted) {
                    setSession({ username: null, role: null, avatarUrl: null });
                }
            }
        };

        void loadSession();

        return () => {
            isMounted = false;
        };
    }, [pathname]);

    const accountIsActive = pathname.startsWith("/account") || pathname.startsWith("/dashboard");
    const isLoggedIn = !!session?.username;
    const avatarAlt = session?.username || "\u0054\u00e0\u0069\u0020\u006b\u0068\u006f\u1ea3\u006e";
    const avatarInitial = session?.username?.charAt(0).toUpperCase() || "U";

    const accountButtonClassName = cn(
        "relative flex shrink-0 items-center justify-center transition-all duration-300",
        accountIsActive ? "text-accent-secondary" : "text-slate-300 hover:text-starlight",
    );

    return (
        <>
            <nav className="fixed top-6 left-1/2 z-50 hidden w-[95%] max-w-4xl -translate-x-1/2 sm:block">
                <div className="glass-panel flex items-center rounded-2xl border border-white/10 bg-black/40 px-6 py-3 shadow-2xl backdrop-blur-xl">
                    <Link href="/" className="group flex shrink-0 items-center gap-2">
                        <Image src="/real_logo.png" alt="AI Coding Guru Logo" width={32} height={32} className="rounded-lg" />
                        <span className="font-heading font-bold tracking-tight text-starlight">AI Coding Guru</span>
                    </Link>

                    <div className="flex flex-1 items-center justify-center px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                            {navItems.map((item) => {
                                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "relative flex items-center gap-2 overflow-hidden rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300",
                                            isActive ? "text-accent-secondary" : "text-slate-400 hover:bg-white/5 hover:text-starlight",
                                        )}
                                    >
                                        <span className="transition-colors">{item.icon}</span>
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

                    <div className="flex items-center gap-2">
                        <AccountButton
                            isLoggedIn={isLoggedIn}
                            avatarUrl={session?.avatarUrl}
                            avatarAlt={avatarAlt}
                            avatarInitial={avatarInitial}
                            isActive={accountIsActive}
                            className={accountButtonClassName}
                        />
                        <AnnouncementWidget />
                    </div>
                </div>
            </nav>

            <nav className="fixed inset-x-3 bottom-3 z-[60] sm:hidden">
                <div className="glass-panel rounded-[1.75rem] border border-white/10 bg-black/65 px-2 py-2 shadow-2xl backdrop-blur-xl">
                    <div className="grid grid-cols-6 gap-1">
                        {navItems.map((item) => {
                            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative flex min-h-[4.25rem] flex-col items-center justify-center rounded-2xl px-2 py-2 font-medium transition-all duration-300",
                                        isActive ? "text-accent-secondary" : "text-slate-400 active:bg-white/5",
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
                                </Link>
                            );
                        })}

                        <AccountButton
                            isLoggedIn={isLoggedIn}
                            avatarUrl={session?.avatarUrl}
                            avatarAlt={avatarAlt}
                            avatarInitial={avatarInitial}
                            isActive={accountIsActive}
                            className={accountButtonClassName}
                            mobile
                        />
                        <AnnouncementWidget panelSide="up" />
                    </div>
                </div>
            </nav>
        </>
    );
}
