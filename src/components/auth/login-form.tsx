"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldAlert, User } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";

export function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [adminKey, setAdminKey] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminKey, setShowAdminKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const clickTimes = useRef<number[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleEyeClick = () => {
        setShowPassword(!showPassword);

        const now = Date.now();
        clickTimes.current.push(now);

        if (clickTimes.current.length > 5) {
            clickTimes.current.shift();
        }

        if (clickTimes.current.length === 5) {
            const firstClick = clickTimes.current[0];
            if (now - firstClick <= 2000) {
                setShowAdminKey(true);
                clickTimes.current = [];
            }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, adminKey: showAdminKey ? adminKey : undefined }),
            });

            const data = await res.json();

            if (data.success) {
                const redirectTarget = searchParams.get("redirect") || "/dashboard";
                router.refresh();
                router.push(redirectTarget);
            } else {
                setError(data.error);
            }
        } catch {
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GlassCard className="mx-auto max-w-md border-white/10 p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6 text-left">
                <header className="mb-8 space-y-2 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white">Đăng nhập</h2>
                    <p className="text-sm text-white/60">Chào mừng bạn quay trở lại</p>
                </header>

                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-500">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-white">Tài khoản / Email</label>
                    <div className="group relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent-primary">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white transition-all focus:border-accent-primary/50 focus:outline-none"
                            placeholder="Nhập username hoặc email"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-white">Mật khẩu</label>
                    <div className="group relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent-primary">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-white transition-all focus:border-accent-primary/50 focus:outline-none"
                            placeholder="Nhập mật khẩu"
                            required
                        />
                        <button
                            type="button"
                            onClick={handleEyeClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {showAdminKey && (
                    <div className="animate-in slide-in-from-top-2 fade-in space-y-2 duration-300">
                        <label className="ml-1 flex items-center gap-2 text-sm font-medium text-accent-secondary">
                            <ShieldAlert size={14} />
                            Secret Key (Admin)
                        </label>
                        <div className="group relative">
                            <input
                                type="password"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                className="w-full rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 px-4 py-3 text-white transition-all focus:border-accent-secondary focus:outline-none"
                                placeholder="Nhập mã bí mật"
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-center">
                    <NeonButton
                        type="submit"
                        variant="primary"
                        className="min-w-[220px] rounded-xl py-4 font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : "Đăng nhập ngay"}
                    </NeonButton>
                </div>

                <p className="text-center text-sm text-white/40">
                    Chưa có tài khoản?{" "}
                    <Link href="/signup" className="cursor-pointer text-accent-secondary hover:underline">
                        Đăng ký
                    </Link>
                </p>
            </form>
        </GlassCard>
    );
}

export const AdminLoginForm = LoginForm;
