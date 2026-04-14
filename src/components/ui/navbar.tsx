"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Book, ClipboardCheck, GraduationCap, Home, LayoutDashboard, LogOut, User, LogIn, UserPlus } from "lucide-react";
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
    isOpen,
    opensMenu,
    onClick,
    className,
    mobile = false,
}: {
    isLoggedIn: boolean;
    avatarUrl?: string | null;
    avatarAlt: string;
    avatarInitial: string;
    isActive: boolean;
    isOpen: boolean;
    opensMenu: boolean;
    onClick: () => void;
    className: string;
    mobile?: boolean;
}) {
    const avatarFrameClassName = cn(
        "relative flex items-center justify-center overflow-hidden rounded-full",
        mobile ? "h-10 w-10 border border-white/10 bg-white/5" : "h-full w-full",
    );

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="\u0054\u00e0\u0069\u0020\u006b\u0068\u006f\u1ea3\u006e"
            aria-haspopup={opensMenu ? "menu" : undefined}
            aria-expanded={opensMenu ? isOpen : undefined}
            className={cn(className, mobile && "w-full")}
        >
            <span
                className={cn(
                    mobile
                        ? "relative mx-auto flex min-h-[4.25rem] w-full items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300"
                        : "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border transition-all duration-300",
                    mobile
                        ? isActive || isOpen
                            ? "border-accent-secondary/20 bg-accent-secondary/10"
                            : "border-transparent bg-transparent active:bg-white/5"
                        : isActive || isOpen
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
        </button>
    );
}

function AccountMenuPanel({
    isLoggedIn,
    panelSide = "down",
    onNavigate,
    onRequestLogout,
}: {
    isLoggedIn: boolean;
    panelSide?: "up" | "down";
    onNavigate: () => void;
    onRequestLogout: () => void;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: panelSide === "down" ? -12 : 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: panelSide === "down" ? -8 : 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
                "absolute right-0 z-[70] w-max max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl border border-white/12 bg-black/80 p-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl",
                panelSide === "down" ? "top-full mt-3 origin-top-right" : "bottom-full mb-3 origin-bottom-right",
            )}
        >
            <div className="space-y-2">
                {isLoggedIn ? (
                    <>
                        <Link
                            href="/dashboard/account"
                            onClick={onNavigate}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/82 transition-colors hover:bg-white/[0.08] hover:text-white whitespace-nowrap"
                        >
                            <User className="h-4 w-4 text-white/60" />
                            <span>Tài khoản</span>
                        </Link>

                        <Link
                            href="/dashboard"
                            onClick={onNavigate}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/82 transition-colors hover:bg-white/[0.08] hover:text-white whitespace-nowrap"
                        >
                            <LayoutDashboard className="h-4 w-4 text-white/60" />
                            <span>Trung tâm quản lý</span>
                        </Link>

                        <button
                            type="button"
                            onClick={onRequestLogout}
                            className="flex w-full items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-100 transition-colors hover:bg-red-500/16 whitespace-nowrap"
                        >
                            <LogOut className="h-4 w-4 text-red-200" />
                            <span>Đăng xuất</span>
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            onClick={onNavigate}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/82 transition-colors hover:bg-white/[0.08] hover:text-white whitespace-nowrap"
                        >
                            <LogIn className="h-4 w-4 text-white/60" />
                            <span>Đăng nhập</span>
                        </Link>

                        <Link
                            href="/signup"
                            onClick={onNavigate}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/82 transition-colors hover:bg-white/[0.08] hover:text-white whitespace-nowrap"
                        >
                            <UserPlus className="h-4 w-4 text-white/60" />
                            <span>Đăng ký</span>
                        </Link>
                    </>
                )}
            </div>
        </motion.section>
    );
}

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [session, setSession] = useState<NavbarSession | null>(null);
    const [openAccountMenu, setOpenAccountMenu] = useState<"desktop" | "mobile" | null>(null);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const desktopAccountRef = useRef<HTMLDivElement | null>(null);
    const mobileAccountRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        setOpenAccountMenu(null);
    }, [pathname]);

    useEffect(() => {
        if (!openAccountMenu) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (desktopAccountRef.current?.contains(target) || mobileAccountRef.current?.contains(target)) {
                return;
            }

            setOpenAccountMenu(null);
        };

        document.addEventListener("mousedown", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [openAccountMenu]);

    useEffect(() => {
        if (!isLogoutConfirmOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isLoggingOut) {
                setIsLogoutConfirmOpen(false);
                setLogoutError(null);
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isLogoutConfirmOpen, isLoggingOut]);

    const accountIsActive = pathname.startsWith("/account") || pathname.startsWith("/dashboard");
    const isLoggedIn = !!session?.username;
    const avatarAlt = session?.username || "\u0054\u00e0\u0069\u0020\u006b\u0068\u006f\u1ea3\u006e";
    const avatarInitial = session?.username?.charAt(0).toUpperCase() || "U";

    const accountButtonClassName = cn(
        "relative flex shrink-0 items-center justify-center transition-all duration-300",
        accountIsActive ? "text-accent-secondary" : "text-slate-300 hover:text-starlight",
    );

    const handleAccountToggle = (surface: "desktop" | "mobile") => {
        setOpenAccountMenu((current) => current === surface ? null : surface);
    };

    const handleMenuNavigate = () => {
        setOpenAccountMenu(null);
    };

    const handleRequestLogout = () => {
        setOpenAccountMenu(null);
        setLogoutError(null);
        setIsLogoutConfirmOpen(true);
    };

    const handleConfirmLogout = async () => {
        try {
            setIsLoggingOut(true);
            setLogoutError(null);

            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (!res.ok) {
                throw new Error("Không thể đăng xuất lúc này.");
            }

            setSession({ username: null, role: null, avatarUrl: null });
            setIsLogoutConfirmOpen(false);
            router.push("/");
            router.refresh();
        } catch (error) {
            setLogoutError(error instanceof Error ? error.message : "Không thể đăng xuất lúc này.");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isLogoutConfirmOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="logout-confirm-title"
                            className="w-full max-w-md rounded-[2rem] border border-white/14 bg-[#0f0f10]/96 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.45)]"
                        >
                            <h2 id="logout-confirm-title" className="text-center text-xl font-semibold text-white">
                                Bạn có muốn đăng xuất không
                            </h2>
                            <p className="mt-3 text-center text-sm leading-6 text-white/55">
                                Bạn sẽ cần đăng nhập lại để truy cập tài khoản và trung tâm quản lý.
                            </p>

                            {logoutError ? (
                                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                    {logoutError}
                                </div>
                            ) : null}

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleConfirmLogout}
                                    disabled={isLoggingOut}
                                    className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoggingOut ? "Đang xử lý..." : "Có"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isLoggingOut) return;
                                        setIsLogoutConfirmOpen(false);
                                        setLogoutError(null);
                                    }}
                                    disabled={isLoggingOut}
                                    className="rounded-2xl border border-white/14 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Không
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <div ref={desktopAccountRef} className="relative z-[60]">
                            <AccountButton
                                isLoggedIn={isLoggedIn}
                                avatarUrl={session?.avatarUrl}
                                avatarAlt={avatarAlt}
                                avatarInitial={avatarInitial}
                                isActive={accountIsActive}
                                isOpen={openAccountMenu === "desktop"}
                                opensMenu={true}
                                onClick={() => handleAccountToggle("desktop")}
                                className={accountButtonClassName}
                            />
                            <AnimatePresence>
                                {openAccountMenu === "desktop" && (
                                    <AccountMenuPanel
                                        isLoggedIn={isLoggedIn}
                                        onNavigate={handleMenuNavigate}
                                        onRequestLogout={handleRequestLogout}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
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

                        <div ref={mobileAccountRef} className="relative col-span-1">
                            <AccountButton
                                isLoggedIn={isLoggedIn}
                                avatarUrl={session?.avatarUrl}
                                avatarAlt={avatarAlt}
                                avatarInitial={avatarInitial}
                                isActive={accountIsActive}
                                isOpen={openAccountMenu === "mobile"}
                                opensMenu={true}
                                onClick={() => handleAccountToggle("mobile")}
                                className={accountButtonClassName}
                                mobile
                            />
                            <AnimatePresence>
                                {openAccountMenu === "mobile" && (
                                    <AccountMenuPanel
                                        isLoggedIn={isLoggedIn}
                                        panelSide="up"
                                        onNavigate={handleMenuNavigate}
                                        onRequestLogout={handleRequestLogout}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                        <AnnouncementWidget panelSide="up" />
                    </div>
                </div>
            </nav>
        </>
    );
}
