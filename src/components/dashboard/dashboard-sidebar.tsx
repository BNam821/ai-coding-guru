import Image from "next/image";
import Link from "next/link";
import { BarChart3, BookOpen, ClipboardCheck, History, LayoutDashboard, User } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import type { DashboardUserSummary } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Học tập", href: "/learn", icon: BookOpen },
    { label: "Kiểm tra", href: "/test", icon: ClipboardCheck },
    { label: "Lịch sử", href: "/history", icon: History },
    { label: "Tài khoản", href: "/account", icon: User },
];

function UserAvatar({ user, sizeClass = "h-12 w-12" }: { user: DashboardUserSummary; sizeClass?: string }) {
    if (user.avatarUrl) {
        return (
            <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-white/5", sizeClass)}>
                <Image src={user.avatarUrl} alt={user.displayName} fill className="object-cover" />
            </div>
        );
    }

    return (
        <div className={cn("flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-semibold text-white", sizeClass)}>
            {(user.displayName[0] || user.username[0] || "U").toUpperCase()}
        </div>
    );
}

export function DashboardSidebar({ user }: { user: DashboardUserSummary }) {
    return (
        <>
            <div className="lg:hidden">
                <div className="mb-6 flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-[#17191f] px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4e588] text-[#151720]">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Tổng quan</p>
                            <p className="text-xs text-white/45">{user.displayName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <LogoutButton iconOnly />
                    </div>
                </div>

                <nav className="mb-6 grid grid-cols-5 gap-2 rounded-[1.5rem] border border-white/10 bg-[#17191f] p-2">
                    {navItems.map(({ label, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] text-white/55 transition-colors hover:bg-white/6 hover:text-white",
                                href === "/dashboard" && "bg-[#f4e588] text-[#151720]"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            <aside className="hidden lg:flex lg:w-[104px] lg:flex-col lg:justify-between lg:rounded-[2rem] lg:border lg:border-white/10 lg:bg-[#17191f] lg:px-4 lg:py-5">
                <div className="space-y-8">
                    <div className="px-1 text-center">
                        <p className="text-[17px] font-semibold leading-none tracking-tight text-[#cbbaf5]">Tổng</p>
                        <p className="mt-1 text-[17px] font-semibold leading-none tracking-tight text-white">quan</p>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                aria-label={label}
                                className={cn(
                                    "flex h-14 w-full items-center justify-center rounded-2xl border border-transparent text-white/55 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white",
                                    href === "/dashboard" && "border-[#f4e588]/40 bg-[#f4e588] text-[#151720]"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <UserAvatar user={user} />
                    </div>
                    <div className="flex justify-center">
                        <LogoutButton iconOnly />
                    </div>
                </div>
            </aside>
        </>
    );
}
